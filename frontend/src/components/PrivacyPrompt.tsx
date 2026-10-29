import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  CheckIcon,
  LockClosedIcon,
  MagnifyingGlassIcon,
  ShieldCheckIcon,
  SparklesIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import {
  acceptOptionalPrivacy,
  essentialOnlyPrivacy,
  hasPrivacyDecision,
  listenForPrivacy,
  readPrivacy,
  savePrivacy,
} from '../lib/privacy';

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative flex h-7 w-12 shrink-0 items-center rounded-full border transition-colors ${
        checked ? 'border-[#6183FF] bg-[#6183FF]' : 'border-gray-200 bg-gray-200'
      }`}
    >
      <span
        className={`absolute h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
          checked ? 'translate-x-[26px]' : 'translate-x-[3px]'
        }`}
      />
    </button>
  );
}

export default function PrivacyPrompt() {
  const location = useLocation();
  const [decided, setDecided] = useState(() => hasPrivacyDecision());
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);
  const [personalisation, setPersonalisation] = useState(() => readPrivacy().personalisation);
  const [searchHistory, setSearchHistory] = useState(() => readPrivacy().searchHistory);

  const hiddenRoute =
    location.pathname.startsWith('/shared/') || location.pathname.startsWith('/qa');

  useEffect(() => {
    const timer = window.setTimeout(() => setReady(true), 1200);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(
    () =>
      listenForPrivacy((prefs) => {
        setDecided(Boolean(prefs.decidedAt));
        setPersonalisation(prefs.personalisation);
        setSearchHistory(prefs.searchHistory);
        setOpen(false);
      }),
    []
  );

  const finish = (personal: boolean, history: boolean) => {
    savePrivacy({ personalisation: personal, searchHistory: history });
    setDecided(true);
  };

  if (hiddenRoute || decided || !ready) return null;

  return (
    <>
      {!open && (
        <div className="fixed inset-x-0 bottom-0 z-[250] px-3 pb-[max(0.85rem,env(safe-area-inset-bottom))] sm:px-5">
          <div className="relative mx-auto max-w-3xl overflow-hidden rounded-[26px] border border-white/70 bg-white/95 shadow-[0_26px_80px_-22px_rgba(5,8,26,0.5)] backdrop-blur-xl animate-in slide-in-from-bottom-4">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-[#6183FF] to-[#14F1D9]"
            />
            <div className="flex flex-col gap-3 p-4 pl-5 sm:flex-row sm:items-center sm:gap-4 sm:pr-3">
              <div className="flex min-w-0 flex-1 items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#EEF2FF] text-[#6183FF]">
                  <ShieldCheckIcon className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className="text-[13px] font-black tracking-tight text-[#101217]">
                    Your privacy, your call
                  </p>
                  <p className="mt-0.5 text-[11px] font-medium leading-relaxed text-gray-500">
                    Essential storage keeps you signed in. Optional storage remembers preferences
                    on this device. No advertising cookies, ever.
                  </p>
                </div>
              </div>

              <div className="flex shrink-0 flex-wrap items-center gap-2 pl-[52px] sm:pl-0">
                <button
                  type="button"
                  onClick={() => finish(true, true)}
                  className="min-h-[38px] rounded-full bg-[#6183FF] px-4 text-[10px] font-black uppercase tracking-[0.08em] text-white shadow-lg shadow-[#6183FF]/20 transition-colors hover:bg-[#4D6ED6]"
                >
                  Accept optional
                </button>
                <button
                  type="button"
                  onClick={() => finish(false, false)}
                  className="min-h-[38px] rounded-full border border-gray-200 bg-white px-3.5 text-[10px] font-black uppercase tracking-[0.08em] text-gray-500 transition-colors hover:border-gray-300 hover:text-[#101217]"
                >
                  Essential only
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(true)}
                  className="min-h-[38px] rounded-full px-2.5 text-[10px] font-black uppercase tracking-[0.08em] text-[#6183FF] transition-colors hover:text-[#4D6ED6]"
                >
                  Manage
                </button>
                <button
                  type="button"
                  onClick={() => finish(false, false)}
                  aria-label="Decline optional storage"
                  className="flex h-8 w-8 items-center justify-center rounded-full text-gray-300 transition-colors hover:bg-gray-100 hover:text-gray-500"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {open && (
        <div
          className="fixed inset-0 z-[260] flex items-end justify-center bg-[#05081A]/60 p-3 backdrop-blur-sm sm:items-center sm:p-6"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setOpen(false);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="privacy-title"
            className="w-full max-w-lg overflow-hidden rounded-[28px] border border-white/60 bg-white shadow-[0_40px_100px_-30px_rgba(5,8,26,0.65)] animate-in slide-in-from-bottom-4 sm:zoom-in-95"
          >
            <div className="relative overflow-hidden border-b border-gray-100 bg-gradient-to-br from-[#EEF2FF] via-white to-[#E9FBF6] px-5 pb-5 pt-5">
              <div
                aria-hidden
                className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[#6183FF]/15 blur-2xl"
              />
              <div className="relative flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#6183FF] text-white shadow-lg shadow-[#6183FF]/25">
                    <ShieldCheckIcon className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#6183FF]">
                      Privacy choices
                    </p>
                    <h2 id="privacy-title" className="mt-0.5 text-lg font-black tracking-tight text-[#101217]">
                      You are in control
                    </h2>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close privacy choices"
                  className="-mr-1 -mt-1 flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-white hover:text-gray-600"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>
              <p className="relative mt-3 text-[11px] font-medium leading-relaxed text-gray-500">
                Selorah does not use advertising or tracking cookies. Your health records always
                live in your secure account, not in this browser.
              </p>
            </div>

            <div className="max-h-[52vh] space-y-2.5 overflow-y-auto px-5 py-4">
              <div className="flex items-start gap-3 rounded-2xl border border-gray-100 bg-[#F8F9FE] p-3.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-[#15955C] shadow-sm">
                  <LockClosedIcon className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-bold text-[#101217]">Essential storage</p>
                    <span className="rounded-full bg-[#EAFBF2] px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.1em] text-[#15955C]">
                      Always on
                    </span>
                  </div>
                  <p className="mt-1 text-[10px] font-medium leading-relaxed text-gray-400">
                    Keeps you signed in, protects your session, and remembers this privacy choice.
                    Required for Selorah to work.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-2xl border border-gray-100 p-3.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#EEF2FF] text-[#6183FF]">
                  <SparklesIcon className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-bold text-[#101217]">Personalisation</p>
                    <Toggle
                      checked={personalisation}
                      onChange={setPersonalisation}
                      label="Personalisation storage"
                    />
                  </div>
                  <p className="mt-1 text-[10px] font-medium leading-relaxed text-gray-400">
                    Remembers your theme and dismissed tips on this device. Off means Selorah
                    forgets them when you close the browser.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-2xl border border-gray-100 p-3.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#EAFBF2] text-[#15955C]">
                  <MagnifyingGlassIcon className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-bold text-[#101217]">Search history</p>
                    <Toggle
                      checked={searchHistory}
                      onChange={setSearchHistory}
                      label="Search history storage"
                    />
                  </div>
                  <p className="mt-1 text-[10px] font-medium leading-relaxed text-gray-400">
                    Keeps your last few searches on this device so you can pick up quickly. Never
                    shared with anyone.
                  </p>
                </div>
              </div>

              <p className="px-1 pt-1 text-[10px] font-medium leading-relaxed text-gray-400">
                You can change this at any time in Profile and settings. Read the{' '}
                <a href="/privacy" className="font-bold text-[#6183FF] hover:underline">
                  Privacy Policy
                </a>{' '}
                and{' '}
                <a href="/cookie-policy" className="font-bold text-[#6183FF] hover:underline">
                  Storage Policy
                </a>
                .
              </p>
            </div>

            <div className="flex flex-col-reverse gap-2 border-t border-gray-100 bg-[#F8F9FE] px-5 py-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => {
                  essentialOnlyPrivacy();
                  setDecided(true);
                }}
                className="min-h-[44px] rounded-full border border-gray-200 bg-white px-4 text-xs font-bold text-gray-500 transition-colors hover:border-gray-300 hover:text-[#101217]"
              >
                Essential only
              </button>
              <button
                type="button"
                onClick={() => {
                  finish(personalisation, searchHistory);
                }}
                className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-full bg-[#6183FF] px-5 text-xs font-bold text-white shadow-lg shadow-[#6183FF]/20 transition-colors hover:bg-[#4D6ED6]"
              >
                <CheckIcon className="h-4 w-4" />
                Save choices
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
