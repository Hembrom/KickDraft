-- Add stamina attribute to players (run in Supabase SQL Editor)

alter table players add column if not exists stamina smallint;

update players
set stamina = round(
  (pace + shooting + passing + dribbling + defending + physicality)::numeric / 6
)
where stamina is null;

alter table players alter column stamina set not null;

update players
set ovr = round(
  (pace + shooting + passing + dribbling + defending + physicality + stamina)::numeric / 7
);
