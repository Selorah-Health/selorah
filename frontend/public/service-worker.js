/* Selorah Health service worker. Fast shell, bounded network waits, offline ready. */
// The build step replaces this stamp, so every deployment installs a fresh
// worker. Old caches are removed on activation and the page updates silently.
const BUILD_STAMP = '__SELORAH_BUILD_STAMP__';
const VERSION = `selorah-${BUILD_STAMP}`;
const SHELL_CACHE = `${VERSION}-shell`;
const ASSET_CACHE = `${VERSION}-assets`;
// Caches with this prefix hold data that must survive a new deployment. They
// are intentionally excluded from the cleanup below.
const PERSISTENT_CACHE_PREFIX = 'selorah-keep-';
const PRECACHE_MANIFEST = '/precache-manifest.json';
// The build replaces this comment with the hashed asset list. Keeping an
// empty fallback means a dev or unstamped worker still installs the shell.
const BUILD_ASSETS = /* __SELORAH_BUILD_ASSETS__ */ [];
const NETWORK_TIMEOUT_MS = 4500;
// Navigations bypass the HTTP cache so a new deployment is picked up even if
// the browser still has an old index.html cached.
const FRESH_HTML = { cache: 'reload' };

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

function fetchWithTimeout(request, ms = NETWORK_TIMEOUT_MS, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);

  return fetch(request, { ...options, signal: controller.signal }).finally(() => {
    clearTimeout(timer);
  });
}

function fetchAssetWithTimeout(url, ms = 5000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);

  return fetch(url, { cache: 'reload', signal: controller.signal }).finally(() => {
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
      const shellCache = await caches.open(SHELL_CACHE);
      const assetCache = await caches.open(ASSET_CACHE);

      // The build injects every hashed JavaScript and CSS file here. Without
      // this list a lazy route chunk that was never opened online would fail
      // offline, leaving the app stuck on the splash screen. The manifest
      // fetch remains as a fallback for unstamped workers.
      let buildAssets = Array.isArray(BUILD_ASSETS)
        ? BUILD_ASSETS.filter((asset) => typeof asset === 'string')
        : [];

      if (buildAssets.length === 0) {
        try {
          const manifest = await fetchAssetWithTimeout(PRECACHE_MANIFEST);
          if (manifest.ok) {
            const parsed = await manifest.json();
            if (Array.isArray(parsed)) {
              buildAssets = parsed.filter((asset) => typeof asset === 'string');
            }
            await shellCache.put(PRECACHE_MANIFEST, manifest.clone());
          }
        } catch {
          // Fall back to the shell files below. The next online visit fills gaps.
        }
      }

      const assets = Array.from(new Set([...SHELL_ASSETS, ...buildAssets]));

      const cacheAsset = async (asset) => {
        try {
          const response = await fetchAssetWithTimeout(asset);
          if (!response.ok) return false;
          const target = asset.startsWith('/assets/') ? assetCache : shellCache;
          await target.put(asset, response);
          return true;
        } catch {
          return false;
        }
      };

      // Cache assets individually so one 404 never blocks the whole install.
      const failed = [];
      await Promise.all(
        assets.map(async (asset) => {
          const cached = await cacheAsset(asset);
          if (!cached) failed.push(asset);
        })
      );

      // A flaky mobile connection can drop a few requests. Retry those with a
      // short pause before the worker activates so offline pages are not left
      // with gaps.
      let retry = failed;
      for (const delay of [600, 1500]) {
        if (retry.length === 0) break;
        await new Promise((resolve) => setTimeout(resolve, delay));
        const stillFailed = [];
        await Promise.all(
          retry.map(async (asset) => {
            const cached = await cacheAsset(asset);
            if (!cached) stillFailed.push(asset);
          })
        );
        retry = stillFailed;
      }

      // skipWaiting is the custom-worker equivalent of Workbox's
      // skipWaiting: true. The page listens for controllerchange and reloads
      // once, without asking the patient.
      await self.skipWaiting();
    })().catch(() => {
      // A cache failure must never leave the old worker in control. Activate
      // the new worker even if some assets could not be prepared.
      return self.skipWaiting().catch(() => undefined);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // Delete every cache from an older build. The current shell and asset
      // caches are kept, and selorah-keep-* caches hold data that must survive
      // deployments.
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter(
            (key) =>
              key.startsWith('selorah-') &&
              key !== SHELL_CACHE &&
              key !== ASSET_CACHE &&
              !key.startsWith(PERSISTENT_CACHE_PREFIX)
          )
          .map((key) => caches.delete(key))
      );

      // clientsClaim is the custom-worker equivalent of Workbox's
      // clientsClaim: true. It puts the new worker in control immediately so
      // the page can pick up the new build on this visit, not the next one.
      await self.clients.claim();
    })().catch(() => {
      // Cache cleanup is best effort. Claim the page even if it fails.
      return self.clients.claim().catch(() => undefined);
    })
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
            const response = await fetchWithTimeout(
              request,
              NETWORK_TIMEOUT_MS,
              FRESH_HTML
            );
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
            const response = await fetchWithTimeout(
              request,
              NETWORK_TIMEOUT_MS,
              FRESH_HTML
            );
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
          const response = await fetchWithTimeout(
            request,
            NETWORK_TIMEOUT_MS,
            FRESH_HTML
          );
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

self.addEventListener('push', (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = {
      title: 'Selorah Health',
      body: event.data ? event.data.text() : '',
    };
  }

  const title = payload.title || 'Selorah Health';
  const url = payload.url || '/dashboard/notifications';
  const tag = payload.tag || 'selorah-notification';

  event.waitUntil(
    self.registration.showNotification(title, {
      body: payload.body || '',
      icon: '/pwa-192.png',
      badge: '/pwa-192.png',
      tag,
      renotify: true,
      data: { url, kind: payload.kind || 'system' },
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  const target = event.notification.data?.url || '/dashboard/notifications';
  event.notification.close();

  event.waitUntil(
    (async () => {
      const clientList = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      });

      for (const client of clientList) {
        if ('focus' in client) {
          await client.focus();
          if ('navigate' in client) {
            try {
              await client.navigate(target);
            } catch {
              // The focused tab is still the right destination.
            }
          }
          return;
        }
      }

      if (self.clients.openWindow) {
        await self.clients.openWindow(target);
      }
    })()
  );
});

self.addEventListener('pushsubscriptionchange', (event) => {
  event.waitUntil(
    (async () => {
      const clientList = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      });
      for (const client of clientList) {
        client.postMessage({ type: 'PUSH_SUBSCRIPTION_CHANGED' });
      }
    })()
  );
});
