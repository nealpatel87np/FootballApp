-- Late arrivals for the football organisation page: which players turned up
-- late to each game. A late player is picked after everyone else who isn't
-- guaranteed when the next squad they're available for is chosen.
-- Run once in the Supabase SQL editor. Safe to run again.
--
-- Access matches the rest of the app: anyone who can open the page can read
-- and change this table.

create table if not exists public.game_late (
  game_id    bigint primary key,
  player_ids bigint[] not null default '{}'
);

alter table public.game_late enable row level security;
drop policy if exists "Anyone can use game late" on public.game_late;
create policy "Anyone can use game late" on public.game_late for all using (true) with check (true);
