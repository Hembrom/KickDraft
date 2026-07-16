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
  rating_difference numeric not null
);

create index if not exists matches_group_slug_idx on matches (group_slug);
create index if not exists matches_date_idx on matches (date desc);

-- Storage bucket for player photos (create in Dashboard → Storage if SQL insert fails)
insert into storage.buckets (id, name, public)
values ('player-images', 'player-images', false)
on conflict (id) do nothing;
