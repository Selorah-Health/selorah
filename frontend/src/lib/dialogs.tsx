import { useEffect, useRef, useState } from 'react';
import {
  ExclamationTriangleIcon,
  InformationCircleIcon,
  ShieldExclamationIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

export type ConfirmOptions = {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: 'danger' | 'default';
  icon?: 'warning' | 'info' | 'shield';
};

type Pending = {
  options: ConfirmOptions;
  resolve: (value: boolean) => void;
};

let handler: ((pending: Pending) => void) | null = null;

export function confirmDialog(options: ConfirmOptions): Promise<boolean> {
  return new Promise((resolve) => {
    if (handler) {
      handler({ options, resolve });
      return;
    }
    // The host is mounted by App. This fallback only runs outside the app shell.
    const text = options.message ? `${options.title}\n\n${options.message}` : options.title;
    resolve(window.confirm(text));
  });
}

export function ConfirmDialogHost() {
  const [pending, setPending] = useState<Pending | null>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    handler = setPending;
    return () => {
      handler = null;
    };
  }, []);

  useEffect(() => {
    if (!pending) return;
    confirmRef.current?.focus();

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        pending.resolve(false);
        setPending(null);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [pending]);

  if (!pending) return null;

  const { options } = pending;
  const danger = options.tone === 'danger';
  const Icon =
    options.icon === 'shield'
      ? ShieldExclamationIcon
      : options.icon === 'info'
        ? InformationCircleIcon
        : ExclamationTriangleIcon;

  const settle = (value: boolean) => {
    pending.resolve(value);
    setPending(null);
  };

  return (
    <div
      className="fixed inset-0 z-[320] flex items-end justify-center bg-[#05081A]/55 p-3 backdrop-blur-sm sm:items-center sm:p-6"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) settle(false);
      }}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="selorah-confirm-title"
        aria-describedby={options.message ? 'selorah-confirm-message' : undefined}
        className="w-full max-w-md overflow-hidden rounded-[28px] border border-white/60 bg-white shadow-[0_40px_100px_-30px_rgba(5,8,26,0.6)] animate-in slide-in-from-bottom-4 sm:zoom-in-95"
      >
        <div className="flex items-start gap-3.5 px-5 pt-5">
          <span
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
              danger ? 'bg-red-50 text-red-500' : 'bg-[#EEF2FF] text-[#6183FF]'
            }`}
          >
            <Icon className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1 pt-0.5">
            <h2 id="selorah-confirm-title" className="text-base font-black tracking-tight text-[#101217]">
              {options.title}
            </h2>
            {options.message && (
              <p
                id="selorah-confirm-message"
                className="mt-1.5 text-xs font-medium leading-relaxed text-gray-500"
              >
                {options.message}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => settle(false)}
            aria-label="Close dialog"
            className="-mr-1 -mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-gray-300 transition-colors hover:bg-gray-100 hover:text-gray-500"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-5 flex flex-col-reverse gap-2 border-t border-gray-100 bg-[#F8F9FE] px-5 py-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => settle(false)}
            className="min-h-[44px] rounded-full border border-gray-200 bg-white px-4 text-xs font-bold text-gray-500 transition-colors hover:border-gray-300 hover:text-[#101217]"
          >
            {options.cancelLabel || 'Cancel'}
          </button>
          <button
            ref={confirmRef}
            type="button"
            onClick={() => settle(true)}
            className={`min-h-[44px] rounded-full px-5 text-xs font-bold text-white shadow-lg transition-all active:scale-[0.99] ${
              danger
                ? 'bg-red-500 shadow-red-500/20 hover:bg-red-600'
                : 'bg-[#6183FF] shadow-[#6183FF]/20 hover:bg-[#4D6ED6]'
            }`}
          >
            {options.confirmLabel || 'Continue'}
          </button>
        </div>
      </div>
    </div>
  );
}
