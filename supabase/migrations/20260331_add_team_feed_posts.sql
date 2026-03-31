begin;

create table if not exists public.team_feed_posts (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  author_player_id uuid not null references public.players(id) on delete cascade,
  post_type text not null check (post_type in ('announcement', 'highlight', 'survey')),
  title text not null,
  body text not null,
  attachment_url text,
  poll_options jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists team_feed_posts_team_created_idx
  on public.team_feed_posts (team_id, created_at desc);

create index if not exists team_feed_posts_author_idx
  on public.team_feed_posts (author_player_id, created_at desc);

commit;
