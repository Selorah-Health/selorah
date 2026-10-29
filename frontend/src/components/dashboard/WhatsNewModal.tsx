import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { CheckIcon, SparklesIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { RELEASE_NOTES, CURRENT_RELEASE } from '../../lib/releases';

type WhatsNewModalProps = {
  open: boolean;
  onClose: () => void;
};

export default function WhatsNewModal({ open, onClose }: WhatsNewModalProps) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    closeRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    };
    document.addEventListener('keydown', onKey);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[280] flex items-end justify-center bg-[#05081A]/55 p-3 backdrop-blur-sm sm:items-center sm:p-6"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="whats-new-title"
        className="flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-[28px] border border-white/60 bg-white shadow-[0_40px_100px_-30px_rgba(5,8,26,0.6)] animate-in slide-in-from-bottom-4 sm:zoom-in-95"
      >
        <div className="flex items-start justify-between gap-3 border-b border-gray-100 px-5 py-5 sm:px-6">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#6183FF] text-white shadow-lg shadow-[#6183FF]/20">
              <SparklesIcon className="h-5 w-5" />
            </span>
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#6183FF]">
                Release {CURRENT_RELEASE}
              </p>
              <h2
                id="whats-new-title"
                className="mt-0.5 text-lg font-black tracking-tight text-[#101217]"
              >
                What&apos;s new in Selorah
              </h2>
              <p className="mt-1 text-[11px] font-medium leading-relaxed text-gray-400">
                Recent improvements now available on your account.
              </p>
            </div>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close what's new"
            className="-mr-1 -mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-gray-300 transition-colors hover:bg-gray-100 hover:text-gray-500"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto px-5 py-5 sm:px-6">
          {RELEASE_NOTES.map((note) => (
            <article
              key={note.title}
              className="rounded-2xl border border-gray-100 bg-[#F8F9FE] px-4 py-4 sm:px-5"
            >
              <p className="text-[8px] font-black uppercase tracking-[0.16em] text-[#6183FF]">
                {note.tag}
              </p>
              <h3 className="mt-1.5 text-sm font-bold text-[#101217]">{note.title}</h3>
              <p className="mt-1.5 text-[11px] font-medium leading-relaxed text-gray-500">
                {note.body}
              </p>
            </article>
          ))}
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-gray-100 bg-[#F8F9FE] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p className="text-[10px] font-medium leading-relaxed text-gray-400">
            You can reopen this from Profile and settings.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-[44px] shrink-0 items-center justify-center gap-1.5 rounded-full bg-[#6183FF] px-5 text-xs font-bold text-white shadow-lg shadow-[#6183FF]/20 transition-colors hover:bg-[#4D6ED6]"
          >
            <CheckIcon className="h-4 w-4" />
            Got it
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
