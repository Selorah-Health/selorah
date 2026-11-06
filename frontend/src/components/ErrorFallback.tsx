import { useEffect, useState } from 'react';
import { ArrowPathIcon } from '@heroicons/react/24/outline';

type ErrorFallbackProps = {
  error?: Error | null;
  errorId?: string;
  onRetry?: () => void;
};

const ERROR_RELOAD_KEY = 'selorah:error-reload-at';

/**
 * A new deployment can briefly leave an open tab on an old chunk. Reload once
 * automatically so the patient never sees a technical error screen. If the
 * same tab fails again within 15 seconds, show one calm refresh button.
 */
export default function ErrorFallback({ onRetry }: ErrorFallbackProps) {
  const [recovering] = useState(() => {
    try {
      const last = Number(window.sessionStorage.getItem(ERROR_RELOAD_KEY) || 0);
      return Date.now() - last >= 15000;
    } catch {
      return true;
    }
  });

  useEffect(() => {
    if (!recovering) return;

    try {
      window.sessionStorage.setItem(ERROR_RELOAD_KEY, String(Date.now()));
    } catch {
      // Session storage can be blocked in private mode.
    }
    const timer = window.setTimeout(() => window.location.reload(), 900);

    return () => {
      window.clearTimeout(timer);
    };
  }, [recovering]);

  const refresh = () => {
    onRetry?.();
    try {
      window.sessionStorage.removeItem(ERROR_RELOAD_KEY);
    } catch {
      // Session storage can be blocked in private mode.
    }
    window.location.reload();
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F8F9FE] px-5 py-12 font-sora text-[#101217]">
      <main className="w-full max-w-md rounded-[28px] border border-white/70 bg-white/95 p-8 text-center shadow-[0_30px_80px_-30px_rgba(5,8,26,0.28)] backdrop-blur-2xl">
        <img src="/logo.svg" alt="Selorah" className="mx-auto h-12 w-12 object-contain" />

        {recovering ? (
          <>
            <span className="mx-auto mt-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <ArrowPathIcon className="h-5 w-5 animate-spin" />
            </span>
            <h1 className="mt-5 text-xl font-bold tracking-tight">Updating Selorah</h1>
            <p className="mt-2 text-sm font-medium leading-relaxed text-gray-400">
              This will only take a moment. Your health data stays safe.
            </p>
          </>
        ) : (
          <>
            <span className="mx-auto mt-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <ArrowPathIcon className="h-5 w-5" />
            </span>
            <h1 className="mt-5 text-xl font-bold tracking-tight">
              Selorah needs a quick refresh
            </h1>
            <p className="mt-2 text-sm font-medium leading-relaxed text-gray-400">
              Your data is safe. Refresh the page to continue where you left off.
            </p>
            <button
              type="button"
              onClick={refresh}
              className="mt-6 inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl bg-primary px-5 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-colors hover:bg-primary-hover"
            >
              <ArrowPathIcon className="h-4 w-4" />
              Refresh Selorah
            </button>
            <a
              href="mailto:support@selorah.app"
              className="mt-4 inline-flex text-[11px] font-bold text-gray-400 underline-offset-4 hover:text-primary hover:underline"
            >
              Contact support
            </a>
          </>
        )}
      </main>
    </div>
  );
}
