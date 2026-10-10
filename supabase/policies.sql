-- Access rules for the football organisation page.
-- Run once in the Supabase SQL editor (and again whenever you change it).
--
-- Result: anyone can view the data; only signed-in organisers listed in
-- public.organisers can add, change or delete it.
--
-- Before running: replace organiser@example.com below with the organisers'
-- real sign-in emails. Each organiser also needs a user account under
-- Authentication > Users in Supabase (use "Invite user").

-- 1. Who counts as an organiser
create table if not exists public.organisers (
  email text primary key
);
-- No policies on this table: it can't be read or changed through the public API.
alter table public.organisers enable row level security;

insert into public.organisers (email) values
  ('neal.patel87.np@gmail.com')
on conflict do nothing;

-- Checks the signed-in user's email against the list. Runs with the owner's
-- rights so it can read public.organisers, which visitors can't.
create or replace function public.is_organiser()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.organisers
    where lower(email) = lower(auth.jwt() ->> 'email')
  );
$$;

-- 2. Remove whatever policies these tables had before
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

-- 3. Anyone can read; organisers can write
alter table public.players enable row level security;
create policy "Anyone can read players" on public.players for select using (true);
create policy "Organisers can add players" on public.players for insert to authenticated with check (public.is_organiser());
create policy "Organisers can change players" on public.players for update to authenticated using (public.is_organiser()) with check (public.is_organiser());
create policy "Organisers can delete players" on public.players for delete to authenticated using (public.is_organiser());

alter table public.games enable row level security;
create policy "Anyone can read games" on public.games for select using (true);
create policy "Organisers can add games" on public.games for insert to authenticated with check (public.is_organiser());
create policy "Organisers can change games" on public.games for update to authenticated using (public.is_organiser()) with check (public.is_organiser());
create policy "Organisers can delete games" on public.games for delete to authenticated using (public.is_organiser());

alter table public.app_state enable row level security;
create policy "Anyone can read app state" on public.app_state for select using (true);
create policy "Organisers can add app state" on public.app_state for insert to authenticated with check (public.is_organiser());
create policy "Organisers can change app state" on public.app_state for update to authenticated using (public.is_organiser()) with check (public.is_organiser());
create policy "Organisers can delete app state" on public.app_state for delete to authenticated using (public.is_organiser());
