-- Automatic payment reminders for Brent Football (release 2.0).
-- Run once in the Supabase SQL editor, after deploying the "notify" Edge
-- Function. Safe to run again (it replaces the schedule).
--
-- Every day at 10:00 UTC (10am in winter, 11am in summer) the database calls
-- the function, which reminds anyone who hasn't paid for a tracked game played
-- the day before. Players can turn payment reminders off in the app.
-- If "create extension" is refused, turn on pg_cron and pg_net under
-- Database -> Extensions in the dashboard and run this again.

create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.schedule(
  'brent-football-payment-reminders',
  '0 10 * * *',
  $$
  select net.http_post(
    url := 'https://myzzeeqltyjxsjydzhix.supabase.co/functions/v1/notify',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := '{"action": "daily"}'::jsonb
  );
  $$
);

-- To stop the reminders:  select cron.unschedule('brent-football-payment-reminders');
