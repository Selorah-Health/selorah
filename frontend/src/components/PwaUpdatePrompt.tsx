import { useEffect, useState } from 'react';
import { ArrowPathIcon, SparklesIcon, XMarkIcon } from '@heroicons/react/24/outline';

export default function PwaUpdatePrompt() {
  const [visible, setVisible] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    const show = () => setVisible(true);
    window.addEventListener('selorah:update-ready', show);

    // Ask the browser to look for a new build when the app regains focus and
    // every 30 minutes while it stays open.
    const check = async () => {
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        await registration?.update();
      } catch {
        // Offline or unsupported. The next online visit checks again.
      }
    };

    const interval = window.setInterval(check, 30 * 60 * 1000);
    const onVisible = () => {
      if (document.visibilityState === 'visible') void check();
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      window.removeEventListener('selorah:update-ready', show);
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  const update = async () => {
    setUpdating(true);
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      registration?.waiting?.postMessage('SKIP_WAITING');
      window.setTimeout(() => window.location.reload(), 400);
    } catch {
      window.location.reload();
    }
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 top-[max(0.6rem,env(safe-area-inset-top))] z-[310] flex justify-center px-3">
      <div className="flex w-full max-w-md items-center gap-3 rounded-2xl border border-white/60 bg-[#101217] p-2.5 pl-3.5 text-white shadow-[0_20px_50px_-20px_rgba(5,8,26,0.7)]">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-[#5FFAB0]">
          <SparklesIcon className="h-4.5 w-4.5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[12px] font-bold leading-tight">A new Selorah update is ready</p>
          <p className="mt-0.5 text-[10px] font-medium text-white/50">
            Refresh to get the latest fixes. Your data stays in place.
          </p>
        </div>
        <button
          type="button"
          onClick={update}
          disabled={updating}
          className="flex min-h-[38px] shrink-0 items-center gap-1.5 rounded-full bg-white px-3.5 text-[10px] font-black uppercase tracking-[0.08em] text-[#101217] disabled:opacity-60"
        >
          <ArrowPathIcon className={`h-3.5 w-3.5 ${updating ? 'animate-spin' : ''}`} />
          {updating ? 'Updating' : 'Update'}
        </button>
        <button
          type="button"
          onClick={() => setVisible(false)}
          aria-label="Dismiss update"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white/40 hover:text-white"
        >
          <XMarkIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
