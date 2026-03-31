-- Temporary bridge for the initial imported player batch.
-- This lets new auth users claim their preloaded player record by exact normalized name.
-- Remove this migration logic after the initial onboarding wave is complete.

alter table public.players
  add column if not exists handedness text,
  add column if not exists level text;

create or replace function public.normalize_claim_name(input_name text)
returns text
language sql
immutable
as $$
  select lower(regexp_replace(trim(coalesce(input_name, '')), '\s+', ' ', 'g'));
$$;

create or replace function public.link_auth_user_to_existing_player(
  target_user_id uuid,
  input_name text,
  input_position text default null,
  input_handedness text default null,
  input_level text default null
)
returns uuid
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  normalized_name text := public.normalize_claim_name(input_name);
  normalized_position text := upper(trim(coalesce(input_position, '')));
  normalized_handedness text := upper(trim(coalesce(input_handedness, '')));
  normalized_level text := upper(trim(coalesce(input_level, '')));
  matched_player_id uuid;
begin
  if target_user_id is null or normalized_name = '' then
    return null;
  end if;

  select p.id
  into matched_player_id
  from public.players p
  where public.normalize_claim_name(p.name) = normalized_name
    and (p.user_id is null or p.user_id = target_user_id)
  order by p.created_at nulls last, p.id
  limit 1;

  if matched_player_id is null then
    return null;
  end if;

  update public.players
  set
    user_id = target_user_id,
    position = case
      when normalized_position in ('C', 'LW', 'RW', 'D', 'G') then normalized_position
      when upper(coalesce(position, '')) in ('', 'P', 'PLAYER', 'SKATER') then 'C'
      else upper(position)
    end,
    handedness = case
      when normalized_handedness in ('L', 'R') then normalized_handedness
      else handedness
    end,
    level = case
      when normalized_level in ('R', 'D', 'C', 'B', 'A', 'E') then normalized_level
      else level
    end
  where id = matched_player_id
    and (user_id is null or user_id = target_user_id);

  update public.player_teams
  set user_id = target_user_id
  where player_id = matched_player_id
    and (user_id is null or user_id = target_user_id);

  return matched_player_id;
end;
$$;

create or replace function public.claim_current_user_player_by_name()
returns uuid
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  current_user_id uuid := auth.uid();
  full_name text;
  profile_position text;
  profile_handedness text;
  profile_level text;
begin
  if current_user_id is null then
    return null;
  end if;

  select
    coalesce(raw_user_meta_data ->> 'full_name', ''),
    coalesce(raw_user_meta_data ->> 'primary_position', ''),
    coalesce(raw_user_meta_data ->> 'handedness', ''),
    coalesce(raw_user_meta_data ->> 'level', '')
  into
    full_name,
    profile_position,
    profile_handedness,
    profile_level
  from auth.users
  where id = current_user_id;

  return public.link_auth_user_to_existing_player(
    current_user_id,
    full_name,
    profile_position,
    profile_handedness,
    profile_level
  );
end;
$$;

grant execute on function public.claim_current_user_player_by_name() to authenticated;

create or replace function public.handle_new_auth_user_player_claim()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  perform public.link_auth_user_to_existing_player(
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.raw_user_meta_data ->> 'primary_position', ''),
    coalesce(new.raw_user_meta_data ->> 'handedness', ''),
    coalesce(new.raw_user_meta_data ->> 'level', '')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_claim_player_by_name on auth.users;

create trigger on_auth_user_created_claim_player_by_name
after insert on auth.users
for each row
execute function public.handle_new_auth_user_player_claim();

do $$
declare
  auth_row record;
begin
  for auth_row in
    select
      id,
      coalesce(raw_user_meta_data ->> 'full_name', '') as full_name,
      coalesce(raw_user_meta_data ->> 'primary_position', '') as primary_position,
      coalesce(raw_user_meta_data ->> 'handedness', '') as handedness,
      coalesce(raw_user_meta_data ->> 'level', '') as level
    from auth.users
  loop
    perform public.link_auth_user_to_existing_player(
      auth_row.id,
      auth_row.full_name,
      auth_row.primary_position,
      auth_row.handedness,
      auth_row.level
    );
  end loop;
end;
$$;
