-- Automatic payment reminders for Brent Football (release 2.0, changed in 3.6).
-- Run once in the Supabase SQL editor, after deploying the "notify" Edge
-- Function. Safe to run again (it replaces the schedule).
--
-- Every day at 12pm UK time, anyone who still owes on any tracked game gets one
-- reminder with the total, the games and who to pay. The database calls the
-- function at 11:00 and 12:00 UTC, and the function only sends on the call that
-- is 12 o'clock in the UK, so it's 12pm in winter and in summer. Players can turn
-- payment reminders off in the app.
-- If "create extension" is refused, turn on pg_cron and pg_net under
-- Database -> Extensions in the dashboard and run this again.
--
-- Supabase only lets requests through to the function with the project's key,
-- so the call sends the publishable key (the same public key the page uses).

create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.schedule(
  'brent-football-payment-reminders',
  '0 11,12 * * *',
  $$
  select net.http_post(
    url := 'https://myzzeeqltyjxsjydzhix.supabase.co/functions/v1/notify',
    headers := '{"Content-Type": "application/json", "apikey": "sb_publishable_ksy5ky5Q2e4fJM40_wf98w_Hf28qXM6"}'::jsonb,
    body := '{"action": "daily"}'::jsonb
  );
  $$
);

-- To stop the reminders:  select cron.unschedule('brent-football-payment-reminders');
