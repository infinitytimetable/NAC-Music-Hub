// keeps the apps on the device so they open without internet; a new version replaces the old copy
const V = 'nac-1.9.6', A = 'nac-assets';
// assets are named <part>.<hash>.<ext>; when a new copy of a part is saved, older copies of it are removed
const stem = p => p.replace(/\.[0-9a-f]{6,}(\.[a-z0-9]+)$/i, '$1');
self.addEventListener('install', e => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V && k !== A).map(k => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin || u.pathname.endsWith('version.json') || u.pathname.endsWith('sw.js') || u.pathname.includes('/downloads/')) return;
  const big = u.pathname.includes('/assets/');   // hymn books etc. – named by content, kept across versions
  e.respondWith(caches.open(big ? A : V).then(async c => {
    const hit = await c.match(e.request, { ignoreSearch: true }); if (hit) return hit;
    const r = await fetch(e.request);
    if (r.ok && r.type === 'basic') {
      const cp = r.clone();
      e.waitUntil((async () => {
        if (big) { const s = stem(u.pathname); for (const k of await c.keys()) { const p = new URL(k.url).pathname; if (p !== u.pathname && stem(p) === s) await c.delete(k); } }
        await c.put(e.request, cp);
      })().catch(() => { }));
    }
    return r;
  }).catch(() => fetch(e.request)));
});
