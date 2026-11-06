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
    // controller is being replaced by a newer build.
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

        const announce = () => {
          if (navigator.serviceWorker.controller) {
            window.dispatchEvent(new Event('selorah:update-ready'));
          }
        };

        registration.addEventListener('updatefound', () => {
          const worker = registration.installing;
          if (!worker) return;
          worker.addEventListener('statechange', () => {
            if (worker.state === 'installed') announce();
          });
        });

        if (registration.waiting && navigator.serviceWorker.controller) {
          announce();
          registration.waiting.postMessage('SKIP_WAITING');
        }

        // Look for a new build when the app opens, regains focus, and every
        // 15 minutes while it stays open. A new worker activates itself, then
        // controllerchange reloads the page silently.
        void check();
        window.setInterval(() => void check(), 15 * 60 * 1000);
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') void check();
        });
      })
      .catch(() => {
        // Registration is best effort; the app still works without it.
      });
  });
}
