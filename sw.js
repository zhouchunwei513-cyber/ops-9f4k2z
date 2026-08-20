// 小秘后台 PWA Service Worker
// 控制台单页结构简单，缓存主页与 manifest，离线可重开

const CACHE_VERSION = 'admin-v1';
const CORE_ASSETS = [
  '/ef9b87835c133308855277a7.html',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(CORE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  // api/collect 实时，不缓存；cdn 跨源放行
  if (url.pathname.startsWith('/api') ||
      url.pathname.startsWith('/collect') ||
      url.pathname.startsWith('/stats') ||
      url.pathname.startsWith('/verify') ||
      url.pathname.startsWith('/set-token') ||
      url.origin !== self.location.origin) {
    return;
  }

  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((res) => {
        if (res && res.ok) {
          const clone = res.clone();
          caches.open(CACHE_VERSION).then((c) => c.put(req, clone));
        }
        return res;
      }).catch(() => caches.match('/ef9b87835c133308855277a7.html'));
    })
  );
});