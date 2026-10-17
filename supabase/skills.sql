-- Skill ratings for the football organisation page: attack, defence, fitness
-- and goalkeeping from 1 to 10, the player's position and whether they're a
-- regular keeper. Run once in the Supabase SQL editor. Safe to run again.
--
-- Players with no row here start from their old 1-5 star rating in
-- player_ratings (stars x 2 for each skill). Access matches the rest of the
-- app: anyone who can open the page can read and change this table.

create table if not exists public.player_skills (
  player_id   bigint primary key,
  attack      integer not null default 6,     -- 1 to 10
  defence     integer not null default 6,
  fitness     integer not null default 6,
  goalkeeping integer not null default 5,
  position    text not null default 'auto',   -- 'auto' (from attack and defence), 'def', 'att' or 'any'
  keeper      boolean not null default false  -- a regular keeper
);

alter table public.player_skills enable row level security;
drop policy if exists "Anyone can use player skills" on public.player_skills;
create policy "Anyone can use player skills" on public.player_skills for all using (true) with check (true);
