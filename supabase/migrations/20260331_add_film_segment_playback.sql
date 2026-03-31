begin;

alter table public.games_v2
  add column if not exists puck_drop_clock text,
  add column if not exists film_end_clock text;

alter table public.game_films
  add column if not exists segment_order integer not null default 1,
  add column if not exists segment_start_clock text,
  add column if not exists segment_end_clock text;

create index if not exists game_films_game_segment_order_idx
  on public.game_films (game_id, segment_order asc, created_at asc);

commit;
