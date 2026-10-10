-- Access rules for the football organisation page.
-- Run in the Supabase SQL editor.
--
-- Result: anyone who can open the page can view, add, change and delete the
-- data. There is no sign-in. Run this if saving from the page stops working
-- because of stricter rules (for example an earlier version of this file
-- that only allowed signed-in organisers).

-- 1. Remove whatever policies these tables had before
do $$
declare r record;
begin
  for r in
    select policyname, tablename from pg_policies
    where schemaname = 'public' and tablename in ('players', 'games', 'app_state')
  loop
    execute format('drop policy %I on public.%I', r.policyname, r.tablename);
  end loop;
end $$;

-- 2. The organiser list and its check are no longer used
drop function if exists public.is_organiser();
drop table if exists public.organisers;

-- 3. Anyone can read and write
alter table public.players enable row level security;
create policy "Anyone can use players" on public.players for all using (true) with check (true);

alter table public.games enable row level security;
create policy "Anyone can use games" on public.games for all using (true) with check (true);

alter table public.app_state enable row level security;
create policy "Anyone can use app state" on public.app_state for all using (true) with check (true);
