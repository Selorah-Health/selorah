import { useEffect, useState } from 'react';
import { CommandLineIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';

const SHORTCUTS = [
  { keys: ['Ctrl', 'K'], label: 'Focus search' },
  { keys: ['Ctrl', 'Shift', 'N'], label: 'Add a record' },
  { keys: ['G', 'H'], label: 'Go to dashboard' },
  { keys: ['G', 'R'], label: 'Go to records' },
  { keys: ['G', 'S'], label: 'Go to research' },
  { keys: ['G', 'E'], label: 'Go to earnings' },
  { keys: ['G', 'C'], label: 'Open Selorah card' },
  { keys: ['G', 'P'], label: 'Open profile' },
  { keys: ['?'], label: 'Show this help' },
];

export default function KeyboardShortcuts({ onAddRecord }: { onAddRecord?: () => void }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let lastKey = '';
    let lastAt = 0;

    const handler = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target?.isContentEditable;

      const meta = event.metaKey || event.ctrlKey;

      if (meta && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        const input = document.querySelector<HTMLInputElement>('input[type="search"]');
        input?.focus();
        input?.select();
        return;
      }

      if (meta && event.shiftKey && event.key.toLowerCase() === 'n') {
        event.preventDefault();
        onAddRecord?.();
        return;
      }

      if (typing) return;

      if (event.key === '?') {
        event.preventDefault();
        setOpen(true);
        return;
      }

      if (event.key === 'Escape') {
        setOpen(false);
        return;
      }

      const key = event.key.toLowerCase();
      const now = Date.now();
      if (lastKey === 'g' && now - lastAt < 1200) {
        const routes: Record<string, string> = {
          h: '/dashboard',
          r: '/dashboard/records',
          s: '/dashboard/research',
          e: '/dashboard/earnings',
          c: '/dashboard/card',
          p: '/dashboard/profile',
        };
        if (routes[key]) {
          event.preventDefault();
          navigate(routes[key]);
          lastKey = '';
          return;
        }
      }
      lastKey = key;
      lastAt = now;
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [navigate, onAddRecord]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[300] flex items-end justify-center bg-[#05081A]/55 p-3 backdrop-blur-sm sm:items-center sm:p-6"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) setOpen(false);
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="shortcuts-title"
        className="w-full max-w-md overflow-hidden rounded-[28px] border border-white/60 bg-white shadow-[0_40px_100px_-30px_rgba(5,8,26,0.6)]"
      >
        <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EEF2FF] text-[#6183FF]">
              <CommandLineIcon className="h-4.5 w-4.5" />
            </span>
            <div>
              <h2 id="shortcuts-title" className="text-sm font-black text-[#101217]">
                Keyboard shortcuts
              </h2>
              <p className="text-[10px] font-medium text-gray-400">Move faster around Selorah.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close shortcuts"
            className="flex h-8 w-8 items-center justify-center rounded-full text-gray-300 hover:bg-gray-100 hover:text-gray-500"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[60vh] space-y-1 overflow-y-auto px-5 py-4">
          {SHORTCUTS.map((shortcut) => (
            <div
              key={shortcut.label}
              className="flex items-center justify-between gap-3 rounded-xl px-2 py-2 hover:bg-[#F8F9FE]"
            >
              <span className="text-xs font-semibold text-gray-600">{shortcut.label}</span>
              <span className="flex shrink-0 items-center gap-1">
                {shortcut.keys.map((key) => (
                  <kbd
                    key={key}
                    className="rounded-md border border-gray-200 bg-white px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wide text-gray-500 shadow-sm"
                  >
                    {key}
                  </kbd>
                ))}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
