-- Money tables for the football organisation page (kitty, payments, spends).
-- Run once in the Supabase SQL editor. Safe to run again.
--
-- Amounts are stored in pence (850 = £8.50).
-- Access matches the rest of the app: anyone who can open the page can read
-- and change these tables.

-- Who organised each game (and so holds its money), the price and pitch cost
-- at the time, and which players have paid
create table if not exists public.game_money (
  game_id   bigint primary key,
  organiser text not null,
  price_p   integer not null,
  pitch_p   integer not null,
  admin_pct numeric not null default 10,
  paid_ids  bigint[] not null default '{}'
);

-- Money spent from the kitty, and which organiser paid it
create table if not exists public.kitty_spends (
  id        bigint primary key,
  spent_on  text not null,
  what      text not null,
  category  text not null,
  paid_by   text not null,
  amount_p  integer not null
);

-- One row: current price, pitch cost, admin share, and each organiser's
-- starting balance from before the app, e.g. {"Neal": 2500, "Kev": 1000, "Gav": 500}
create table if not exists public.money_settings (
  id        integer primary key,
  price_p   integer not null default 850,
  pitch_p   integer not null default 8000,
  admin_pct numeric not null default 10,
  opening   jsonb not null default '{}'
);

alter table public.game_money enable row level security;
alter table public.kitty_spends enable row level security;
alter table public.money_settings enable row level security;

drop policy if exists "Anyone can use game money" on public.game_money;
drop policy if exists "Anyone can use kitty spends" on public.kitty_spends;
drop policy if exists "Anyone can use money settings" on public.money_settings;
create policy "Anyone can use game money" on public.game_money for all using (true) with check (true);
create policy "Anyone can use kitty spends" on public.kitty_spends for all using (true) with check (true);
create policy "Anyone can use money settings" on public.money_settings for all using (true) with check (true);
