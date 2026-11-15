/* Daily – offline režim (service worker, scope ./daily).
   • Stránka aplikace: nejdřív síť (max. 3,5 s), jinak uložená kopie → online se změny projeví hned, offline se aplikace otevře.
   • Ikony, manifest, fonty a Firebase SDK: uložená kopie, jinak síť.
   • Firestore a přihlášení jdou mimo – neodeslané změny si drží aplikace sama v localStorage.
   Při změně seznamu souborů zvyš VERSION. */
const VERSION = 'daily-v2';
const SHELL = ['./daily.html', './daily-icons/daily-180.png', './daily-icons/daily-192.png', './daily-icons/daily.webmanifest'];
const CDN = [
  'https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth-compat.js',
  'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore-compat.js',
  'https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&family=Geist+Mono:wght@400;500;600&family=Instrument+Serif:ital@0;1&display=swap',
];
const STATIC_HOSTS = new Set(['fonts.googleapis.com', 'fonts.gstatic.com']);

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const c = await caches.open(VERSION);
    await c.addAll(SHELL);
    await Promise.all(CDN.map(u => c.add(new Request(u, { mode: 'cors', credentials: 'omit' })).catch(() => {})));
    await self.skipWaiting();
  })());
});
self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k.startsWith('daily-') && k !== VERSION) await caches.delete(k);
    await self.clients.claim();
  })());
});

async function networkFirst(req) {
  const c = await caches.open(VERSION);
  try {
    const res = await Promise.race([fetch(req), new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 3500))]);
    if (res && res.ok) c.put('./daily.html', res.clone());
    return res;
  } catch {
    return (await c.match('./daily.html')) || Response.error();
  }
}
async function cacheFirst(req) {
  const c = await caches.open(VERSION);
  const hit = await c.match(req, { ignoreSearch: req.url.startsWith(self.location.origin) });
  if (hit) return hit;
  const res = await fetch(req);
  if (res && (res.ok || res.type === 'opaque')) c.put(req, res.clone());
  return res;
}

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const u = new URL(req.url);
  const same = u.origin === self.location.origin;
  if (same && u.pathname.endsWith('/daily.html')) { e.respondWith(networkFirst(req)); return; }
  if (same && u.pathname.includes('/daily-icons/')) { e.respondWith(cacheFirst(req)); return; }
  if (STATIC_HOSTS.has(u.hostname) || (u.hostname === 'www.gstatic.com' && u.pathname.startsWith('/firebasejs/'))) e.respondWith(cacheFirst(req));
});
