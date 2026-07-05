-- Run in Supabase SQL Editor if matches table already exists without name column
alter table matches add column if not exists name text not null default '';
