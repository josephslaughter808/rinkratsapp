begin;

create or replace function public.current_player_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select p.id
  from public.players p
  where p.user_id = auth.uid()
  order by p.created_at asc
  limit 1
$$;

create or replace function public.is_team_member(p_team_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.player_teams pt
    where pt.user_id = auth.uid()
      and pt.team_id = p_team_id
  )
$$;

create or replace function public.has_team_role(p_team_id uuid, p_roles text[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.player_teams pt
    where pt.user_id = auth.uid()
      and pt.team_id = p_team_id
      and pt.role = any (p_roles)
  )
$$;

create or replace function public.has_league_role(p_league_id uuid, p_roles text[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.player_teams pt
    join public.teams t on t.id = pt.team_id
    where pt.user_id = auth.uid()
      and t.league_id = p_league_id
      and pt.role = any (p_roles)
  )
$$;

create or replace function public.can_view_game_film(p_game_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.games_v2 g
    where g.id = p_game_id
      and (
        public.is_team_member(g.home_team_id)
        or public.is_team_member(g.away_team_id)
        or public.has_league_role(g.league_id, array['captain', 'assistant_captain', 'film_manager'])
      )
  )
$$;

alter table public.chat_rooms enable row level security;
alter table public.chat_room_members enable row level security;
alter table public.chat_messages enable row level security;
alter table public.team_feed_posts enable row level security;
alter table public.game_films enable row level security;
alter table public.game_clips enable row level security;
alter table public.game_clip_players enable row level security;

drop policy if exists "chat_rooms_select_member" on public.chat_rooms;
create policy "chat_rooms_select_member"
on public.chat_rooms
for select
using (
  exists (
    select 1
    from public.chat_room_members crm
    where crm.room_id = chat_rooms.id
      and crm.user_id = public.current_player_id()
  )
);

drop policy if exists "chat_room_members_select_self_or_staff" on public.chat_room_members;
create policy "chat_room_members_select_self_or_staff"
on public.chat_room_members
for select
using (
  user_id = public.current_player_id()
  or exists (
    select 1
    from public.chat_rooms cr
    where cr.id = chat_room_members.room_id
      and public.has_team_role(cr.team_id, array['captain', 'assistant_captain', 'film_manager'])
  )
);

drop policy if exists "chat_room_members_insert_self_or_staff" on public.chat_room_members;
create policy "chat_room_members_insert_self_or_staff"
on public.chat_room_members
for insert
with check (
  user_id = public.current_player_id()
  or exists (
    select 1
    from public.chat_rooms cr
    where cr.id = chat_room_members.room_id
      and public.has_team_role(cr.team_id, array['captain', 'assistant_captain', 'film_manager'])
  )
);

drop policy if exists "chat_messages_select_member" on public.chat_messages;
create policy "chat_messages_select_member"
on public.chat_messages
for select
using (
  exists (
    select 1
    from public.chat_room_members crm
    where crm.room_id = chat_messages.room_id
      and crm.user_id = public.current_player_id()
  )
);

drop policy if exists "chat_messages_insert_sender_member" on public.chat_messages;
create policy "chat_messages_insert_sender_member"
on public.chat_messages
for insert
with check (
  sender_id = public.current_player_id()
  and exists (
    select 1
    from public.chat_room_members crm
    where crm.room_id = chat_messages.room_id
      and crm.user_id = public.current_player_id()
  )
);

drop policy if exists "team_feed_posts_select_member" on public.team_feed_posts;
create policy "team_feed_posts_select_member"
on public.team_feed_posts
for select
using (public.is_team_member(team_feed_posts.team_id));

drop policy if exists "team_feed_posts_insert_leadership" on public.team_feed_posts;
create policy "team_feed_posts_insert_leadership"
on public.team_feed_posts
for insert
with check (
  author_player_id = public.current_player_id()
  and public.has_team_role(team_feed_posts.team_id, array['captain', 'assistant_captain'])
);

drop policy if exists "team_feed_posts_update_leadership" on public.team_feed_posts;
create policy "team_feed_posts_update_leadership"
on public.team_feed_posts
for update
using (public.has_team_role(team_feed_posts.team_id, array['captain', 'assistant_captain']))
with check (public.has_team_role(team_feed_posts.team_id, array['captain', 'assistant_captain']));

drop policy if exists "game_films_select_allowed" on public.game_films;
create policy "game_films_select_allowed"
on public.game_films
for select
using (public.can_view_game_film(game_films.game_id));

drop policy if exists "game_films_insert_staff" on public.game_films;
create policy "game_films_insert_staff"
on public.game_films
for insert
with check (
  uploaded_by_player_id = public.current_player_id()
  and exists (
    select 1
    from public.games_v2 g
    where g.id = game_films.game_id
      and public.has_league_role(g.league_id, array['captain', 'assistant_captain', 'film_manager'])
  )
);

drop policy if exists "game_clips_select_allowed" on public.game_clips;
create policy "game_clips_select_allowed"
on public.game_clips
for select
using (public.can_view_game_film(game_clips.game_id));

drop policy if exists "game_clips_insert_staff" on public.game_clips;
create policy "game_clips_insert_staff"
on public.game_clips
for insert
with check (
  created_by_player_id = public.current_player_id()
  and public.can_view_game_film(game_clips.game_id)
);

drop policy if exists "game_clip_players_select_allowed" on public.game_clip_players;
create policy "game_clip_players_select_allowed"
on public.game_clip_players
for select
using (
  exists (
    select 1
    from public.game_clips gc
    where gc.id = game_clip_players.clip_id
      and public.can_view_game_film(gc.game_id)
  )
);

drop policy if exists "game_clip_players_insert_staff" on public.game_clip_players;
create policy "game_clip_players_insert_staff"
on public.game_clip_players
for insert
with check (
  exists (
    select 1
    from public.game_clips gc
    where gc.id = game_clip_players.clip_id
      and public.can_view_game_film(gc.game_id)
  )
);

commit;
