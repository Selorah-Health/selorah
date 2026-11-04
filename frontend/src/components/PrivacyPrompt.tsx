import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  CheckIcon,
  LockClosedIcon,
  MagnifyingGlassIcon,
  ShieldCheckIcon,
  SparklesIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import {
  hasPrivacyDecision,
  listenForPrivacy,
  PRIVACY_OPEN_EVENT,
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
  const [forceOpen, setForceOpen] = useState(false);
  const [personalisation, setPersonalisation] = useState(() => readPrivacy().personalisation);
  const [searchHistory, setSearchHistory] = useState(() => readPrivacy().searchHistory);

  const hiddenRoute =
    location.pathname.startsWith('/shared/') || location.pathname.startsWith('/qa');

  useEffect(() => {
    const timer = window.setTimeout(() => setReady(true), 900);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const onOpen = () => {
      setForceOpen(true);
      setOpen(true);
      setReady(true);
    };
    window.addEventListener(PRIVACY_OPEN_EVENT, onOpen);
    return () => window.removeEventListener(PRIVACY_OPEN_EVENT, onOpen);
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

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  const finish = (personal: boolean, history: boolean) => {
    savePrivacy({ personalisation: personal, searchHistory: history });
    setDecided(true);
    setForceOpen(false);
    setOpen(false);
  };

  if (hiddenRoute || !ready || (decided && !forceOpen)) return null;

  return (
    <>
      {!open && (
        <div className="fixed inset-x-0 bottom-0 z-[250] px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-5">
          <div className="mx-auto max-w-3xl overflow-hidden rounded-[26px] border border-white/60 bg-white/85 shadow-[0_28px_90px_-24px_rgba(5,8,26,0.55)] backdrop-blur-2xl">
            <div className="h-1 w-full bg-[#6183FF]" aria-hidden />
            <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-4 sm:p-5">
              <div className="flex min-w-0 flex-1 items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#EEF2FF] text-[#6183FF]">
                  <ShieldCheckIcon className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className="text-[13px] font-black tracking-tight text-[#101217]">
                    Your privacy, your call
                  </p>
                  <p className="mt-1 text-[11px] font-medium leading-relaxed text-gray-500">
                    Essential storage keeps you signed in. Optional storage only remembers
                    preferences on this device. No advertising cookies, ever.
                  </p>
                </div>
              </div>

              <div className="grid shrink-0 grid-cols-2 gap-2 sm:flex sm:items-center">
                <button
                  type="button"
                  onClick={() => finish(true, true)}
                  className="col-span-2 min-h-[42px] rounded-full bg-[#6183FF] px-4 text-[10px] font-black uppercase tracking-[0.08em] text-white shadow-lg shadow-[#6183FF]/20 transition-colors hover:bg-[#4D6ED6] sm:col-span-1"
                >
                  Accept all
                </button>
                <button
                  type="button"
                  onClick={() => finish(false, false)}
                  className="min-h-[42px] rounded-full border border-gray-200 bg-white px-3.5 text-[10px] font-black uppercase tracking-[0.08em] text-gray-500 transition-colors hover:border-gray-300 hover:text-[#101217]"
                >
                  Essential only
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(true)}
                  className="min-h-[42px] rounded-full px-3 text-[10px] font-black uppercase tracking-[0.08em] text-[#6183FF] transition-colors hover:bg-[#EEF2FF] hover:text-[#4D6ED6]"
                >
                  Manage
                </button>
                <button
                  type="button"
                  onClick={() => finish(false, false)}
                  aria-label="Decline optional storage"
                  className="flex h-11 w-11 items-center justify-center justify-self-end rounded-full text-gray-300 transition-colors hover:bg-gray-100 hover:text-gray-500 sm:h-8 sm:w-8"
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
          className="fixed inset-0 z-[260] flex items-end justify-center bg-[#05081A]/45 p-0 backdrop-blur-md sm:items-center sm:p-6"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setOpen(false);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="privacy-title"
            className="flex max-h-[calc(100dvh-0.25rem)] w-full max-w-lg flex-col overflow-hidden rounded-t-[28px] border border-white/60 bg-white/85 shadow-[0_40px_100px_-30px_rgba(5,8,26,0.65)] backdrop-blur-2xl sm:max-h-[min(90dvh,760px)] sm:rounded-[28px]"
          >
            <div className="shrink-0 border-b border-white/40 bg-[#EEF2FF]/60 px-5 pb-5 pt-5 backdrop-blur-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#6183FF] text-white shadow-lg shadow-[#6183FF]/25">
                    <ShieldCheckIcon className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#6183FF]">
                      Privacy choices
                    </p>
                    <h2
                      id="privacy-title"
                      className="mt-0.5 text-lg font-black tracking-tight text-[#101217]"
                    >
                      You are in control
                    </h2>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close privacy choices"
                  className="-mr-1 -mt-1 flex h-10 w-10 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-white hover:text-gray-600 sm:h-8 sm:w-8"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>
              <p className="mt-3 text-[11px] font-medium leading-relaxed text-gray-500">
                Selorah does not use advertising or tracking cookies. Your health records always
                live in your secure account, not in this browser.
              </p>
            </div>

            <div className="min-h-0 flex-1 space-y-2.5 overflow-y-auto overscroll-contain px-5 py-4">
              <div className="flex items-start gap-3 rounded-2xl border border-white/40 bg-[#F8F9FE]/60 p-3.5 backdrop-blur-sm">
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
                <Link to="/privacy" className="font-bold text-[#6183FF] hover:underline">
                  Privacy Policy
                </Link>{' '}
                and{' '}
                <Link to="/cookie-policy" className="font-bold text-[#6183FF] hover:underline">
                  Storage Policy
                </Link>
                .
              </p>
            </div>

            <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-white/40 bg-[#F8F9FE]/60 px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 backdrop-blur-sm sm:flex-row sm:justify-end sm:pb-4">
              <button
                type="button"
                onClick={() => finish(false, false)}
                className="min-h-[44px] rounded-full border border-gray-200 bg-white px-4 text-xs font-bold text-gray-500 transition-colors hover:border-gray-300 hover:text-[#101217]"
              >
                Essential only
              </button>
              <button
                type="button"
                onClick={() => finish(personalisation, searchHistory)}
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
