-- Cancelled games for Brent Football (release 4.0).
-- Run once in the Supabase SQL editor, BEFORE redeploying the "notify" function.
-- Safe to run again.
--
-- A game an organiser cancels (drop-outs, not enough players, pitch, weather) keeps
-- its row in games, with the reason, an optional note for players, who cancelled it
-- and when. Undo clears these columns again. Cancelled games don't count towards
-- games played, reserves, attendance, the league or late arrivals, and need no money.

alter table public.games
  add column if not exists cancelled_reason text,          -- players, dropouts, pitch, weather or other; null = not cancelled
  add column if not exists cancelled_note   text,          -- optional message for players
  add column if not exists cancelled_by     text,          -- organiser's name
  add column if not exists cancelled_at     timestamptz;

-- The page reads and writes games as before; the function reads them with its own key
grant select, insert, update, delete on public.games to anon, authenticated;
grant select, insert, update, delete on public.games to service_role;
