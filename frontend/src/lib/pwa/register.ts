let registered = false;

const UPDATE_RELOAD_KEY = 'selorah:update-reload-at';

function reloadForUpdateOnce() {
  try {
    const last = Number(window.sessionStorage.getItem(UPDATE_RELOAD_KEY) || 0);
    if (Date.now() - last < 5000) return;
    window.sessionStorage.setItem(UPDATE_RELOAD_KEY, String(Date.now()));
  } catch {
    // Session storage can be blocked in private mode.
  }
  window.location.reload();
}

export function registerServiceWorker() {
  if (registered || typeof window === 'undefined') return;
  if (!('serviceWorker' in navigator)) return;
  if (import.meta.env.DEV) return;
  registered = true;

  const hadController = Boolean(navigator.serviceWorker.controller);

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    // The first install also claims the page. Only reload when an existing
    // controller is being replaced by a newer build, so the very first visit
    // does not reload for no reason.
    if (!hadController) return;
    reloadForUpdateOnce();
  });

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/service-worker.js', { scope: '/', updateViaCache: 'none' })
      .then((registration) => {
        const check = async () => {
          try {
            await registration.update();
          } catch {
            // Offline or unsupported. The next online visit checks again.
          }
        };

        // The service worker calls skipWaiting during install. This message is
        // a fallback for a worker deployed before that change, which may still
        // be waiting for permission to activate.
        const activateWaiting = () => {
          if (registration.waiting && navigator.serviceWorker.controller) {
            registration.waiting.postMessage('SKIP_WAITING');
          }
        };

        registration.addEventListener('updatefound', () => {
          const worker = registration.installing;
          if (!worker) return;

          worker.addEventListener('statechange', () => {
            if (worker.state === 'installed' && navigator.serviceWorker.controller) {
              worker.postMessage('SKIP_WAITING');
            }
          });
        });

        activateWaiting();

        // Look for a new build when the app opens, regains focus, and every
        // 15 minutes while it stays open. The new worker activates itself,
        // then controllerchange reloads the page once without a prompt.
        void check();
        window.setInterval(() => void check(), 15 * 60 * 1000);
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') void check();
        });
        window.addEventListener('pageshow', (event) => {
          if (event.persisted) void check();
        });
      })
      .catch(() => {
        // Registration is best effort; the app still works without it.
      });
  });
}
