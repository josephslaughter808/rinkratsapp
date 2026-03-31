begin;

alter table public.teams
  add column if not exists youtube_channel_url text;

alter table public.games_v2
  add column if not exists status text default 'scheduled'
    check (status in ('scheduled', 'live', 'final', 'cancelled')),
  add column if not exists rink text,
  add column if not exists film_uploaded boolean not null default false;

create table if not exists public.game_films (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games_v2(id) on delete cascade,
  uploaded_by_player_id uuid not null references public.players(id) on delete restrict,
  uploader_role text not null
    check (uploader_role in ('captain', 'assistant_captain', 'film_manager')),
  source_url text not null,
  visibility text not null default 'team_season'
    check (visibility in ('team_season', 'league_staff', 'public_highlights_only')),
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists game_films_game_created_idx
  on public.game_films (game_id, created_at desc);

create table if not exists public.game_clips (
  id uuid primary key default gen_random_uuid(),
  film_id uuid not null references public.game_films(id) on delete cascade,
  game_id uuid not null references public.games_v2(id) on delete cascade,
  created_by_player_id uuid not null references public.players(id) on delete restrict,
  title text not null,
  description text,
  clip_type text not null
    check (clip_type in ('goal', 'assist', 'hit', 'penalty', 'save', 'custom')),
  start_seconds integer not null,
  end_seconds integer not null,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  check (end_seconds > start_seconds)
);

create index if not exists game_clips_game_created_idx
  on public.game_clips (game_id, created_at desc);

create table if not exists public.game_clip_players (
  id uuid primary key default gen_random_uuid(),
  clip_id uuid not null references public.game_clips(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete cascade,
  involvement_role text not null
    check (involvement_role in ('featured', 'scorer', 'primary_assist', 'secondary_assist', 'hitter', 'penalized_player', 'goalie', 'other')),
  created_at timestamptz not null default now()
);

create index if not exists game_clip_players_player_idx
  on public.game_clip_players (player_id, involvement_role);

commit;
