-- Ejecuta esto si quieres dejar la base lista para sincronización automática.
-- Si ya tienes tablas, revisa los ALTER TABLE al final.

create table if not exists public.games (
  id bigint generated always as identity primary key,
  provider_id text unique,
  home_team text,
  away_team text,
  home_score integer,
  away_score integer,
  status text,
  game_date date,
  game_time time,
  venue text,
  city text,
  featured boolean default false,
  pool text,
  provider_source text default 'manual',
  updated_at timestamptz default now()
);

create table if not exists public.standings (
  id bigint generated always as identity primary key,
  pool text,
  team_name text,
  wins integer,
  losses integer,
  pct text,
  sort_order integer,
  updated_at timestamptz default now(),
  unique (pool, team_name)
);

create table if not exists public.batting_leaders (
  id bigint generated always as identity primary key,
  player_name text,
  team_abbr text,
  avg text,
  hr integer,
  rbi integer,
  sort_order integer,
  updated_at timestamptz default now()
);

create table if not exists public.pitching_leaders (
  id bigint generated always as identity primary key,
  player_name text,
  team_abbr text,
  era text,
  ip text,
  so integer,
  sort_order integer,
  updated_at timestamptz default now()
);

create table if not exists public.news_items (
  id bigint generated always as identity primary key,
  title text,
  summary text,
  published_label text,
  updated_at timestamptz default now()
);

create table if not exists public.team_pool_map (
  team_name text primary key,
  pool text not null
);

insert into public.team_pool_map (team_name, pool) values
('Dominican Rep.', 'D'),
('República Dominicana', 'D'),
('Dominican Republic', 'D'),
('Venezuela', 'D'),
('Israel', 'D'),
('Netherlands', 'D'),
('Países Bajos', 'D'),
('Nicaragua', 'D'),
('Canada', 'A'),
('Colombia', 'A'),
('Cuba', 'A'),
('Panama', 'A'),
('Puerto Rico', 'A'),
('United States', 'C'),
('USA', 'C'),
('Mexico', 'C'),
('México', 'C'),
('Italy', 'C'),
('Italia', 'C'),
('Great Britain', 'C'),
('Canada', 'C'),
('Japan', 'B'),
('Japón', 'B'),
('Australia', 'B'),
('Korea', 'B'),
('Korea Republic', 'B'),
('Czech Republic', 'B'),
('Chinese Taipei', 'B')
on conflict (team_name) do nothing;

alter table public.games add column if not exists provider_id text;
alter table public.games add column if not exists pool text;
alter table public.games add column if not exists provider_source text default 'manual';
alter table public.games add column if not exists updated_at timestamptz default now();

alter table public.standings add column if not exists updated_at timestamptz default now();
alter table public.batting_leaders add column if not exists updated_at timestamptz default now();
alter table public.pitching_leaders add column if not exists updated_at timestamptz default now();
alter table public.news_items add column if not exists updated_at timestamptz default now();

create unique index if not exists games_provider_id_idx on public.games(provider_id);
create unique index if not exists standings_pool_team_idx on public.standings(pool, team_name);
