<<<<<<< HEAD
/* Selorah Health service worker. Lightweight, offline-first app shell. */
const VERSION = 'selorah-v3';
const SHELL_CACHE = `${VERSION}-shell`;
const ASSET_CACHE = `${VERSION}-assets`;

const SHELL_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/logo.png',
  '/logo.svg',
  '/pwa-192.png',
  '/pwa-512.png',
  '/pwa-maskable-512.png',
  '/apple-touch-icon.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll(SHELL_ASSETS))
      .catch(() => undefined)
      .then(() => self.skipWaiting())
=======
/* Lightweight service worker for the Selorah PWA. */
const CACHE = 'selorah-v1';
const CORE = ['/', '/manifest.webmanifest', '/logo.svg'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(CORE)).then(() => self.skipWaiting())
>>>>>>> 908a1e70 (Version 1.3)
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
<<<<<<< HEAD
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => !key.startsWith(VERSION))
            .map((key) => caches.delete(key))
        )
      )
=======
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
>>>>>>> 908a1e70 (Version 1.3)
      .then(() => self.clients.claim())
  );
});

<<<<<<< HEAD
function isCacheableAsset(request, url) {
  if (url.origin !== self.location.origin) return false;
  if (['/api', '/rest', '/auth', '/storage'].some((path) => url.pathname.startsWith(path))) {
    return false;
  }
  if (/\.(mp4|webm|mov)$/i.test(url.pathname)) return false;
  return /\.(js|css|png|jpg|jpeg|svg|webp|woff2?|ttf|json|webmanifest)$/i.test(
    url.pathname
  );
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return;
  if (url.hostname.includes('supabase')) return;
  if (url.hostname.includes('translate.google')) return;
  if (request.headers.has('range')) return;
=======
self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
>>>>>>> 908a1e70 (Version 1.3)

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
<<<<<<< HEAD
          if (response.ok) {
            const copy = response.clone();
            caches.open(SHELL_CACHE).then((cache) => cache.put('/index.html', copy));
          }
          return response;
        })
        .catch(async () => {
          const cached =
            (await caches.match('/index.html')) || (await caches.match('/'));
          return (
            cached ||
            new Response('<h1>Selorah is offline</h1>', {
              headers: { 'Content-Type': 'text/html' },
              status: 503,
            })
          );
        })
=======
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match('/')))
>>>>>>> 908a1e70 (Version 1.3)
    );
    return;
  }

<<<<<<< HEAD
  if (isCacheableAsset(request, url)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const network = fetch(request)
          .then((response) => {
            if (response.ok) {
              const copy = response.clone();
              caches.open(ASSET_CACHE).then((cache) => cache.put(request, copy));
            }
            return response;
          })
          .catch(() => cached);
        return cached || network;
      })
    );
    return;
  }

  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(ASSET_CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        });
      })
    );
  }
});

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
=======
  const isAsset =
    url.pathname.startsWith('/assets/') ||
    url.pathname.startsWith('/landing/') ||
    /\.(?:css|js|png|jpg|jpeg|webp|svg|woff2?|mp4)$/i.test(url.pathname);

  if (!isAsset) return;

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (!response || response.status !== 200) return response;
        const copy = response.clone();
        caches.open(CACHE).then((cache) => cache.put(request, copy));
        return response;
      });
    })
  );
>>>>>>> 908a1e70 (Version 1.3)
});
