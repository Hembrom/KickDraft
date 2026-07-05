-- Seed: Newtown Sporting Club + players
-- Run in Supabase → SQL Editor (after schema.sql)
--
-- App URL slug is lowercase: /newtown-sporting-club

begin;

delete from players where group_slug = 'newtown-sporting-club';
delete from groups where slug = 'newtown-sporting-club';

insert into groups (slug, name, created_at)
values ('newtown-sporting-club', 'Newtown Sporting Club', now());

insert into players (
  id, group_slug, name, positions, favourite_club,
  club_logo_url, photo_url,
  pace, shooting, passing, dribbling, defending, physicality, ovr,
  created_at, updated_at
) values
  (gen_random_uuid(), 'newtown-sporting-club', 'Vivek Raj', array['FWD'], 'Real Madrid', null, null, 85, 70, 90, 70, 90, 96, 84, now(), now()),
  (gen_random_uuid(), 'newtown-sporting-club', 'Atul Xalxo', array['FWD', 'DEF'], 'Real Madrid', null, null, 97, 95, 90, 60, 97, 96, 89, now(), now()),
  (gen_random_uuid(), 'newtown-sporting-club', 'John Subham', array['DEF'], 'Real Madrid', null, null, 50, 60, 70, 40, 80, 75, 63, now(), now()),
  (gen_random_uuid(), 'newtown-sporting-club', 'Arvind Xalxo', array['FWD', 'MID'], 'Barcelona and Manchester', null, null, 60, 68, 82, 75, 65, 70, 70, now(), now()),
  (gen_random_uuid(), 'newtown-sporting-club', 'Ajay Minz', array['DEF', 'GK'], 'Liverpool', null, null, 65, 67, 60, 40, 75, 67, 62, now(), now()),
  (gen_random_uuid(), 'newtown-sporting-club', 'Ashesh Chakraborty', array['FWD', 'MID'], 'Barcelona', null, null, 80, 70, 80, 70, 50, 60, 68, now(), now()),
  (gen_random_uuid(), 'newtown-sporting-club', 'Jordan Simon', array['DEF', 'MID'], 'AC Milan', null, null, 75, 75, 85, 80, 85, 85, 81, now(), now()),
  (gen_random_uuid(), 'newtown-sporting-club', 'Marshal Soren', array['FWD', 'DEF'], 'Bayern Munich', null, null, 90, 90, 90, 90, 90, 90, 90, now(), now()),
  (gen_random_uuid(), 'newtown-sporting-club', 'Jingle Ibrahimovic', array['MID'], 'Even Club Ratanpur', null, null, 80, 75, 85, 75, 75, 80, 78, now(), now()),
  (gen_random_uuid(), 'newtown-sporting-club', 'Kumar Harshit', array['FWD', 'MID'], 'FC Barcelona', null, null, 91, 85, 95, 76, 59, 82, 81, now(), now()),
  (gen_random_uuid(), 'newtown-sporting-club', 'Kumar Vishash', array['MID'], 'FC Barcelona', null, null, 80, 95, 85, 75, 96, 95, 88, now(), now()),
  (gen_random_uuid(), 'newtown-sporting-club', 'Bitan Das', array['DEF', 'GK'], 'Manchester United', null, null, 65, 80, 85, 80, 95, 95, 83, now(), now()),
  (gen_random_uuid(), 'newtown-sporting-club', 'Amit Hembrom', array['FWD', 'DEF'], 'Barcelona', null, null, 75, 70, 85, 76, 85, 84, 79, now(), now());

commit;

-- Verify
select count(*) as player_count from players where group_slug = 'newtown-sporting-club';
