/* Posilovna – offline režim (service worker, scope ./posilovna).
   • Stránka aplikace: nejdřív síť (max. 3,5 s), jinak uložená kopie → online se změny projeví hned, offline se aplikace otevře.
   • Ikony, manifesty, Firebase SDK, fonty a knihovny z CDN: uložená kopie, jinak síť (adresy mají v sobě verzi).
   • Firestore a přihlášení jdou mimo – jejich offline režim řeší samotné Firebase.
   Při změně seznamu souborů zvyš VERSION. */
const VERSION = 'posilovna-v2';
const THEMES = ['neon', 'ocel', 'lava', 'titan', 'ruze', 'levandule', 'broskev'];
const SHELL = [
  './posilovna.html',
  './posilovna-icons/dar-qr.jpg',
  ...THEMES.flatMap(t => [`./posilovna-icons/posilovna-${t}-180.png`, `./posilovna-icons/posilovna-${t}-192.png`, `./posilovna-icons/posilovna-${t}.webmanifest`]),
];
const CDN = [
  'https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth-compat.js',
  'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore-compat.js',
  'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&family=Inter:wght@400;500;600&display=swap',
  'https://cdn.jsdelivr.net/npm/body-highlighter@3.0.2/dist/body-highlighter.esm.js',
];
// upload.wikimedia.org = fotky v motivaci (ukládají se postupně, jak se prohlížejí)
const STATIC_HOSTS = new Set(['fonts.googleapis.com', 'fonts.gstatic.com', 'cdn.jsdelivr.net', 'upload.wikimedia.org']);

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
    for (const k of await caches.keys()) if (k.startsWith('posilovna-') && k !== VERSION) await caches.delete(k);
    await self.clients.claim();
  })());
});

async function networkFirst(req) {
  const c = await caches.open(VERSION);
  try {
    const res = await Promise.race([fetch(req), new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 3500))]);
    if (res && res.ok) c.put('./posilovna.html', res.clone());
    return res;
  } catch {
    return (await c.match('./posilovna.html')) || (await c.match(req, { ignoreSearch: true })) || Response.error();
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
  if (req.mode === 'navigate' || (same && u.pathname.endsWith('/posilovna.html'))) { e.respondWith(networkFirst(req)); return; }
  if (same && u.pathname.includes('/posilovna-icons/')) { e.respondWith(cacheFirst(req)); return; }
  if (STATIC_HOSTS.has(u.hostname) || (u.hostname === 'www.gstatic.com' && u.pathname.startsWith('/firebasejs/'))) { e.respondWith(cacheFirst(req)); }
});
