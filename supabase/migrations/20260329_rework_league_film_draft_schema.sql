begin;

-- =========================================================
-- 1. League-level join flow
-- =========================================================
-- Players should join a league with a code before they are assigned
-- to a team, sub list, or draft pool. That means the join code belongs
-- on the league, not on the team.

alter table public.leagues
  add column if not exists join_code text,
  add column if not exists commissioner_player_id uuid references public.players(id),
  add column if not exists description text;

create unique index if not exists leagues_join_code_key
  on public.leagues (join_code)
  where join_code is not null;

create table if not exists public.league_memberships (
  id uuid primary key default gen_random_uuid(),
  league_id uuid not null references public.leagues(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete cascade,
  status text not null default 'unassigned'
    check (status in ('unassigned', 'draft_pool', 'assigned_team', 'sub_list', 'inactive')),
  role text not null default 'player'
    check (role in ('league_manager', 'captain', 'assistant_captain', 'film_manager', 'player', 'sub')),
  assigned_team_id uuid references public.teams(id) on delete set null,
  joined_via_code text,
  joined_at timestamptz not null default now(),
  activated_at timestamptz,
  notes text,
  unique (league_id, player_id)
);

create index if not exists league_memberships_league_status_idx
  on public.league_memberships (league_id, status);

create index if not exists league_memberships_player_idx
  on public.league_memberships (player_id);

-- Optional backfill:
-- This assumes players.team_id and player_teams represent current assignments.
insert into public.league_memberships (
  league_id,
  player_id,
  status,
  role,
  assigned_team_id,
  joined_via_code,
  activated_at
)
select distinct
  coalesce(pt_team.league_id, p_team.league_id) as league_id,
  p.id as player_id,
  case
    when coalesce(pt.team_id, p.team_id) is null then 'unassigned'
    else 'assigned_team'
  end as status,
  coalesce(pt.role, p.role, 'player') as role,
  coalesce(pt.team_id, p.team_id) as assigned_team_id,
  coalesce(team_join.join_code, p_team.join_code),
  now()
from public.players p
left join public.player_teams pt on pt.player_id = p.id
left join public.teams pt_team on pt_team.id = pt.team_id
left join public.teams p_team on p_team.id = p.team_id
left join public.teams team_join on team_join.id = pt.team_id
where coalesce(pt_team.league_id, p_team.league_id) is not null
on conflict (league_id, player_id) do nothing;

-- =========================================================
-- 2. Keep roster assignment separate from league membership
-- =========================================================
-- player_teams can continue to represent actual roster/sub assignments.
-- We add league_id and assignment_status so it works better with drafts.

alter table public.player_teams
  add column if not exists league_id uuid references public.leagues(id),
  add column if not exists assignment_status text default 'rostered'
    check (assignment_status in ('rostered', 'sub', 'injured_reserve', 'released')),
  add column if not exists assigned_at timestamptz default now();

update public.player_teams pt
set league_id = t.league_id
from public.teams t
where pt.team_id = t.id
  and pt.league_id is null;

create index if not exists player_teams_league_idx
  on public.player_teams (league_id, team_id);

-- =========================================================
-- 3. Normalize chat membership keys
-- =========================================================
-- The current schema names a column user_id but points it at players(id).
-- Rename it so the model stays consistent.

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'chat_room_members'
      and column_name = 'user_id'
  ) then
    alter table public.chat_room_members
      rename column user_id to player_id;
  end if;
end $$;

alter table public.chat_room_members
  drop constraint if exists chat_room_members_user_id_fkey;

alter table public.chat_room_members
  add constraint chat_room_members_player_id_fkey
  foreign key (player_id) references public.players(id) on delete cascade;

create unique index if not exists chat_room_members_room_player_key
  on public.chat_room_members (room_id, player_id);

alter table public.chat_rooms
  add column if not exists league_id uuid references public.leagues(id) on delete cascade,
  add column if not exists name text,
  add column if not exists visibility text default 'members'
    check (visibility in ('members', 'captains_only', 'staff_only', 'league_public'));

create index if not exists chat_rooms_league_team_idx
  on public.chat_rooms (league_id, team_id, type);

-- =========================================================
-- 4. Add real film uploads and clips
-- =========================================================
-- video_clips is too thin for your workflow. We need:
-- full game film upload
-- clip start/end ranges
-- access rules
-- creator role

create table if not exists public.game_films (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games_v2(id) on delete cascade,
  uploaded_by_player_id uuid not null references public.players(id) on delete restrict,
  uploader_role text not null
    check (uploader_role in ('captain', 'assistant_captain', 'film_manager', 'league_manager')),
  source_url text not null,
  storage_path text,
  duration_seconds integer,
  visibility text not null default 'team_season'
    check (visibility in ('team_season', 'league_staff', 'public_highlights_only')),
  uploaded_at timestamptz not null default now(),
  processed_at timestamptz,
  notes text
);

create index if not exists game_films_game_idx
  on public.game_films (game_id, uploaded_at desc);

create table if not exists public.game_clips (
  id uuid primary key default gen_random_uuid(),
  film_id uuid not null references public.game_films(id) on delete cascade,
  game_id uuid not null references public.games_v2(id) on delete cascade,
  created_by_player_id uuid not null references public.players(id) on delete restrict,
  title text not null,
  description text,
  clip_type text not null
    check (clip_type in ('goal', 'assist', 'hit', 'penalty', 'save', 'shift', 'custom')),
  period integer,
  game_clock_seconds integer,
  start_seconds integer not null,
  end_seconds integer not null,
  published boolean not null default true,
  visibility text not null default 'team'
    check (visibility in ('team', 'league_staff', 'public')),
  created_at timestamptz not null default now(),
  check (end_seconds > start_seconds)
);

create index if not exists game_clips_game_idx
  on public.game_clips (game_id, created_at desc);

create index if not exists game_clips_film_idx
  on public.game_clips (film_id);

-- Optional backfill from the old simple table.
insert into public.game_films (
  game_id,
  uploaded_by_player_id,
  uploader_role,
  source_url,
  visibility,
  notes
)
select distinct
  vc.game_id,
  vc.player_id,
  'film_manager',
  vc.url,
  'team_season',
  'Backfilled from legacy video_clips.url'
from public.video_clips vc
where vc.game_id is not null
  and vc.player_id is not null
on conflict do nothing;

insert into public.game_clips (
  film_id,
  game_id,
  created_by_player_id,
  title,
  description,
  clip_type,
  start_seconds,
  end_seconds
)
select
  gf.id,
  vc.game_id,
  vc.player_id,
  coalesce(vc.description, 'Legacy clip'),
  vc.description,
  'custom',
  greatest(coalesce(vc.timestamp_seconds, 0) - 5, 0),
  coalesce(vc.timestamp_seconds, 0) + 10
from public.video_clips vc
join public.game_films gf
  on gf.game_id = vc.game_id
 and gf.uploaded_by_player_id = vc.player_id
where vc.game_id is not null
  and vc.player_id is not null
on conflict do nothing;

-- =========================================================
-- 5. Event-level stat tagging for highlights
-- =========================================================
-- Aggregate game_stats is still useful, but highlights require event-level
-- objects so one goal can point to a clip and multiple involved players.

create table if not exists public.game_events (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games_v2(id) on delete cascade,
  clip_id uuid references public.game_clips(id) on delete set null,
  team_id uuid references public.teams(id) on delete set null,
  event_type text not null
    check (event_type in ('goal', 'assist', 'hit', 'penalty', 'save', 'shot', 'faceoff', 'custom')),
  period integer,
  period_clock text,
  created_by_player_id uuid references public.players(id) on delete set null,
  created_at timestamptz not null default now(),
  notes text
);

create index if not exists game_events_game_idx
  on public.game_events (game_id, created_at);

create table if not exists public.game_event_players (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.game_events(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete cascade,
  involvement_role text not null
    check (involvement_role in (
      'scorer',
      'primary_assist',
      'secondary_assist',
      'hitter',
      'hit_taken',
      'penalized_player',
      'drawn_by',
      'goalie',
      'shooter',
      'other'
    )),
  penalty_type text,
  team_id uuid references public.teams(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists game_event_players_event_idx
  on public.game_event_players (event_id);

create index if not exists game_event_players_player_idx
  on public.game_event_players (player_id, involvement_role);

-- =========================================================
-- 6. Make drafts work off real joined players, not a separate person table
-- =========================================================
-- The current draft_players table duplicates player identity. Since users
-- already create accounts and join leagues, the draft should point back to
-- public.players plus league membership.

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

-- Backfill draft_pool_entries from the old draft_players table where possible.
insert into public.draft_pool_entries (
  draft_id,
  player_id,
  status,
  declared_position,
  level,
  previous_team_label,
  season_goals
)
select
  dpq.draft_id,
  p.id as player_id,
  case
    when exists (
      select 1
      from public.draft_picks dpk
      where dpk.draft_id = dpq.draft_id
        and dpk.player_id = dp.id
    ) then 'drafted'
    else 'available'
  end,
  dp.position,
  dp.level,
  dp.team,
  dp.goals_last_season
from public.draft_players dp
join public.players p on lower(trim(p.name)) = lower(trim(dp.name))
join public.draft_queue dpq on dpq.player_id = dp.id
on conflict (draft_id, player_id) do nothing;

-- =========================================================
-- 7. Add scheduling fields games need for dashboard and week views
-- =========================================================

alter table public.games_v2
  add column if not exists week integer,
  add column if not exists status text default 'scheduled'
    check (status in ('scheduled', 'live', 'final', 'cancelled')),
  add column if not exists rink text,
  add column if not exists film_uploaded boolean not null default false;

create index if not exists games_v2_league_season_week_idx
  on public.games_v2 (league_id, season, week, date);

-- =========================================================
-- 8. Add team feed table
-- =========================================================
-- Feed is separate from chat because only captains and assistants post.

create table if not exists public.team_feed_posts (
  id uuid primary key default gen_random_uuid(),
  league_id uuid not null references public.leagues(id) on delete cascade,
  team_id uuid not null references public.teams(id) on delete cascade,
  author_player_id uuid not null references public.players(id) on delete restrict,
  title text not null,
  body text not null,
  clip_id uuid references public.game_clips(id) on delete set null,
  game_film_id uuid references public.game_films(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists team_feed_posts_team_created_idx
  on public.team_feed_posts (team_id, created_at desc);

-- =========================================================
-- 9. Cleanup notes for later
-- =========================================================
-- Once the app is switched over and data is verified, these legacy pieces
-- are good candidates for cleanup:
--   public.teams.join_code
--   public.players.team_id
--   public.players.role
--   public.draft_players
--   public.video_clips
--
-- I am intentionally not dropping them in this migration.

commit;
