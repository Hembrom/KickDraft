-- Player match appearances (games-played history). Survives match purge (no FK to matches).

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
