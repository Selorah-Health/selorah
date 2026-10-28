import { useEffect, useState } from 'react';
import {
  ArrowDownTrayIcon,
  CheckCircleIcon,
  ShareIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

type InstallEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

type PromptMode = 'install' | 'ios' | null;

const DISMISS_KEY = 'selorah_install_dismissed_v2';
const DESKTOP_BREAKPOINT = '(min-width: 1024px)';

function isStandalone() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function detectIosSafari() {
  const ua = navigator.userAgent;
  const isIos =
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS|GSA/.test(ua);
  return isIos && isSafari;
}

export default function InstallPrompt() {
  const [installEvent, setInstallEvent] = useState<InstallEvent | null>(null);
  const [mode, setMode] = useState<PromptMode>(null);
  const [visible, setVisible] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      if (localStorage.getItem(DISMISS_KEY) === '1') return;
    } catch {
      return;
    }
    if (isStandalone()) return;

    // Mobile and tablets only. Desktop never sees the prompt.
    if (window.matchMedia(DESKTOP_BREAKPOINT).matches) return;

    const handlePrompt = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as InstallEvent);
      setMode('install');
      setVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handlePrompt);

    let iosTimer: ReturnType<typeof setTimeout> | undefined;
    if (detectIosSafari()) {
      iosTimer = setTimeout(() => {
        setMode('ios');
        setVisible(true);
      }, 3200);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handlePrompt);
      if (iosTimer) clearTimeout(iosTimer);
    };
  }, []);

  const install = async () => {
    if (!installEvent) return;
    setInstalling(true);
    try {
      await installEvent.prompt();
      const choice = await installEvent.userChoice;
      if (choice.outcome === 'accepted') dismiss(false);
    } finally {
      setInstalling(false);
    }
  };

  const dismiss = (remember = true) => {
    setVisible(false);
    if (!remember) return;
    try {
      localStorage.setItem(DISMISS_KEY, '1');
    } catch {
      // Storage can be unavailable in private mode.
    }
  };

  if (!visible || !mode) return null;

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-[240] px-3 pb-[max(0.85rem,env(safe-area-inset-bottom))] lg:hidden"
      role="dialog"
      aria-label="Install Selorah"
    >
      <div className="relative mx-auto max-w-md overflow-hidden rounded-[28px] border border-white/60 bg-white/95 shadow-[0_24px_70px_-18px_rgba(15,23,42,0.45)] backdrop-blur-xl animate-in slide-in-from-bottom-4">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[#6183FF]/10 to-transparent"
        />

        <div className="relative flex items-start gap-3.5 p-4 pr-3">
          <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-[#6183FF] to-[#4D6ED6] text-white shadow-lg shadow-[#6183FF]/25">
            <ArrowDownTrayIcon className="h-6 w-6" strokeWidth={1.8} />
          </div>

          <div className="min-w-0 flex-1 pt-0.5">
            <div className="flex items-center gap-2">
              <p className="text-[15px] font-bold leading-tight text-[#101217]">
                Install Selorah
              </p>
              <span className="rounded-full bg-[#EAFBF2] px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-[#15955c]">
                Works offline
              </span>
            </div>

            {mode === 'install' ? (
              <p className="mt-1 text-[11.5px] font-medium leading-snug text-gray-500">
                Add it to your home screen for faster, offline access to your records.
              </p>
            ) : (
              <div className="mt-1.5 space-y-1 text-[11.5px] font-medium leading-snug text-gray-500">
                <p className="flex items-center gap-1.5">
                  <ShareIcon className="h-3.5 w-3.5 shrink-0 text-[#6183FF]" />
                  Tap the Share button in Safari
                </p>
                <p className="flex items-center gap-1.5">
                  <CheckCircleIcon className="h-3.5 w-3.5 shrink-0 text-[#6183FF]" />
                  Choose &quot;Add to Home Screen&quot;
                </p>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => dismiss()}
            aria-label="Dismiss install prompt"
            className="-mr-1 -mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-gray-300 transition-colors hover:bg-gray-100 hover:text-gray-500"
          >
            <XMarkIcon className="h-4.5 w-4.5" />
          </button>
        </div>

        <div className="relative px-4 pb-4">
          {mode === 'install' ? (
            <button
              type="button"
              onClick={install}
              disabled={installing}
              className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#6183FF] to-[#4D6ED6] px-5 text-sm font-bold text-white shadow-lg shadow-[#6183FF]/20 transition-all active:scale-[0.99] disabled:opacity-60"
            >
              <ArrowDownTrayIcon className="h-4.5 w-4.5" />
              {installing ? 'Opening installer...' : 'Install app'}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => dismiss()}
              className="flex min-h-[44px] w-full items-center justify-center rounded-2xl bg-[#101217] px-5 text-sm font-bold text-white transition-all active:scale-[0.99]"
            >
              Got it
            </button>
          )}
          <p className="mt-2 text-center text-[9.5px] font-semibold uppercase tracking-wider text-gray-300">
            No app store. No extra downloads.
          </p>
        </div>
      </div>
    </div>
  );
}