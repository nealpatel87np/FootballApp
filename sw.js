// Service worker for the installable app. The page always tries the network
// first, so every deploy reaches people straight away; the cached copy is only
// used when there's no signal. Database requests are never cached.
// It also shows push notifications and opens the app when one is tapped.
const CACHE = 'brent-football-v6';
const SHELL = ['./', 'index.html', 'manifest.webmanifest', 'icons/icon.svg', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/maskable-512.png', 'icons/apple-touch-icon.png', 'icons/badge-96.png'];
const CDN = 'https://cdn.jsdelivr.net/';

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const own = url.origin === self.location.origin;
  if (!own && !req.url.startsWith(CDN)) return;   // Supabase and anything else go straight to the network
  // The app's own files skip the browser's short-term cache, so a new release shows straight away
  e.respondWith(
    (own ? fetch(req.url, { cache: 'no-cache', credentials: 'same-origin' }) : fetch(req)).then(res => {
      if (res.ok || res.type === 'opaque') { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
      return res;
    }).catch(() => caches.match(req, { ignoreSearch: own }).then(hit => hit || (req.mode === 'navigate' ? caches.match('index.html') : Response.error())))
  );
});

// Push notifications sent by the "notify" Edge Function: { title, body, url, tag }
self.addEventListener('push', e => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (err) { d = { body: e.data ? e.data.text() : '' }; }
  e.waitUntil(Promise.all([
    self.registration.showNotification(d.title || 'Brent Football', {
      body: d.body || '', icon: 'icons/icon-192.png', badge: 'icons/badge-96.png', tag: d.tag || undefined, renotify: !!d.tag, vibrate: [200, 100, 200], data: { url: d.url || './' }
    }).then(() => 'shown', err => 'not shown: ' + (err && err.message)),
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
  ]).then(([shown, list]) => list.forEach(w => w.postMessage({ type: 'push-received', title: d.title || '', shown }))));   // lets an open app confirm it arrived
});

// Tapping a notification opens the app (or brings it to the front) on the right page
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = new URL((e.notification.data && e.notification.data.url) || './', self.registration.scope).href;
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
    const win = list.find(w => w.url.startsWith(self.registration.scope));
    if (!win) return self.clients.openWindow(url);
    return (win.url === url ? Promise.resolve(win) : win.navigate(url)).then(w => (w || win).focus()).catch(() => win.focus());
  }));
});
