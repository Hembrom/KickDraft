-- Clamp peer rating attributes to 25–95 (run if add-peer-ratings.sql already applied with 0–100)

alter table peer_ratings drop constraint if exists peer_ratings_pace_check;
alter table peer_ratings drop constraint if exists peer_ratings_shooting_check;
alter table peer_ratings drop constraint if exists peer_ratings_passing_check;
alter table peer_ratings drop constraint if exists peer_ratings_dribbling_check;
alter table peer_ratings drop constraint if exists peer_ratings_defending_check;
alter table peer_ratings drop constraint if exists peer_ratings_physicality_check;
alter table peer_ratings drop constraint if exists peer_ratings_stamina_check;

update peer_ratings set
  pace = greatest(25, least(95, pace)),
  shooting = greatest(25, least(95, shooting)),
  passing = greatest(25, least(95, passing)),
  dribbling = greatest(25, least(95, dribbling)),
  defending = greatest(25, least(95, defending)),
  physicality = greatest(25, least(95, physicality)),
  stamina = greatest(25, least(95, stamina));

alter table peer_ratings add constraint peer_ratings_pace_check check (pace between 25 and 95);
alter table peer_ratings add constraint peer_ratings_shooting_check check (shooting between 25 and 95);
alter table peer_ratings add constraint peer_ratings_passing_check check (passing between 25 and 95);
alter table peer_ratings add constraint peer_ratings_dribbling_check check (dribbling between 25 and 95);
alter table peer_ratings add constraint peer_ratings_defending_check check (defending between 25 and 95);
alter table peer_ratings add constraint peer_ratings_physicality_check check (physicality between 25 and 95);
alter table peer_ratings add constraint peer_ratings_stamina_check check (stamina between 25 and 95);
