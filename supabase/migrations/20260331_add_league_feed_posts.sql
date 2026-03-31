begin;

create table if not exists public.league_feed_posts (
  id uuid primary key default gen_random_uuid(),
  league_id uuid not null references public.leagues(id) on delete cascade,
  author_player_id uuid not null references public.players(id) on delete cascade,
  post_type text not null check (post_type in ('announcement', 'highlight', 'survey')),
  title text not null,
  body text not null,
  attachment_url text,
  poll_options jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists league_feed_posts_league_created_idx
  on public.league_feed_posts (league_id, created_at desc);

create index if not exists league_feed_posts_author_idx
  on public.league_feed_posts (author_player_id, created_at desc);

create or replace function public.is_league_member(p_league_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.league_memberships lm
    where lm.league_id = p_league_id
      and lm.player_id = public.current_player_id()
  )
$$;

create or replace function public.is_league_commissioner(p_league_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.teams t
    where t.league_id = p_league_id
      and t.owner_id = auth.uid()
  )
  or exists (
    select 1
    from public.player_teams pt
    join public.teams t on t.id = pt.team_id
    where t.league_id = p_league_id
      and pt.user_id = auth.uid()
      and pt.role = 'commissioner'
  )
$$;

alter table public.league_feed_posts enable row level security;

drop policy if exists "league_feed_posts_select_members" on public.league_feed_posts;
create policy "league_feed_posts_select_members"
on public.league_feed_posts
for select
using (
  public.is_league_member(league_feed_posts.league_id)
  or public.is_league_commissioner(league_feed_posts.league_id)
);

drop policy if exists "league_feed_posts_insert_leadership" on public.league_feed_posts;
create policy "league_feed_posts_insert_leadership"
on public.league_feed_posts
for insert
with check (
  author_player_id = public.current_player_id()
  and (
    public.has_league_role(league_feed_posts.league_id, array['captain'])
    or public.is_league_commissioner(league_feed_posts.league_id)
  )
);

drop policy if exists "league_feed_posts_update_leadership" on public.league_feed_posts;
create policy "league_feed_posts_update_leadership"
on public.league_feed_posts
for update
using (
  public.has_league_role(league_feed_posts.league_id, array['captain'])
  or public.is_league_commissioner(league_feed_posts.league_id)
)
with check (
  public.has_league_role(league_feed_posts.league_id, array['captain'])
  or public.is_league_commissioner(league_feed_posts.league_id)
);

commit;
