-- Release 3.8: quieter schedules for Brent Football.
-- Run once in the Supabase SQL editor. Safe to run again (it replaces the schedules
-- by name). No function change is needed.
--
-- 1. The availability check runs every 15 minutes from 07:00 to 22:45 UTC instead
--    of all day (64 calls a day instead of 96). That covers 8am to 10:45pm UK time
--    in winter and summer. Opening and closing times must be in that window; the
--    Setup page checks this.
-- 2. Every night at 03:30 UTC, schedule history older than 7 days is deleted, so
--    cron.job_run_details doesn't keep growing. (pg_net already clears its own
--    responses after 6 hours.)

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

select cron.schedule(
  'brent-football-tidy-history',
  '30 3 * * *',
  $$ delete from cron.job_run_details where end_time < now() - interval '7 days' $$
);

-- Check: select jobname, schedule, active from cron.job order by jobname;
-- To go back to every 15 minutes all day: run the first statement again with '*/15 * * * *'.
-- To stop the tidy-up:  select cron.unschedule('brent-football-tidy-history');
