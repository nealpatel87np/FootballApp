// @ts-nocheck: plain JavaScript rules copied from selection.js live in this file
// Push notifications, self-service availability and app users for Brent Football
// (Supabase Edge Function "notify").
//
// The page calls this function to turn notifications on or off for a phone and
// to send them. A schedule (supabase/push-cron.sql) also calls it to send payment
// reminders at 12pm UK time every day to anyone who still owes. The notification keys are made the
// first time it runs and kept in push_config, which the page itself can't read.
//
// Deploy: Supabase dashboard -> Edge Functions -> Deploy a new function -> Via
// Editor, name it "notify", paste this file, deploy, then turn off "Verify JWT"
// in the function's settings (the page has no sign-in). See the README.
//
// Actions (POST JSON { action, ... }):
//   status      -> { publicKey, playerIds }   who has notifications on
//   subscribe   { subscription, playerId, prefs }  save or update this phone
//   unsubscribe { endpoint }
//   send        { messages: [{ playerId, kind, title, body, url, tag }] }
//   daily       12pm UK payment reminders for everyone who owes (called by the schedule; { force: true } skips the time check)
//   avail_tick  opens and closes availability when due (called every 15 minutes)
//   avail_answer { gameIso, playerId, answer: 'in' | 'out', byOrganiser }
//   avail_open { day } · avail_close / avail_confirm / avail_cancel / avail_reopen / avail_nudge { gameIso }
//   hello       { deviceId, playerId, installed, browser, platform, notifications }   this phone checked in
//   admin_users -> { devices, subscriptions }   for the organisers' App users page
//
// The squad selection rules are a copy of the app's selection.js (Supabase can't
// import it from the website), so the 9pm close picks the same squad as Run game.

import webpush from 'npm:web-push@3.6.7';
import { createClient } from 'npm:@supabase/supabase-js@2';

const db = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  { auth: { persistSession: false } },
);
const SUBJECT = 'https://nealpatel87np.github.io/FootballApp/';
const KINDS = ['availability', 'squad', 'teams', 'payments', 'credit', 'test'];
const DEFAULT_PREFS = { availability: true, squad: true, teams: true, payments: true, credit: false };
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const reply = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });
const clip = (v: unknown, n: number) => String(v ?? '').slice(0, n);
const toId = (v: unknown) => { const n = Number(v); return Number.isSafeInteger(n) ? n : null; };

// The notification keys: made once, then reused
async function vapid() {
  const read = () => db.from('push_config').select('public_key, private_key').eq('id', 1).maybeSingle();
  let { data, error } = await read();
  if (error) throw error;
  if (!data) {
    const k = webpush.generateVAPIDKeys();
    const ins = await db.from('push_config').insert({ id: 1, public_key: k.publicKey, private_key: k.privateKey });
    if (ins.error) ({ data } = await read());   // another call made them first
    else data = { public_key: k.publicKey, private_key: k.privateKey };
  }
  if (!data) throw new Error('No notification keys');
  return data;
}

function cleanPrefs(p: Record<string, unknown> | null | undefined) {
  const out: Record<string, boolean> = { ...DEFAULT_PREFS };
  for (const k of Object.keys(DEFAULT_PREFS)) if (p && typeof p[k] === 'boolean') out[k] = p[k] as boolean;
  return out;
}

type Msg = { playerId: number; kind: string; title: string; body: string; url: string; tag: string };

function cleanMessage(m: Record<string, unknown>): Msg | null {
  const playerId = toId(m.playerId), kind = String(m.kind ?? '');
  if (playerId === null || !KINDS.includes(kind)) return null;
  const url = /^\.\/[#\w-]*$/.test(String(m.url ?? '')) ? String(m.url) : './';
  return { playerId, kind, title: clip(m.title, 80) || 'Brent Football', body: clip(m.body, 300), url, tag: clip(m.tag, 60) };
}

// Sends each message to every phone that player has turned on for that kind
async function send(messages: Msg[]) {
  if (!messages.length) return { sent: 0, players: 0, removed: 0 };
  const keys = await vapid();
  const ids = [...new Set(messages.map(m => m.playerId))];
  const { data: subs, error } = await db.from('push_subscriptions').select('endpoint, player_id, p256dh, auth, prefs').in('player_id', ids);
  if (error) throw error;
  let sent = 0, removed = 0;
  const reached = new Set<number>();
  await Promise.all(messages.flatMap(m => (subs ?? [])
    .filter(s => Number(s.player_id) === m.playerId && (m.kind === 'test' || cleanPrefs(s.prefs)[m.kind]))
    .map(async s => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          JSON.stringify({ title: m.title, body: m.body, url: m.url, tag: m.tag }),
          { TTL: 60 * 60 * 24, vapidDetails: { subject: SUBJECT, publicKey: keys.public_key, privateKey: keys.private_key } },
        );
        sent++; reached.add(m.playerId);
      } catch (e) {
        const code = (e as { statusCode?: number }).statusCode;
        if (code === 404 || code === 410) {   // the phone turned them off or the app was removed
          await db.from('push_subscriptions').delete().eq('endpoint', s.endpoint); removed++;
        } else console.error('push failed', code, (e as Error).message);
      }
    })));
  return { sent, players: reached.size, removed };
}

const SHORT_DAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const SHORT_MONTH = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
function shortDate(iso: string) {
  const [y, m, d] = iso.split('-').map(Number), dt = new Date(Date.UTC(y, m - 1, d));
  return `${SHORT_DAY[dt.getUTCDay()]} ${d} ${SHORT_MONTH[m - 1]}`;
}
const pounds = (p: number) => '£' + (p / 100).toFixed(2);

// Every day at 12pm UK time: one reminder for each player who owes on any tracked
// game, with the total, the games and who to pay. The schedule calls at 11:00 and
// 12:00 UTC and only the call that lands at 12 o'clock UK time sends, so summer
// time is handled. force skips the time check (for testing or a manual run).
async function daily(force = false) {
  const hour = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London', hour: '2-digit', hourCycle: 'h23' }).format(testNow ?? new Date());
  if (!force && hour !== '12') return { skipped: `Not 12pm in the UK (it's ${hour}:00)`, sent: 0, players: 0, removed: 0 };
  const { data: money, error } = await db.from('game_money').select('game_id, organiser, price_p, paid_ids');
  if (error) throw error;
  if (!money?.length) return { sent: 0, players: 0, removed: 0 };
  const { data: games, error: e2 } = await db.from('games').select('id, iso, date, playing_ids').in('id', money.map(m => m.game_id));
  if (e2) throw e2;
  // Everything each player still owes, oldest game first
  const owed = new Map<number, { iso: string; date: string; amount: number; org: string }[]>();
  for (const m of money) {
    const g = (games ?? []).find(x => Number(x.id) === Number(m.game_id));
    if (!g) continue;   // the game was deleted
    const paid = new Set((m.paid_ids ?? []).map(Number));
    for (const pid of (g.playing_ids ?? []).map(Number)) {
      if (paid.has(pid)) continue;
      const list = owed.get(pid) ?? [];
      list.push({ iso: g.iso || '', date: g.iso ? shortDate(g.iso) : String(g.date || ''), amount: Number(m.price_p) || 0, org: m.organiser });
      owed.set(pid, list);
    }
  }
  const messages: Msg[] = [...owed.entries()].map(([pid, list]) => {
    list.sort((a, b) => a.iso.localeCompare(b.iso));
    const total = list.reduce((s, d) => s + d.amount, 0), orgs = [...new Set(list.map(d => d.org))];
    const what = list.length === 1 ? list[0].date : `${list.length} games (${list.map(d => d.date).join(', ')})`;
    const pay = orgs.length === 1 ? `Pay ${orgs[0]}.` : 'Pay ' + orgs.map(o => `${o} ${pounds(list.filter(d => d.org === o).reduce((s, d) => s + d.amount, 0))}`).join(' and ') + '.';
    return { playerId: pid, kind: 'payments', title: '💷 Payment due', body: `You owe ${pounds(total)} for ${what}. ${pay}`, url: './#money', tag: 'pay-daily' };
  });
  return send(messages);
}

/* ---- SQUAD SELECTION RULES ----
   Copied word for word from selection.js (between the BEGIN and END lines).
   If you change one, change the other. */
// BEGIN selection.js
(function (root) {
  const SQUAD_SIZE = 12;

  // Who goes first, in order:
  //   1. guaranteed for that day
  //   2. last game's reserves (reserveNext)
  //   3. not late last time (late players go after everyone else)
  //   4. only available that day, then prefers that day, then the rest
  //   5. most times in reserve
  //   6. who said they're in first (availability only; Run game keeps the player list order)
  function orderSquad(players, { day, reserveNext = [], late = () => false, answeredAt = null } = {}) {
    const list = [...players];
    if (answeredAt) list.sort((a, b) => (answeredAt.get(a.id) ?? Infinity) - (answeredAt.get(b.id) ?? Infinity));
    const guar = p => (day === 'mon' ? p.guarMon : p.guarThu);
    return list.sort((a, b) => {
      const ag = guar(a) ? 0 : 1, bg = guar(b) ? 0 : 1; if (ag !== bg) return ag - bg;
      const ar = reserveNext.includes(a.id) ? 0 : 1, br = reserveNext.includes(b.id) ? 0 : 1; if (ar !== br) return ar - br;
      const al = late(a.id) ? 1 : 0, bl = late(b.id) ? 1 : 0; if (al !== bl) return al - bl;
      const ap = a.avail !== 'both' ? 0 : (a.pref === day ? 1 : 2), bp = b.avail !== 'both' ? 0 : (b.pref === day ? 1 : 2); if (ap !== bp) return ap - bp;
      return b.reserved - a.reserved;
    });
  }

  function splitSquad(ordered, size = SQUAD_SIZE) {
    return { playing: ordered.slice(0, size), reserves: ordered.slice(size) };
  }

  // Late last time: marked late at a game, and no later game includes them.
  // games: in date order, each { id, playingIds, reserveIds }; lateIdsOf(gameId) -> player ids marked late
  function latePenaltyFor(games, lateIdsOf) {
    return playerId => {
      let last = -1;
      games.forEach((g, i) => { if (lateIdsOf(g.id).includes(playerId)) last = i; });
      return last !== -1 && !games.slice(last + 1).some(g => g.playingIds.includes(playerId) || g.reserveIds.includes(playerId));
    };
  }

  root.BF_SELECT = { SQUAD_SIZE, orderSquad, splitSquad, latePenaltyFor };
})(globalThis);
// END selection.js

/* ---- SELF-SERVICE AVAILABILITY ----
   Availability opens for the next Monday or Thursday game (Friday or Tuesday by
   default), players say in or out, and at closing time the squad is picked with
   the same rules as Run game and saved like Confirm game. Trial mode only shows it
   to organisers, only notifies organisers and always holds the squad for them to
   confirm. After closing, drop-outs move the first reserve up and late joiners fill
   gaps, until kick-off. */
// deno-lint-ignore no-explicit-any
const SEL = (globalThis as any).BF_SELECT;
const DAY_NAME: Record<string, string> = { mon: 'Monday', thu: 'Thursday' };
const MIN_PLAYERS = 10;

// deno-lint-ignore no-explicit-any
type Row = Record<string, any>;
async function must<T>(q: PromiseLike<{ data: T; error: unknown }>): Promise<T> {
  const { data, error } = await q;
  if (error) throw error;
  return data;
}
async function settings(): Promise<Row> {
  const s = await must(db.from('availability_settings').select('*').eq('id', 1).maybeSingle());
  return s ?? { mode: 'off' };
}

// UK date and time now, whatever the server's clock zone. Tests can set the clock
// (only when the function runs with BF_TEST=1, never in Supabase).
let testNow: Date | null = null;
function londonNow() {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/London', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(testNow ?? new Date()).map(p => [p.type, p.value]));
  return { iso: `${parts.year}-${parts.month}-${parts.day}`, hm: `${parts.hour}:${parts.minute}` };
}
const isoDate = (iso: string) => { const [y, m, d] = iso.split('-').map(Number); return new Date(Date.UTC(y, m - 1, d)); };
const addDays = (iso: string, n: number) => { const d = isoDate(iso); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
function nextGameIso(day: string, todayIso: string) {
  const target = day === 'mon' ? 1 : 4, dow = isoDate(todayIso).getUTCDay();
  return addDays(todayIso, (target - dow + 7) % 7);
}
const openIsoFor = (s: Row, day: string, gameIso: string) => addDays(gameIso, -(day === 'mon' ? s.mon_open_days_before ?? 3 : s.thu_open_days_before ?? 2));
const clockText = (hm: string) => { const [h, m] = hm.split(':').map(Number); return `${h % 12 || 12}${m ? ':' + String(m).padStart(2, '0') : ''}${h < 12 ? 'am' : 'pm'}`; };
const kickText = (s: Row) => { const [h, m] = String(s.kickoff_time || '18:30').split(':').map(Number); return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`; };
const gameDateText = (iso: string) => isoDate(iso).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
const ordinal = (n: number) => { const s = ['th', 'st', 'nd', 'rd'], v = n % 100; return n + (s[(v - 20) % 10] || s[v] || s[0]); };
const started = (s: Row, gameIso: string) => { const now = londonNow(); return now.iso > gameIso || (now.iso === gameIso && now.hm >= String(s.kickoff_time || '18:30')); };

const orgIds = (s: Row): number[] => (s.organiser_ids ?? []).map(Number).filter((n: number) => n > 0);
// Availability messages: in trial they only ever go to the organisers
async function availSend(s: Row, messages: Msg[]) {
  const org = new Set(orgIds(s));
  return send(s.mode === 'trial' ? messages.filter(m => org.has(m.playerId)) : messages);
}
const toOrganisers = (s: Row, title: string, body: string, gameIso: string): Msg[] =>
  orgIds(s).map(id => ({ playerId: id, kind: 'availability', title, body, url: './#avail', tag: 'avail-org-' + gameIso }));
const msg = (playerId: number, title: string, body: string, gameIso: string, tag = 'avail-'): Msg =>
  ({ playerId, kind: 'availability', title, body, url: './#avail', tag: tag + gameIso });

const toPlayer = (p: Row) => ({ id: Number(p.id), name: p.name, avail: p.avail, pref: p.pref, guarMon: !!p.guar_mon, guarThu: !!p.guar_thu, reserved: Number(p.reserved) || 0, played: Number(p.played) || 0 });
const guaranteed = (p: Row, day: string) => (day === 'mon' ? p.guarMon : p.guarThu);

async function openRound(s: Row, day: string, gameIso: string) {
  const ins = await db.from('availability_rounds').insert({ game_iso: gameIso, day, status: 'open' });
  if (ins.error) return { opened: false };   // already opened (or opened by another call)
  const players = (await must(db.from('players').select('*'))).map(toPlayer);
  const dn = DAY_NAME[day], when = `${isoDate(gameIso).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' })}, ${kickText(s)}, ${s.venue}`;
  const closes = clockText(s.close_time || '21:00');
  await availSend(s, players.map(p => guaranteed(p, day)
    ? msg(p.id, `⚽ ${dn} availability is open`, `${when}. You have a guaranteed place, but only if you say you're in by ${closes} tonight.`, gameIso)
    : msg(p.id, `⚽ ${dn} availability is open`, `${when}. Tap to say if you're in. Closes tonight at ${closes}.`, gameIso)));
  return { opened: true };
}

// Who is in, in selection order, with the squad split
async function pickFor(round: Row) {
  const [playersRaw, games, state, late, answers] = await Promise.all([
    must(db.from('players').select('*')),
    must(db.from('games').select('id, iso, day, playing_ids, reserve_ids')),
    must(db.from('app_state').select('reserve_next').eq('id', 1).maybeSingle()),
    db.from('game_late').select('game_id, player_ids').then(r => r.error ? [] : r.data ?? []),
    must(db.from('availability_answers').select('*').eq('game_iso', round.game_iso)),
  ]);
  const players = (playersRaw as Row[]).map(toPlayer);
  const sorted = (games as Row[]).map(g => ({ id: Number(g.id), iso: g.iso || '', day: g.day, playingIds: (g.playing_ids ?? []).map(Number), reserveIds: (g.reserve_ids ?? []).map(Number) }))
    .sort((a, b) => a.iso.localeCompare(b.iso) || a.id - b.id);
  const lateMap = new Map((late as Row[]).map(x => [Number(x.game_id), (x.player_ids ?? []).map(Number)]));
  const inRows = (answers as Row[]).filter(a => a.answer === 'in');
  const answeredAt = new Map(inRows.map(a => [Number(a.player_id), Date.parse(a.answered_at)]));
  const ordered = SEL.orderSquad(players.filter(p => answeredAt.has(p.id)), {
    day: round.day, reserveNext: ((state as Row | null)?.reserve_next ?? []).map(Number),
    late: SEL.latePenaltyFor(sorted, (id: number) => lateMap.get(id) ?? []), answeredAt,
  });
  return { players, games: sorted, ...SEL.splitSquad(ordered) };
}

// Picks the squad. announce: save the game and tell everyone; otherwise hold it for an organiser
async function closeRound(s: Row, round: Row, announce: boolean) {
  const from = round.status;
  const lock = await must(db.from('availability_rounds').update({ status: announce ? 'closed' : 'held', closed_at: new Date().toISOString() })
    .eq('game_iso', round.game_iso).eq('status', from).select());
  if (!(lock as Row[]).length) return { closed: false };   // someone else got there first
  const { players, games, playing, reserves } = await pickFor(round);
  const dn = DAY_NAME[round.day];
  if (!announce) {
    await availSend(s, toOrganisers(s, `📋 ${dn} squad ready to confirm`, `${playing.length} would play, ${reserves.length} reserve${reserves.length === 1 ? '' : 's'}. Open Run game to check it and announce it.`, round.game_iso));
    return { closed: true, held: true, playing: playing.length, reserves: reserves.length };
  }
  // A game for that date already made by hand wins: don't make a second one
  const existing = games.find(g => g.iso === round.game_iso && g.day === round.day);
  if (existing) {
    await must(db.from('availability_rounds').update({ game_id: existing.id }).eq('game_iso', round.game_iso).select());
    await availSend(s, toOrganisers(s, `ℹ️ ${dn} already had a squad`, `A game for ${round.game_iso} was already made in Run game, so availability didn't change it.`, round.game_iso));
    return { closed: true, existing: true };
  }
  const id = Date.now(), date = gameDateText(round.game_iso);
  const playIds = playing.map((p: Row) => p.id), resIds = reserves.map((p: Row) => p.id);
  await must(db.from('games').insert({ id, date, day: round.day, iso: round.game_iso, manual: false, playing_ids: playIds, reserve_ids: resIds }).select());
  const changed = players.filter(p => playIds.includes(p.id) || resIds.includes(p.id)).map(p => playIds.includes(p.id)
    ? { ...dbPlayer(p), played: p.played + 1, last_played: date } : { ...dbPlayer(p), reserved: p.reserved + 1 });
  if (changed.length) await must(db.from('players').upsert(changed).select());
  await must(db.from('app_state').upsert({ id: 1, reserve_next: resIds }).select());
  await must(db.from('availability_rounds').update({ game_id: id }).eq('game_iso', round.game_iso).select());
  await announceSquad(s, round, playIds, resIds);
  return { closed: true, gameId: id, playing: playIds.length, reserves: resIds.length };
}
const dbPlayer = (p: Row) => ({ id: p.id, name: p.name, avail: p.avail, pref: p.pref, guar_mon: p.guarMon, guar_thu: p.guarThu, played: p.played, reserved: p.reserved });

async function announceSquad(s: Row, round: Row, playIds: number[], resIds: number[]) {
  const dn = DAY_NAME[round.day], iso = round.game_iso;
  const when = `${isoDate(iso).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' })}, ${kickText(s)}, ${s.venue}.`;
  const short = playIds.length < MIN_PLAYERS ? ` We have ${playIds.length} and need ${MIN_PLAYERS - playIds.length} more. Know anyone? Send them the link.` : ' Teams to follow.';
  const messages: Msg[] = [
    ...playIds.map(id => msg(id, `⚽ You're playing ${dn}`, when + short, iso)),
    ...resIds.map((id, i) => msg(id, `🪑 You're a reserve for ${dn}`, `You're ${ordinal(i + 1)} reserve. If someone drops out you'll be told straight away, and you're first in next game.`, iso)),
    ...(playIds.length < MIN_PLAYERS
      ? toOrganisers(s, `⚠️ ${dn}: only ${playIds.length} are in`, `The squad is saved with ${playIds.length}. Late joiners can still say they're in. To call it off, delete the game in the Game Log.`, iso)
      : toOrganisers(s, `✅ ${dn} squad picked`, `${playIds.length} playing, ${resIds.length} reserve${resIds.length === 1 ? '' : 's'}. WhatsApp message ready in the app.`, iso)),
  ];
  return availSend(s, messages);
}

// An answer after the squad was saved: drop-outs and late joiners
async function changeAfterClose(s: Row, round: Row, playerId: number, answer: string) {
  const g = await must(db.from('games').select('*').eq('id', round.game_id).maybeSingle()) as Row | null;
  if (!g) return;
  const playing: number[] = (g.playing_ids ?? []).map(Number), reserves: number[] = (g.reserve_ids ?? []).map(Number);
  const players = (await must(db.from('players').select('*'))).map(toPlayer);
  const P = (id: number) => players.find(p => p.id === id);
  const name = (id: number) => P(id)?.name ?? 'Someone';
  const dn = DAY_NAME[round.day], iso = round.game_iso, out: Msg[] = [], touched = new Map<number, Row>();
  const bump = (id: number, k: 'played' | 'reserved', by: number) => { const p = P(id); if (!p) return; p[k] = Math.max(0, p[k] + by); if (k === 'played' && by > 0) p.last_played = g.date; touched.set(id, p); };
  let teamsNote = '';
  if (answer === 'out' && playing.includes(playerId)) {
    playing.splice(playing.indexOf(playerId), 1); bump(playerId, 'played', -1);
    const up = reserves.shift();
    if (up !== undefined) {
      playing.push(up); bump(up, 'reserved', -1); bump(up, 'played', 1);
      out.push(msg(up, `🎉 You're in for ${dn}`, `A place opened up. ${isoDate(iso).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' })}, ${kickText(s)}. Tap if you can't make it.`, iso));
    }
    teamsNote = await teamsNeedRedoing(g.id, playing);
    out.push(...(up !== undefined
      ? toOrganisers(s, `🔁 ${dn} squad changed`, `${name(playerId)} dropped out. ${name(up)} is in from the reserves. ${reserves.length} reserve${reserves.length === 1 ? '' : 's'} left.${teamsNote}`, iso)
      : toOrganisers(s, `⚠️ ${dn} is down to ${playing.length}`, `${name(playerId)} dropped out and there are no reserves. Late joiners can still say they're in.${teamsNote}`, iso)));
  } else if (answer === 'out' && reserves.includes(playerId)) {
    reserves.splice(reserves.indexOf(playerId), 1); bump(playerId, 'reserved', -1);
  } else if (answer === 'in' && !playing.includes(playerId) && !reserves.includes(playerId)) {
    if (playing.length < SEL.SQUAD_SIZE) {
      playing.push(playerId); bump(playerId, 'played', 1);
      teamsNote = await teamsNeedRedoing(g.id, playing);
      out.push(msg(playerId, `⚽ You're playing ${dn}`, `You're in. ${kickText(s)}, ${s.venue}.`, iso));
      out.push(...toOrganisers(s, `➕ ${name(playerId)} joined ${dn}`, `Now ${playing.length} playing.${teamsNote}`, iso));
    } else {
      reserves.push(playerId); bump(playerId, 'reserved', 1);
      out.push(msg(playerId, `🪑 You're a reserve for ${dn}`, `The squad is full, so you're ${ordinal(reserves.length)} reserve. If someone drops out you'll be told straight away.`, iso));
    }
  } else return;
  await must(db.from('games').update({ playing_ids: playing, reserve_ids: reserves }).eq('id', g.id).select());
  if (touched.size) await must(db.from('players').upsert([...touched.values()].map(p => ({ ...dbPlayer(p), ...(p.last_played ? { last_played: p.last_played } : {}) }))).select());
  // Keep the reserve promise in step if this is the latest game
  const latest = await must(db.from('games').select('id, iso').order('iso', { ascending: false }).order('id', { ascending: false }).limit(1));
  if ((latest as Row[])[0] && Number((latest as Row[])[0].id) === Number(g.id)) await must(db.from('app_state').upsert({ id: 1, reserve_next: reserves }).select());
  await availSend(s, out);
}
// Teams no longer match the squad: a draft is cleared, confirmed teams go back to draft
async function teamsNeedRedoing(gameId: number, playing: number[]) {
  const t = await db.from('game_teams').select('*').eq('game_id', gameId).maybeSingle();
  if (t.error || !t.data) return '';
  if (t.data.status === 'confirmed') await db.from('game_teams').update({ status: 'draft' }).eq('game_id', gameId);
  else await db.from('game_teams').delete().eq('game_id', gameId);
  return ' Teams need redoing.';
}

async function answerAvail(s: Row, b: Row) {
  const playerId = toId(b.playerId), answer = String(b.answer), gameIso = clip(b.gameIso, 10);
  if (playerId === null || !['in', 'out'].includes(answer)) return { error: 'Bad answer' };
  const round = await must(db.from('availability_rounds').select('*').eq('game_iso', gameIso).maybeSingle()) as Row | null;
  if (!round || round.status === 'cancelled') return { error: 'That game is not open for availability.' };
  if (started(s, gameIso)) return { error: "The game has started, so changes are closed." };
  await must(db.from('availability_answers').upsert({ game_iso: gameIso, player_id: playerId, answer, answered_at: new Date().toISOString(), by_organiser: !!b.byOrganiser }).select());
  if (round.status === 'closed') await changeAfterClose(s, round, playerId, answer);
  return { ok: true, status: round.status };
}

// Every 15 minutes: open availability when it's due, close it at closing time
async function tick() {
  const s = await settings();
  if (!['trial', 'on'].includes(s.mode)) return { mode: s.mode || 'off', done: [] };
  const now = londonNow(), done: string[] = [];
  for (const day of ['mon', 'thu']) {
    const gameIso = nextGameIso(day, now.iso), openIso = openIsoFor(s, day, gameIso);
    const round = await must(db.from('availability_rounds').select('*').eq('game_iso', gameIso).maybeSingle()) as Row | null;
    if (!round && now.iso === openIso && now.hm >= s.open_time && now.hm < s.close_time) {
      if ((await openRound(s, day, gameIso)).opened) done.push('opened ' + gameIso);
    } else if (round && round.status === 'open') {
      // Closes at closing time on the opening day (or straight away if that has passed)
      const closeIso = openIsoFor(s, round.day, round.game_iso);
      if (!(now.iso > closeIso || (now.iso === closeIso && now.hm >= s.close_time))) continue;
      if ((await closeRound(s, round, s.mode === 'on' && s.auto_announce !== false)).closed) done.push('closed ' + gameIso);
    }
  }
  return { mode: s.mode, done };
}

async function availAction(action: string, b: Row) {
  const s = await settings();
  if (!['trial', 'on'].includes(s.mode)) return { error: 'Self-service availability is switched off.' };
  if (action === 'avail_answer') return answerAvail(s, b);
  if (action === 'avail_open') {
    const day = b.day === 'mon' ? 'mon' : 'thu', gameIso = nextGameIso(day, londonNow().iso);
    return { ...(await openRound(s, day, gameIso)), gameIso };
  }
  const round = await must(db.from('availability_rounds').select('*').eq('game_iso', clip(b.gameIso, 10)).maybeSingle()) as Row | null;
  if (!round) return { error: 'No availability for that game.' };
  const dn = DAY_NAME[round.day];
  switch (action) {
    case 'avail_close': if (round.status !== 'open') return { error: 'Already closed.' };
      return closeRound(s, round, s.mode === 'on' && s.auto_announce !== false);
    case 'avail_confirm': if (round.status !== 'held') return { error: 'Nothing waiting to be confirmed.' };
      return closeRound(s, round, true);
    case 'avail_cancel': {
      if (!['open', 'held'].includes(round.status)) return { error: 'Only open or held availability can be cancelled. Delete a saved game in the Game Log.' };
      await must(db.from('availability_rounds').update({ status: 'cancelled' }).eq('game_iso', round.game_iso).select());
      const ins = (await must(db.from('availability_answers').select('player_id, answer').eq('game_iso', round.game_iso)) as Row[]).filter(a => a.answer === 'in');
      await availSend(s, ins.map(a => msg(Number(a.player_id), `❌ ${dn} is cancelled`, `No game on ${isoDate(round.game_iso).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' })}. See you next time.`, round.game_iso)));
      return { ok: true };
    }
    case 'avail_reopen': if (!['held', 'cancelled'].includes(round.status)) return { error: 'Only held or cancelled availability can be reopened.' };
      await must(db.from('availability_rounds').update({ status: 'open', closed_at: null }).eq('game_iso', round.game_iso).select());
      return { ok: true };
    case 'avail_nudge': {
      if (!['open', 'held'].includes(round.status)) return { error: 'Availability is not open.' };
      const answered = new Set((await must(db.from('availability_answers').select('player_id').eq('game_iso', round.game_iso)) as Row[]).map(a => Number(a.player_id)));
      const players = (await must(db.from('players').select('*'))).map(toPlayer).filter(p => !answered.has(p.id));
      const closes = clockText(s.close_time || '21:00');
      return availSend(s, players.map(p => msg(p.id, `⏰ Are you in for ${dn}?`, guaranteed(p, round.day)
        ? `Say you're in by ${closes} to keep your guaranteed place.` : `Say if you're in by ${closes} tonight.`, round.game_iso, 'avail-nudge-')));
    }
  }
  return { error: 'Unknown action' };
}

// Phones that picked "Who are you?", for the App users page
async function hello(b: Row) {
  const playerId = toId(b.playerId), deviceId = clip(b.deviceId, 64);
  if (playerId === null || !/^[\w-]{8,64}$/.test(deviceId)) return { error: 'Bad device' };
  await must(db.from('app_devices').upsert({ device_id: deviceId, player_id: playerId, installed: !!b.installed, browser: clip(b.browser, 40),
    platform: clip(b.platform, 40), notifications: !!b.notifications, last_seen: new Date().toISOString() }).select());
  return { ok: true };
}
async function adminUsers() {
  const [devices, subs] = await Promise.all([
    must(db.from('app_devices').select('player_id, installed, browser, platform, notifications, last_seen')),
    must(db.from('push_subscriptions').select('player_id, prefs, endpoint, updated_at')),
  ]);
  return {
    devices,
    subscriptions: (subs as Row[]).map(x => ({ player_id: x.player_id, prefs: cleanPrefs(x.prefs), updated_at: x.updated_at, service: (() => { try { return new URL(x.endpoint).host; } catch { return ''; } })() })),
  };
}

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return reply({ error: 'Use POST' }, 405);
  let b: Record<string, unknown>;
  try { b = await req.json(); } catch { return reply({ error: 'Send JSON' }, 400); }
  testNow = Deno.env.get('BF_TEST') === '1' && b._now ? new Date(String(b._now)) : null;
  try {
    switch (b.action) {
      case 'status': {
        const keys = await vapid();
        const { data, error } = await db.from('push_subscriptions').select('player_id');
        if (error) throw error;
        return reply({ publicKey: keys.public_key, playerIds: [...new Set((data ?? []).map(r => Number(r.player_id)))] });
      }
      case 'subscribe': {
        const s = (b.subscription ?? {}) as { endpoint?: string; keys?: { p256dh?: string; auth?: string } };
        const playerId = toId(b.playerId);
        if (!s.endpoint || !/^https:\/\//.test(s.endpoint) || !s.keys?.p256dh || !s.keys?.auth || playerId === null) return reply({ error: 'Bad subscription' }, 400);
        const { error } = await db.from('push_subscriptions').upsert({
          endpoint: clip(s.endpoint, 1000), player_id: playerId, p256dh: clip(s.keys.p256dh, 200), auth: clip(s.keys.auth, 100),
          prefs: cleanPrefs(b.prefs as Record<string, unknown>), updated_at: new Date().toISOString(),
        });
        if (error) throw error;
        return reply({ ok: true });
      }
      case 'unsubscribe': {
        const { error } = await db.from('push_subscriptions').delete().eq('endpoint', clip(b.endpoint, 1000));
        if (error) throw error;
        return reply({ ok: true });
      }
      case 'send': {
        const list = Array.isArray(b.messages) ? b.messages.slice(0, 200) : [];
        return reply(await send(list.map(m => cleanMessage(m as Record<string, unknown>)).filter((m): m is Msg => !!m)));
      }
      case 'daily':
        return reply(await daily(b.force === true));
      case 'avail_tick':
        return reply(await tick());
      case 'avail_answer': case 'avail_open': case 'avail_close': case 'avail_confirm':
      case 'avail_cancel': case 'avail_reopen': case 'avail_nudge': {
        const r = await availAction(String(b.action), b);
        return reply(r, r && (r as Row).error ? 400 : 200);
      }
      case 'hello':
        return reply(await hello(b));
      case 'admin_users':
        return reply(await adminUsers());
      default:
        return reply({ error: 'Unknown action' }, 400);
    }
  } catch (e) {
    const msg = (e as { message?: string }).message ?? String(e);
    const missing = /push_config|push_subscriptions|availability_|app_devices/.test(msg) && /does not exist|schema cache/i.test(msg);
    return reply({ error: missing ? (/availability_|app_devices/.test(msg) ? 'Run supabase/availability.sql first' : 'Run supabase/push.sql first') : msg }, 500);
  }
});
