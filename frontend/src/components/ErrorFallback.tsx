import { useState } from 'react';
import {
  ArrowPathIcon,
  ArrowRightIcon,
  CheckIcon,
  ChevronDownIcon,
  ClipboardDocumentIcon,
  HomeIcon,
  LifebuoyIcon,
  ShieldCheckIcon,
  SignalSlashIcon,
} from '@heroicons/react/24/outline';

type ErrorFallbackProps = {
  error?: Error | null;
  errorId?: string;
  onRetry?: () => void;
};

function makeReference() {
  const stamp = Date.now().toString(36).toUpperCase().slice(-4);
  const random = Math.random().toString(36).toUpperCase().slice(2, 6);
  return `SEL-${stamp}${random}`;
}

export default function ErrorFallback({ error, errorId, onRetry }: ErrorFallbackProps) {
  const [reference] = useState(() => errorId || makeReference());
  const [copied, setCopied] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const copyReference = async () => {
    try {
      await navigator.clipboard.writeText(reference);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  const reportHref = `mailto:support@selorah.health?subject=${encodeURIComponent(
    `Selorah error report ${reference}`
  )}&body=${encodeURIComponent(
    `Reference: ${reference}\nPage: ${typeof window !== 'undefined' ? window.location.href : ''}\n${
      error?.message ? `Details: ${error.message}` : ''
    }`
  )}`;

  const reload = () => {
    if (onRetry) {
      onRetry();
      return;
    }
    window.location.reload();
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#05081A] font-sora text-white">
      {/* Ambient brand light */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-40 -top-48 h-[34rem] w-[34rem] rounded-full bg-[#6183FF]/20 blur-[120px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-56 -right-40 h-[38rem] w-[38rem] rounded-full bg-[#14F1D9]/10 blur-[130px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.16]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)',
          backgroundSize: '56px 56px',
          maskImage: 'radial-gradient(circle at 50% 40%, black, transparent 72%)',
          WebkitMaskImage: 'radial-gradient(circle at 50% 40%, black, transparent 72%)',
        }}
      />

      <header className="relative z-10 mx-auto flex h-20 max-w-6xl items-center justify-between px-5 sm:px-8">
        <a href="/" className="group flex items-center gap-2.5" aria-label="Selorah Health home">
          <img src="/logo.svg" alt="" className="h-9 w-9 object-contain" />
          <span className="text-[15px] font-bold tracking-tight text-white sm:text-base">
            Selorah Health
          </span>
        </a>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.14em] text-white/50">
          <span className="h-1.5 w-1.5 rounded-full bg-[#14F1D9]" />
          Secure session
        </span>
      </header>

      <main className="relative z-10 mx-auto flex min-h-[calc(100vh-13rem)] w-full max-w-5xl flex-col items-center justify-center px-5 py-12 text-center sm:px-8">
        <div className="relative mb-8 flex h-32 w-32 items-center justify-center sm:h-40 sm:w-40">
          <span className="absolute inset-0 rounded-full border border-white/[0.06]" />
          <span className="absolute inset-5 rounded-full border border-white/[0.08]" />
          <span className="absolute inset-10 rounded-full border border-[#6183FF]/25" />
          <span className="absolute inset-0 animate-ping rounded-full border border-[#6183FF]/10 [animation-duration:3s]" />
          <span className="relative flex h-16 w-16 items-center justify-center rounded-[22px] border border-white/10 bg-gradient-to-br from-[#6183FF] to-[#3F5ED8] shadow-[0_20px_60px_-18px_rgba(97,131,255,0.9)] sm:h-20 sm:w-20">
            <SignalSlashIcon className="h-8 w-8 sm:h-9 sm:w-9" strokeWidth={1.6} />
          </span>
          <span className="absolute -right-1 top-3 flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-[#0B1120] text-[#14F1D9] shadow-lg">
            <ShieldCheckIcon className="h-4 w-4" />
          </span>
        </div>

        <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#8FA8FF]">
          Unexpected error
        </p>
        <h1 className="mt-3 max-w-3xl text-4xl font-black leading-[1.05] tracking-tight text-white sm:text-6xl">
          Something went wrong
        </h1>
        <p className="mt-5 max-w-xl text-sm font-medium leading-relaxed text-white/55 sm:text-base">
          This screen hit a snag, but your health records are safe. Nothing was deleted or
          changed. Reload the page to pick up where you left off.
        </p>

        <div className="mt-8 flex w-full flex-col items-stretch justify-center gap-2.5 sm:w-auto sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={reload}
            className="group inline-flex min-h-[50px] items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#6183FF] to-[#4D6ED6] px-6 text-sm font-bold text-white shadow-[0_18px_45px_-16px_rgba(97,131,255,0.9)] transition-all hover:brightness-110 active:scale-[0.99]"
          >
            <ArrowPathIcon className="h-4.5 w-4.5 transition-transform duration-500 group-hover:rotate-180" />
            Reload page
          </button>
          <a
            href="/dashboard"
            className="inline-flex min-h-[50px] items-center justify-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-6 text-sm font-bold text-white/80 transition-colors hover:border-white/30 hover:bg-white/[0.08] hover:text-white"
          >
            <HomeIcon className="h-4.5 w-4.5" />
            Go to dashboard
          </a>
          <a
            href={reportHref}
            className="inline-flex min-h-[50px] items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold text-white/45 transition-colors hover:text-white/80"
          >
            <LifebuoyIcon className="h-4.5 w-4.5" />
            Contact support
          </a>
        </div>

        <div className="mt-9 flex flex-col items-center gap-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] py-1.5 pl-3 pr-1.5">
            <span className="text-[9px] font-black uppercase tracking-[0.14em] text-white/30">
              Reference
            </span>
            <code className="text-[11px] font-bold tracking-wide text-white/75">{reference}</code>
            <button
              type="button"
              onClick={() => void copyReference()}
              aria-label="Copy error reference"
              className="flex h-7 w-7 items-center justify-center rounded-full bg-white/[0.06] text-white/45 transition-colors hover:bg-white/10 hover:text-white"
            >
              {copied ? (
                <CheckIcon className="h-3.5 w-3.5 text-[#14F1D9]" />
              ) : (
                <ClipboardDocumentIcon className="h-3.5 w-3.5" />
              )}
            </button>
          </div>
          <p className="max-w-sm text-[10px] font-medium leading-relaxed text-white/30">
            Quote this reference if you contact support so we can trace the exact failure.
          </p>
        </div>

        {error && (
          <div className="mt-8 w-full max-w-2xl text-left">
            <button
              type="button"
              onClick={() => setDetailsOpen((value) => !value)}
              aria-expanded={detailsOpen}
              className="mx-auto flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-white/30 transition-colors hover:text-white/60"
            >
              Technical details
              <ChevronDownIcon
                className={`h-3.5 w-3.5 transition-transform ${detailsOpen ? 'rotate-180' : ''}`}
              />
            </button>
            {detailsOpen && (
              <div className="mt-3 overflow-hidden rounded-2xl border border-white/10 bg-black/25">
                <p className="border-b border-white/[0.06] px-4 py-2.5 text-[11px] font-semibold text-[#FFB4B4]">
                  {error.message || 'The app could not render this screen.'}
                </p>
                {import.meta.env.DEV && error.stack && (
                  <pre className="max-h-56 overflow-auto p-4 text-[10px] leading-relaxed text-white/40">
                    {error.stack}
                  </pre>
                )}
              </div>
            )}
          </div>
        )}

        <div className="mt-10 grid w-full max-w-2xl gap-2 sm:grid-cols-3">
          {[
            {
              title: 'Your data is safe',
              body: 'Records stay encrypted in your Selorah account.',
            },
            {
              title: 'Nothing was charged',
              body: 'A failed screen never triggers a payment.',
            },
            {
              title: 'We log the fault',
              body: 'This reference helps us fix the cause faster.',
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-white/[0.07] bg-white/[0.03] px-4 py-3 text-left"
            >
              <p className="text-[10px] font-black uppercase tracking-[0.1em] text-white/60">
                {item.title}
              </p>
              <p className="mt-1 text-[10px] font-medium leading-relaxed text-white/30">
                {item.body}
              </p>
            </div>
          ))}
        </div>
      </main>

      <footer className="relative z-10 mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 border-t border-white/[0.06] px-5 py-6 text-[10px] font-semibold text-white/30 sm:flex-row sm:px-8">
        <p>Selorah Health Limited. Your records, your control.</p>
        <div className="flex items-center gap-4">
          <a href="/privacy" className="transition-colors hover:text-white/70">
            Privacy
          </a>
          <a href="/cookie-policy" className="transition-colors hover:text-white/70">
            Storage
          </a>
          <a
            href={reportHref}
            className="inline-flex items-center gap-1 text-[#8FA8FF] transition-colors hover:text-white"
          >
            Report this
            <ArrowRightIcon className="h-3 w-3" />
          </a>
        </div>
      </footer>
    </div>
  );
}
