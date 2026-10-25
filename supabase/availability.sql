-- Self-service availability and app users for Brent Football (release 3.0).
-- Run once in the Supabase SQL editor, after push.sql and push-cron.sql.
-- Safe to run again. Nothing happens until an organiser switches the feature
-- to Trial or On (Setup -> Self-service availability).

-- One row: the switch and the timetable. Organisers change it from the page.
create table if not exists public.availability_settings (
  id                    integer primary key,
  mode                  text not null default 'off',          -- 'off', 'trial' (organisers only) or 'on'
  open_time             text not null default '09:00',        -- UK time availability opens
  close_time            text not null default '21:00',        -- UK time it closes and the squad is picked
  mon_open_days_before  integer not null default 3,           -- Monday game: opens Friday
  thu_open_days_before  integer not null default 2,           -- Thursday game: opens Tuesday
  auto_announce         boolean not null default true,        -- off: squad held for an organiser to confirm
  kickoff_time          text not null default '18:30',
  venue                 text not null default 'Harrow Powerleague',
  organiser_ids         bigint[] not null default '{}'         -- organisers' player ids: they get organiser and trial notifications
);
insert into public.availability_settings (id) values (1) on conflict (id) do nothing;

-- One row per game that availability was opened for
create table if not exists public.availability_rounds (
  game_iso   text primary key,                -- the game's date, e.g. 2026-10-29
  day        text not null,                   -- 'mon' or 'thu'
  status     text not null default 'open',    -- 'open', 'held' (picked, waiting for an organiser), 'closed' (squad saved) or 'cancelled'
  game_id    bigint,                          -- the game saved when it closed
  opened_at  timestamptz not null default now(),
  closed_at  timestamptz
);

-- Each player's answer for a game
create table if not exists public.availability_answers (
  game_iso      text not null,
  player_id     bigint not null,
  answer        text not null,                -- 'in' or 'out'
  answered_at   timestamptz not null default now(),
  by_organiser  boolean not null default false,
  primary key (game_iso, player_id)
);

-- Phones that have picked "Who are you?" (for the App users page). Closed to the page.
create table if not exists public.app_devices (
  device_id      text primary key,
  player_id      bigint not null,
  installed      boolean not null default false,
  browser        text not null default '',
  platform       text not null default '',
  notifications  boolean not null default false,
  last_seen      timestamptz not null default now()
);

alter table public.availability_settings enable row level security;
alter table public.availability_rounds enable row level security;
alter table public.availability_answers enable row level security;
alter table public.app_devices enable row level security;

-- Settings: open like the rest of the app (organisers edit them from the page)
drop policy if exists "Anyone can use availability settings" on public.availability_settings;
create policy "Anyone can use availability settings" on public.availability_settings for all using (true) with check (true);
-- Rounds and answers: the page can read them; only the notify function changes them
drop policy if exists "Anyone can read availability rounds" on public.availability_rounds;
create policy "Anyone can read availability rounds" on public.availability_rounds for select using (true);
drop policy if exists "Anyone can read availability answers" on public.availability_answers;
create policy "Anyone can read availability answers" on public.availability_answers for select using (true);
-- app_devices: no policies, so only the function (service role) can use it

-- Let the page and the function reach the tables through the Data API
-- (Supabase no longer grants this automatically for tables created from 30 Oct 2026)
grant select, insert, update, delete on public.availability_settings to anon, authenticated;
grant select on public.availability_rounds to anon, authenticated;
grant select on public.availability_answers to anon, authenticated;
revoke all on public.app_devices from anon, authenticated;
grant select, insert, update, delete on public.availability_settings to service_role;
grant select, insert, update, delete on public.availability_rounds to service_role;
grant select, insert, update, delete on public.availability_answers to service_role;
grant select, insert, update, delete on public.app_devices to service_role;

-- Every 15 minutes from 07:00 to 22:45 UTC the database asks the function whether
-- availability should open or close (it checks the switch and UK time itself). That
-- covers 8am to 10:45pm UK time in winter and summer, so opening and closing times
-- must be in that window (Setup checks this). Changed in 3.8 from all day.
-- A nightly job then clears schedule history older than 7 days (also in schedule-3.8.sql).
create extension if not exists pg_cron;
create extension if not exists pg_net;
select cron.schedule(
  'brent-football-availability',
  '*/15 7-22 * * *',
  $$
  select net.http_post(
    url := 'https://myzzeeqltyjxsjydzhix.supabase.co/functions/v1/notify',
    headers := '{"Content-Type": "application/json", "apikey": "sb_publishable_ksy5ky5Q2e4fJM40_wf98w_Hf28qXM6"}'::jsonb,
    body := '{"action": "avail_tick"}'::jsonb
  );
  $$
);
-- To stop it:  select cron.unschedule('brent-football-availability');
select cron.schedule(
  'brent-football-tidy-history',
  '30 3 * * *',
  $$ delete from cron.job_run_details where end_time < now() - interval '7 days' $$
);
