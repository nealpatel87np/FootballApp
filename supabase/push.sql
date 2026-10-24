-- Push notifications for Brent Football (release 2.0).
-- Run once in the Supabase SQL editor. Safe to run again.
--
-- Unlike the other tables, these are NOT open to the page. Only the "notify"
-- Edge Function can read or change them (it uses the service role), so the
-- page can't see who has notifications on or read the notification keys.

-- One row per phone that has turned notifications on
create table if not exists public.push_subscriptions (
  endpoint   text primary key,                -- the phone's push address
  player_id  bigint not null,                 -- who the phone belongs to ("Who are you?")
  p256dh     text not null,                   -- the phone's encryption keys
  auth       text not null,
  prefs      jsonb not null default '{"squad": true, "teams": true, "payments": true, "credit": false}',
  updated_at timestamptz not null default now()
);

-- One row: the notification keys, made by the function the first time it runs
create table if not exists public.push_config (
  id          integer primary key,
  public_key  text not null,
  private_key text not null
);

-- Row Level Security on with no policies: the page (anon) gets nothing
alter table public.push_subscriptions enable row level security;
alter table public.push_config enable row level security;
revoke all on public.push_subscriptions from anon, authenticated;
revoke all on public.push_config from anon, authenticated;

-- Let the function reach the tables through the Data API
-- (Supabase no longer grants this automatically for tables created from 30 Oct 2026)
grant select, insert, update, delete on public.push_subscriptions to service_role;
grant select, insert, update, delete on public.push_config to service_role;
