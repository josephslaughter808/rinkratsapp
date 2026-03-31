-- Temporary bridge for the initial imported player batch.
-- This lets new auth users claim their preloaded player record by exact normalized name.
-- Remove this migration logic after the initial onboarding wave is complete.

create or replace function public.normalize_claim_name(input_name text)
returns text
language sql
immutable
as $$
  select lower(regexp_replace(trim(coalesce(input_name, '')), '\s+', ' ', 'g'));
$$;

create or replace function public.link_auth_user_to_existing_player(
  target_user_id uuid,
  input_name text
)
returns uuid
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  normalized_name text := public.normalize_claim_name(input_name);
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
      when upper(coalesce(position, '')) in ('', 'P', 'PLAYER', 'SKATER') then 'C'
      else upper(position)
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
begin
  if current_user_id is null then
    return null;
  end if;

  select coalesce(raw_user_meta_data ->> 'full_name', '')
  into full_name
  from auth.users
  where id = current_user_id;

  return public.link_auth_user_to_existing_player(current_user_id, full_name);
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
    coalesce(new.raw_user_meta_data ->> 'full_name', '')
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
    select id, coalesce(raw_user_meta_data ->> 'full_name', '') as full_name
    from auth.users
  loop
    perform public.link_auth_user_to_existing_player(auth_row.id, auth_row.full_name);
  end loop;
end;
$$;
