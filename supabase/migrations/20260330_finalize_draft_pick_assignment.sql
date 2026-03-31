begin;

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

  insert into public.chat_room_members (room_id, player_id)
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
