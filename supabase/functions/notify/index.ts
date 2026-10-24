// Push notifications for Brent Football (Supabase Edge Function "notify").
//
// The page calls this function to turn notifications on or off for a phone and
// to send them. A daily schedule (supabase/push-cron.sql) also calls it to send
// payment reminders the day after a game. The notification keys are made the
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
//   daily       payment reminders for yesterday's games (called by the schedule)

import webpush from 'npm:web-push@3.6.7';
import { createClient } from 'npm:@supabase/supabase-js@2';

const db = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  { auth: { persistSession: false } },
);
const SUBJECT = 'https://nealpatel87np.github.io/FootballApp/';
const KINDS = ['squad', 'teams', 'payments', 'credit', 'test'];
const DEFAULT_PREFS = { squad: true, teams: true, payments: true, credit: false };
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

// Reminders for anyone who hasn't paid for a tracked game played yesterday (UK time)
async function daily() {
  const yesterday = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/London' }).format(new Date(Date.now() - 864e5));
  const { data: games, error } = await db.from('games').select('id, iso, playing_ids').eq('iso', yesterday);
  if (error) throw error;
  if (!games?.length) return { sent: 0, players: 0, removed: 0 };
  const { data: money, error: e2 } = await db.from('game_money').select('game_id, organiser, price_p, paid_ids').in('game_id', games.map(g => g.id));
  if (e2) throw e2;
  const messages: Msg[] = [];
  for (const g of games) {
    const m = (money ?? []).find(x => Number(x.game_id) === Number(g.id));
    if (!m) continue;   // money not tracked yet
    const paid = new Set((m.paid_ids ?? []).map(Number));
    for (const pid of (g.playing_ids ?? []).map(Number)) {
      if (paid.has(pid)) continue;
      messages.push({ playerId: pid, kind: 'payments', title: '💷 Payment due', body: `You owe ${pounds(m.price_p)} for ${shortDate(g.iso)}. Pay ${m.organiser}.`, url: './#money', tag: 'pay-' + g.id });
    }
  }
  return send(messages);
}

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return reply({ error: 'Use POST' }, 405);
  let b: Record<string, unknown>;
  try { b = await req.json(); } catch { return reply({ error: 'Send JSON' }, 400); }
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
        return reply(await daily());
      default:
        return reply({ error: 'Unknown action' }, 400);
    }
  } catch (e) {
    const msg = (e as { message?: string }).message ?? String(e);
    const missing = /push_config|push_subscriptions/.test(msg) && /does not exist|schema cache/i.test(msg);
    return reply({ error: missing ? 'Run supabase/push.sql first' : msg }, 500);
  }
});
