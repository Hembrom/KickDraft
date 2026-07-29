-- Peer ratings: Google claim + rate others + global toggle
-- Run in Supabase SQL Editor after enabling Google auth provider.

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
