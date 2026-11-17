import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { XMarkIcon } from '@heroicons/react/24/outline';
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
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors ${
        checked ? 'border-primary bg-primary' : 'border-gray-200 bg-gray-200'
      }`}
    >
      <span
        className={`h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
          checked ? 'translate-x-[22px]' : 'translate-x-[2px]'
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
          <div className="mx-auto max-w-3xl rounded-none border border-[#E5E7EB] bg-white p-4 shadow-[0_12px_40px_-12px_rgba(15,23,42,0.28)] sm:p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="max-w-xl">
                <p className="text-sm font-semibold text-[#101217]">Privacy choices</p>
                <p className="mt-1 text-sm leading-relaxed text-[#6B7280]">
                  Essential storage keeps you signed in. Optional storage only remembers
                  preferences on this device. No advertising cookies, ever.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
                <button
                  type="button"
                  onClick={() => finish(false, false)}
                  className="min-h-[40px] rounded-none border border-[#E5E7EB] bg-white px-3.5 text-xs font-semibold text-[#4B5563] transition-colors hover:bg-[#F6F8FA]"
                >
                  Essential only
                </button>
                <button
                  type="button"
                  onClick={() => finish(true, true)}
                  className="min-h-[40px] rounded-none bg-primary px-3.5 text-xs font-semibold text-white transition-colors hover:bg-primary-hover"
                >
                  Accept all
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(true)}
                  className="min-h-[40px] rounded-none px-2 text-xs font-semibold text-primary transition-colors hover:text-primary-hover"
                >
                  Manage
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {open && (
        <div
          className="fixed inset-0 z-[260] flex items-end justify-center bg-[#0F172A]/40 p-0 sm:items-center sm:p-6"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setOpen(false);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="privacy-title"
            className="flex max-h-[calc(100dvh-0.25rem)] w-full max-w-lg flex-col overflow-hidden rounded-none border border-[#E5E7EB] bg-white shadow-[0_24px_70px_-20px_rgba(15,23,42,0.35)] sm:max-h-[min(90dvh,720px)]"
          >
            <div className="flex items-start justify-between gap-4 border-b border-[#EFF2F7] px-5 py-4">
              <div>
                <h2 id="privacy-title" className="text-base font-semibold text-[#101217]">
                  Privacy choices
                </h2>
                <p className="mt-1 text-sm leading-relaxed text-[#6B7280]">
                  Choose what Selorah can remember on this device. Your health records always stay
                  in your secure account.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close privacy choices"
                className="-mr-1 -mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-none text-[#8A94A6] transition-colors hover:bg-[#F6F8FA] hover:text-[#4B5563]"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5">
              <div className="flex items-start justify-between gap-4 border-b border-[#EFF2F7] py-4">
                <div>
                  <p className="text-sm font-semibold text-[#101217]">Essential storage</p>
                  <p className="mt-1 text-sm leading-relaxed text-[#6B7280]">
                    Keeps you signed in, protects your session, and remembers this privacy choice.
                    Required for Selorah to work.
                  </p>
                </div>
                <span className="mt-0.5 shrink-0 rounded-none bg-[#F6F8FA] px-2 py-1 text-[11px] font-medium text-[#6B7280]">
                  Always on
                </span>
              </div>

              <div className="flex items-start justify-between gap-4 border-b border-[#EFF2F7] py-4">
                <div>
                  <p className="text-sm font-semibold text-[#101217]">Personalisation</p>
                  <p className="mt-1 text-sm leading-relaxed text-[#6B7280]">
                    Remembers your theme and dismissed tips on this device. Off means Selorah
                    forgets them when you close the browser.
                  </p>
                </div>
                <Toggle
                  checked={personalisation}
                  onChange={setPersonalisation}
                  label="Personalisation storage"
                />
              </div>

              <div className="flex items-start justify-between gap-4 py-4">
                <div>
                  <p className="text-sm font-semibold text-[#101217]">Search history</p>
                  <p className="mt-1 text-sm leading-relaxed text-[#6B7280]">
                    Keeps your last few searches on this device so you can pick up quickly. Never
                    shared with anyone.
                  </p>
                </div>
                <Toggle
                  checked={searchHistory}
                  onChange={setSearchHistory}
                  label="Search history storage"
                />
              </div>

              <p className="border-t border-[#EFF2F7] py-4 text-xs leading-relaxed text-[#8A94A6]">
                You can change this at any time in Profile and settings. Read the{' '}
                <Link to="/privacy" className="font-semibold text-primary hover:underline">
                  Privacy Policy
                </Link>{' '}
                and{' '}
                <Link to="/cookie-policy" className="font-semibold text-primary hover:underline">
                  Cookie Policy
                </Link>
                .
              </p>
            </div>

            <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-[#EFF2F7] px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 sm:flex-row sm:justify-end sm:pb-4">
              <button
                type="button"
                onClick={() => finish(false, false)}
                className="min-h-[44px] rounded-none border border-[#E5E7EB] bg-white px-4 text-sm font-semibold text-[#4B5563] transition-colors hover:bg-[#F6F8FA]"
              >
                Essential only
              </button>
              <button
                type="button"
                onClick={() => finish(personalisation, searchHistory)}
                className="min-h-[44px] rounded-none bg-primary px-4 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
              >
                Save choices
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
