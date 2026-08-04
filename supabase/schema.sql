-- Run in Supabase Dashboard → SQL Editor

create table if not exists groups (
  slug text primary key,
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists players (
  id uuid primary key,
  group_slug text not null references groups (slug) on delete cascade,
  name text not null,
  positions text[] not null default '{}',
  favourite_club text not null default '',
  club_logo_url text,
  photo_url text,
  pace smallint not null,
  shooting smallint not null,
  passing smallint not null,
  dribbling smallint not null,
  defending smallint not null,
  physicality smallint not null,
  stamina smallint not null,
  ovr smallint not null,
  created_at timestamptz not null,
  updated_at timestamptz not null
);

create index if not exists players_group_slug_idx on players (group_slug);

create table if not exists matches (
  id uuid primary key,
  group_slug text not null references groups (slug) on delete cascade,
  date timestamptz not null,
  name text not null default '',
  format smallint not null,
  selected_player_ids uuid[] not null default '{}',
  team_a jsonb not null,
  team_b jsonb not null,
  team_c jsonb,
  team_count smallint not null default 2,
  rating_difference numeric not null
);

-- Existing databases: run once in SQL Editor (required for three-way split)
alter table matches add column if not exists team_c jsonb;
alter table matches add column if not exists team_count smallint not null default 2;

create index if not exists matches_group_slug_idx on matches (group_slug);
create index if not exists matches_date_idx on matches (date desc);

-- Games-played recording (also see migrations/add-player-appearances.sql)
alter table matches add column if not exists recorded_as_played boolean not null default false;
alter table matches add column if not exists recorded_at timestamptz;

create table if not exists player_appearances (
  id uuid primary key,
  group_slug text not null references groups (slug) on delete cascade,
  match_id uuid not null,
  player_id uuid not null,
  player_name text not null,
  team_key text not null check (team_key in ('A', 'B', 'C')),
  team_name text not null,
  match_name text not null default '',
  match_date timestamptz not null,
  format smallint not null,
  team_count smallint not null default 2,
  recorded_at timestamptz not null default now(),
  constraint player_appearances_match_player unique (match_id, player_id)
);

create index if not exists player_appearances_group_slug_idx on player_appearances (group_slug);
create index if not exists player_appearances_player_idx on player_appearances (group_slug, player_id);
create index if not exists player_appearances_match_idx on player_appearances (match_id);
create index if not exists player_appearances_date_idx on player_appearances (group_slug, match_date desc);

-- Storage bucket for player photos (create in Dashboard → Storage if SQL insert fails)
insert into storage.buckets (id, name, public)
values ('player-images', 'player-images', false)
on conflict (id) do nothing;

-- Peer ratings (Google claim + rate others). Also see migrations/add-peer-ratings.sql
create table if not exists app_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

insert into app_settings (key, value)
values ('use_peer_ratings', 'false'::jsonb)
on conflict (key) do nothing;

create table if not exists player_claims (
  google_user_id text primary key,
  email text not null,
  player_id uuid not null unique references players (id) on delete cascade,
  group_slug text not null references groups (slug) on delete cascade,
  claimed_at timestamptz not null default now()
);

create index if not exists player_claims_group_slug_idx on player_claims (group_slug);

create table if not exists peer_ratings (
  id uuid primary key,
  group_slug text not null references groups (slug) on delete cascade,
  rater_player_id uuid not null references players (id) on delete cascade,
  rated_player_id uuid not null references players (id) on delete cascade,
  pace smallint not null check (pace between 25 and 95),
  shooting smallint not null check (shooting between 25 and 95),
  passing smallint not null check (passing between 25 and 95),
  dribbling smallint not null check (dribbling between 25 and 95),
  defending smallint not null check (defending between 25 and 95),
  physicality smallint not null check (physicality between 25 and 95),
  stamina smallint not null check (stamina between 25 and 95),
  created_at timestamptz not null,
  updated_at timestamptz not null,
  constraint peer_ratings_no_self check (rater_player_id <> rated_player_id),
  constraint peer_ratings_pair unique (rater_player_id, rated_player_id)
);

create index if not exists peer_ratings_rated_idx on peer_ratings (rated_player_id);
create index if not exists peer_ratings_group_slug_idx on peer_ratings (group_slug);
