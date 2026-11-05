/* Selorah Health service worker. Fast shell, bounded network waits, offline ready. */
const VERSION = 'selorah-v6';
const SHELL_CACHE = `${VERSION}-shell`;
const ASSET_CACHE = `${VERSION}-assets`;
const PREVIOUS_CACHE_PREFIX = 'selorah-v3';
const NETWORK_TIMEOUT_MS = 4500;

const LEGAL_PATHS = new Set(['/privacy', '/terms', '/cookie-policy', '/dpa']);

const SHELL_ASSETS = [
  '/',
  '/index.html',
  '/privacy',
  '/terms',
  '/cookie-policy',
  '/dpa',
  '/manifest.webmanifest',
  '/logo.png',
  '/logo.svg',
  '/pwa-192.png',
  '/pwa-512.png',
  '/pwa-maskable-512.png',
  '/apple-touch-icon.png',
];

const OFFLINE_HTML = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Selorah is offline</title>
    <style>
      body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #F8F9FA; color: #101217; font-family: Sora, system-ui, sans-serif; padding: 24px; }
      main { max-width: 420px; text-align: center; }
      span { display: inline-flex; align-items: center; justify-content: center; width: 56px; height: 56px; border-radius: 18px; background: #EEF2FF; color: #6183FF; font-size: 26px; }
      h1 { margin: 18px 0 8px; font-size: 24px; letter-spacing: -0.03em; }
      p { margin: 0; color: #6B7280; font-size: 14px; line-height: 1.6; }
      a { display: inline-flex; margin-top: 20px; padding: 12px 20px; border-radius: 999px; background: #6183FF; color: white; font-size: 13px; font-weight: 700; text-decoration: none; }
    </style>
  </head>
  <body>
    <main>
      <span>+</span>
      <h1>You are offline</h1>
      <p>Your cached Selorah pages are still available. Reconnect to sync new records, payments, and research updates.</p>
      <a href="/">Try again</a>
    </main>
  </body>
</html>`;

function fetchWithTimeout(request, ms = NETWORK_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);

  return fetch(request, { signal: controller.signal }).finally(() => {
    clearTimeout(timer);
  });
}

function isCacheableAsset(url) {
  if (url.origin !== self.location.origin) return false;
  if (
    ['/api', '/rest', '/auth', '/storage', '/functions', '/realtime'].some((path) =>
      url.pathname.startsWith(path)
    )
  ) {
    return false;
  }
  if (/\.(mp4|webm|mov)$/i.test(url.pathname)) return false;
  if (url.pathname === '/service-worker.js') return false;
  return /\.(js|css|png|jpg|jpeg|svg|webp|avif|woff2?|ttf|json|webmanifest)$/i.test(
    url.pathname
  );
}

function shouldSkipRequest(url) {
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return true;
  if (url.hostname.includes('supabase')) return true;
  if (url.hostname.includes('translate.google')) return true;
  if (url.hostname.includes('googletagmanager')) return true;
  if (url.hostname.includes('google-analytics')) return true;
  if (url.hostname.includes('sentry')) return true;
  return false;
}

async function cacheResponse(cache, request, response) {
  if (!response) return response;
  if (response.ok || response.type === 'opaque') {
    try {
      await cache.put(request, response.clone());
    } catch {
      // Quota or an opaque response can fail; the network result still works.
    }
  }
  return response;
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(SHELL_CACHE);
      // Cache assets individually so one 404 never blocks the whole install.
      await Promise.all(
        SHELL_ASSETS.map(async (asset) => {
          try {
            const response = await fetch(asset, { cache: 'reload' });
            if (response.ok) await cache.put(asset, response);
          } catch {
            // The next online visit will fill the gap.
          }
        })
      );
    })()
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter(
            (key) =>
              key.startsWith('selorah-') &&
              key !== SHELL_CACHE &&
              key !== ASSET_CACHE &&
              !key.startsWith(PREVIOUS_CACHE_PREFIX)
          )
          .map((key) => caches.delete(key))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  if (request.headers.has('range')) return;

  const url = new URL(request.url);
  if (shouldSkipRequest(url)) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        const cache = await caches.open(SHELL_CACHE);
        const pathname = url.pathname.replace(/\/+$/, '') || '/';

        if (LEGAL_PATHS.has(pathname)) {
          try {
            const response = await fetchWithTimeout(request);
            if (response.ok) await cache.put(request, response.clone());
            return response;
          } catch {
            const cached = await cache.match(request);
            if (cached) return cached;
          }
        }

        const cached =
          (await cache.match('/index.html')) ||
          (await caches.match('/index.html')) ||
          (await caches.match('/'));

        const refresh = (async () => {
          try {
            const response = await fetchWithTimeout(request);
            if (response.ok) await cache.put('/index.html', response.clone());
          } catch {
            // Offline or slow network. The cached shell is still valid.
          }
        })();

        if (cached) {
          event.waitUntil(refresh);
          return cached;
        }

        try {
          const response = await fetchWithTimeout(request);
          if (response.ok) await cache.put('/index.html', response.clone());
          return response;
        } catch {
          return new Response(OFFLINE_HTML, {
            status: 503,
            headers: { 'Content-Type': 'text/html; charset=utf-8' },
          });
        }
      })()
    );
    return;
  }

  if (isCacheableAsset(url) || url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(
      (async () => {
        const cache = await caches.open(ASSET_CACHE);
        const cached = (await cache.match(request)) || (await caches.match(request));

        if (cached) {
          event.waitUntil(
            (async () => {
              try {
                const response = await fetchWithTimeout(request);
                await cacheResponse(cache, request, response);
              } catch {
                // Keep the cached copy.
              }
            })()
          );
          return cached;
        }

        try {
          const response = await fetchWithTimeout(request);
          return cacheResponse(cache, request, response);
        } catch {
          return new Response('', { status: 504, statusText: 'Offline' });
        }
      })()
    );
  }
});

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
