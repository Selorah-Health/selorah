import { useEffect, useState } from 'react';
import { ArrowPathIcon } from '@heroicons/react/24/outline';

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

/**
 * Applies a new service worker without asking the patient. The page reloads
 * once after the new worker takes control, so a new push becomes visible on
 * the next open even if the app was left in the background.
 */
export default function PwaUpdatePrompt() {
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    let applying = false;
    let timer: number | undefined;
    let hideTimer: number | undefined;

    const apply = async () => {
      if (applying) return;
      applying = true;
      setUpdating(true);

      try {
        const registration = await navigator.serviceWorker.getRegistration();
        registration?.waiting?.postMessage('SKIP_WAITING');
      } catch {
        // controllerchange still reloads when the worker activates.
      }

      // Fallback for browsers that do not fire controllerchange promptly.
      timer = window.setTimeout(reloadForUpdateOnce, 1400);
      hideTimer = window.setTimeout(() => setUpdating(false), 6000);
    };

    const applyIfWaiting = async () => {
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration?.waiting && navigator.serviceWorker.controller) {
          void apply();
        }
      } catch {
        // No worker yet.
      }
    };

    void applyIfWaiting();
    window.addEventListener('selorah:update-ready', apply);

    return () => {
      window.removeEventListener('selorah:update-ready', apply);
      if (timer) window.clearTimeout(timer);
      if (hideTimer) window.clearTimeout(hideTimer);
    };
  }, []);

  if (!updating) return null;

  return (
    <div className="fixed inset-x-0 bottom-[max(1rem,env(safe-area-inset-bottom))] z-[320] flex justify-center px-4">
      <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-[#101217] px-4 py-2.5 text-[11px] font-bold text-white shadow-[0_18px_45px_-18px_rgba(5,8,26,0.65)]">
        <ArrowPathIcon className="h-3.5 w-3.5 animate-spin text-[#5FFAB0]" />
        Updating Selorah
      </div>
    </div>
  );
}
