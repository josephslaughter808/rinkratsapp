begin;

alter table public.players
  add column if not exists handedness text check (handedness in ('L', 'R')),
  add column if not exists level text check (level in ('R', 'D', 'C', 'B', 'A', 'E'));

update public.players
set position = 'C'
where coalesce(upper(position), '') in ('', 'P', 'PLAYER', 'SKATER');

create table if not exists public.league_memberships (
  id uuid primary key default gen_random_uuid(),
  league_id uuid not null references public.leagues(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete cascade,
  status text not null default 'unassigned'
    check (status in ('unassigned', 'draft_pool', 'assigned_team', 'sub_list', 'inactive')),
  role text not null default 'player',
  assigned_team_id uuid references public.teams(id) on delete set null,
  activated_at timestamptz,
  created_at timestamptz not null default now(),
  unique (league_id, player_id)
);

alter table public.player_teams
  add column if not exists league_id uuid references public.leagues(id) on delete set null,
  add column if not exists assignment_status text default 'rostered'
    check (assignment_status in ('rostered', 'sub_list', 'draft_pool', 'inactive')),
  add column if not exists assigned_at timestamptz;

update public.player_teams pt
set league_id = t.league_id,
    assigned_at = coalesce(pt.assigned_at, pt.created_at)
from public.teams t
where t.id = pt.team_id
  and pt.league_id is null;

insert into public.league_memberships (
  league_id,
  player_id,
  status,
  role,
  assigned_team_id,
  activated_at
)
select
  t.league_id,
  pt.player_id,
  case
    when coalesce(pt.assignment_status, 'rostered') = 'sub_list' then 'sub_list'
    else 'assigned_team'
  end,
  coalesce(pt.role, 'player'),
  pt.team_id,
  coalesce(pt.assigned_at, pt.created_at, now())
from public.player_teams pt
join public.teams t on t.id = pt.team_id
where pt.player_id is not null
  and t.league_id is not null
on conflict (league_id, player_id)
do update set
  status = excluded.status,
  role = excluded.role,
  assigned_team_id = excluded.assigned_team_id,
  activated_at = coalesce(public.league_memberships.activated_at, excluded.activated_at);

create table if not exists public.draft_pool_entries (
  id uuid primary key default gen_random_uuid(),
  draft_id uuid not null references public.drafts(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete cascade,
  league_membership_id uuid references public.league_memberships(id) on delete set null,
  status text not null default 'available'
    check (status in ('available', 'queued', 'drafted', 'withdrawn')),
  declared_position text,
  level text,
  previous_team_label text,
  season_points integer,
  season_goals integer,
  created_at timestamptz not null default now(),
  unique (draft_id, player_id)
);

create index if not exists draft_pool_entries_draft_status_idx
  on public.draft_pool_entries (draft_id, status);

alter table public.draft_queue
  add column if not exists draft_pool_entry_id uuid references public.draft_pool_entries(id) on delete cascade;

alter table public.draft_picks
  add column if not exists draft_pool_entry_id uuid references public.draft_pool_entries(id) on delete set null,
  add column if not exists picked_by_player_id uuid references public.players(id) on delete set null;

create or replace function public.setup_live_draft(
  p_league_id uuid,
  p_pick_duration_seconds integer default 600,
  p_draft_datetime timestamptz default now()
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_draft_id uuid;
  v_season text;
  v_team_count integer;
  v_pool_count integer;
begin
  select season into v_season
  from public.leagues
  where id = p_league_id;

  if v_season is null then
    raise exception 'League % was not found', p_league_id;
  end if;

  update public.drafts
  set is_active = false
  where season = v_season
    and is_active = true;

  insert into public.drafts (
    season,
    draft_datetime,
    is_active,
    current_pick,
    pick_duration_seconds,
    pick_start_time
  )
  values (
    v_season,
    p_draft_datetime,
    true,
    1,
    p_pick_duration_seconds,
    now()
  )
  returning id into v_draft_id;

  insert into public.league_memberships (
    league_id,
    player_id,
    status,
    role
  )
  select
    p_league_id,
    p.id,
    'draft_pool',
    'player'
  from public.players p
  where not exists (
    select 1
    from public.player_teams pt
    join public.teams t on t.id = pt.team_id
    where pt.player_id = p.id
      and t.league_id = p_league_id
  )
  on conflict (league_id, player_id)
  do update set status = 'draft_pool';

  insert into public.draft_pool_entries (
    draft_id,
    player_id,
    league_membership_id,
    status,
    declared_position,
    level,
    previous_team_label,
    season_points,
    season_goals
  )
  select
    v_draft_id,
    p.id,
    lm.id,
    'available',
    coalesce(nullif(upper(p.position), 'P'), 'C'),
    p.level,
    t.name,
    ss.points,
    ss.goals
  from public.players p
  left join public.league_memberships lm
    on lm.player_id = p.id
   and lm.league_id = p_league_id
  left join public.season_stats ss
    on ss.player_id = p.id
   and ss.season = v_season
  left join public.teams t
    on t.id = ss.team_id
  where not exists (
    select 1
    from public.player_teams pt
    join public.teams existing_team on existing_team.id = pt.team_id
    where pt.player_id = p.id
      and existing_team.league_id = p_league_id
  )
  on conflict (draft_id, player_id) do nothing;

  select count(*) into v_team_count
  from public.teams
  where league_id = p_league_id;

  select count(*) into v_pool_count
  from public.draft_pool_entries
  where draft_id = v_draft_id
    and status = 'available';

  if v_team_count = 0 then
    raise exception 'League % has no teams', p_league_id;
  end if;

  if v_pool_count = 0 then
    raise exception 'League % has no available players for the draft pool', p_league_id;
  end if;

  with ordered_teams as (
    select
      id,
      row_number() over (order by name, id) as slot
    from public.teams
    where league_id = p_league_id
  ),
  rounds as (
    select generate_series(1, ceil(v_pool_count::numeric / v_team_count::numeric)::int) as round_num
  ),
  picks as (
    select generate_series(1, v_team_count) as pick_in_round
  )
  insert into public.draft_picks (
    draft_id,
    round,
    pick_number,
    team_id,
    "timestamp"
  )
  select
    v_draft_id,
    rounds.round_num,
    picks.pick_in_round,
    ordered_teams.id,
    null
  from rounds
  cross join picks
  join ordered_teams
    on ordered_teams.slot =
      case
        when mod(rounds.round_num, 2) = 1 then picks.pick_in_round
        else v_team_count - picks.pick_in_round + 1
      end
  where ((rounds.round_num - 1) * v_team_count + picks.pick_in_round) <= v_pool_count
  order by rounds.round_num, picks.pick_in_round;

  return v_draft_id;
end;
$$;

create or replace function public.finalize_draft_pick(
  p_draft_pick_id uuid,
  p_draft_pool_entry_id uuid,
  p_team_id uuid,
  p_picked_by_player_id uuid default null
)
returns table (
  draft_pick_id uuid,
  drafted_player_id uuid,
  assigned_team_id uuid
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_draft_id uuid;
  v_player_id uuid;
  v_user_id uuid;
  v_league_id uuid;
begin
  select dp.draft_id
  into v_draft_id
  from public.draft_picks dp
  where dp.id = p_draft_pick_id;

  if v_draft_id is null then
    raise exception 'Draft pick % was not found', p_draft_pick_id;
  end if;

  select dpe.player_id
  into v_player_id
  from public.draft_pool_entries dpe
  where dpe.id = p_draft_pool_entry_id
    and dpe.draft_id = v_draft_id
    and dpe.status = 'available';

  if v_player_id is null then
    raise exception 'Draft pool entry % is not available for this draft', p_draft_pool_entry_id;
  end if;

  select t.league_id
  into v_league_id
  from public.teams t
  where t.id = p_team_id;

  if v_league_id is null then
    raise exception 'Team % was not found or is missing league_id', p_team_id;
  end if;

  select p.user_id
  into v_user_id
  from public.players p
  where p.id = v_player_id;

  update public.draft_picks
  set team_id = p_team_id,
      draft_pool_entry_id = p_draft_pool_entry_id,
      picked_by_player_id = p_picked_by_player_id,
      "timestamp" = now()
  where id = p_draft_pick_id;

  update public.draft_pool_entries
  set status = 'drafted'
  where id = p_draft_pool_entry_id;

  insert into public.league_memberships (
    league_id,
    player_id,
    status,
    role,
    assigned_team_id,
    activated_at
  )
  values (
    v_league_id,
    v_player_id,
    'assigned_team',
    'player',
    p_team_id,
    now()
  )
  on conflict (league_id, player_id)
  do update
    set status = 'assigned_team',
        assigned_team_id = excluded.assigned_team_id,
        activated_at = coalesce(public.league_memberships.activated_at, excluded.activated_at);

  update public.players
  set team_id = p_team_id
  where id = v_player_id;

  insert into public.player_teams (
    user_id,
    team_id,
    role,
    player_id,
    league_id,
    assignment_status,
    assigned_at
  )
  select
    v_user_id,
    p_team_id,
    'player',
    v_player_id,
    v_league_id,
    'rostered',
    now()
  where not exists (
    select 1
    from public.player_teams pt
    where pt.player_id = v_player_id
      and pt.team_id = p_team_id
  );

  insert into public.chat_room_members (room_id, user_id)
  select cr.id, v_player_id
  from public.chat_rooms cr
  where cr.team_id = p_team_id
  on conflict do nothing;

  update public.drafts
  set current_pick = coalesce(current_pick, 1) + 1,
      pick_start_time = now()
  where id = v_draft_id;

  return query
  select p_draft_pick_id, v_player_id, p_team_id;
end;
$$;

commit;
