-- Team picking tables for the football organisation page (positions and
-- ratings, team rules, and each game's teams and score).
-- Run once in the Supabase SQL editor. Safe to run again.
--
-- Access matches the rest of the app: anyone who can open the page can read
-- and change these tables.

-- Each player's position, rating and whether they'll go in goal.
-- Players with no row here count as "anywhere", rated 3, not a keeper.
create table if not exists public.player_ratings (
  player_id bigint primary key,
  position  text not null default 'any',      -- 'def', 'att' or 'any'
  rating    integer not null default 3,       -- 1 to 5
  keeper    boolean not null default false
);

-- Pairs of players the team picker keeps apart or puts on the same team
create table if not exists public.team_rules (
  id        bigint primary key,
  kind      text not null,                    -- 'apart' or 'together'
  player_a  bigint not null,
  player_b  bigint not null,
  note      text not null default ''
);

-- The teams for a game. A draft is shared with the other organisers but not
-- shown on the front page until it's confirmed. The score is added after the game.
create table if not exists public.game_teams (
  game_id    bigint primary key,
  team1_ids  bigint[] not null default '{}',
  team2_ids  bigint[] not null default '{}',
  bibs       smallint not null default 1,     -- which team wears the bibs: 1 or 2
  status     text not null default 'draft',   -- 'draft' or 'confirmed'
  score1     integer,
  score2     integer
);

alter table public.player_ratings enable row level security;
alter table public.team_rules enable row level security;
alter table public.game_teams enable row level security;

drop policy if exists "Anyone can use player ratings" on public.player_ratings;
drop policy if exists "Anyone can use team rules" on public.team_rules;
drop policy if exists "Anyone can use game teams" on public.game_teams;
create policy "Anyone can use player ratings" on public.player_ratings for all using (true) with check (true);
create policy "Anyone can use team rules" on public.team_rules for all using (true) with check (true);
create policy "Anyone can use game teams" on public.game_teams for all using (true) with check (true);
