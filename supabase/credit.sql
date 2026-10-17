-- Credit for the football organisation page: money players have paid ahead.
-- It's a simple list (one row per player who has credit) and is taken off
-- what they owe when a game's money is tracked.
-- Run once in the Supabase SQL editor. Safe to run again.
--
-- Amounts are stored in pence (850 = £8.50). Access matches the rest of the
-- app: anyone who can open the page can read and change this table.

create table if not exists public.player_credit (
  player_id bigint primary key,
  amount_p  integer not null
);

alter table public.player_credit enable row level security;
drop policy if exists "Anyone can use player credit" on public.player_credit;
create policy "Anyone can use player credit" on public.player_credit for all using (true) with check (true);
