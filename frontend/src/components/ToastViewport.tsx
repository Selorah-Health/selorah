import { useToast, type ToastType } from '../contexts/ToastContext';

const styles: Record<
  ToastType,
  { bg: string; text: string; muted: string; iconBg: string; icon: string; border: string }
> = {
  success: {
    bg: 'bg-[#6183FF]',
    text: 'text-white',
    muted: 'text-white/80',
    iconBg: 'bg-white/20 text-white',
    icon: '✓',
    border: 'border-white/10',
  },
  error: {
    bg: 'bg-red-500',
    text: 'text-white',
    muted: 'text-white/85',
    iconBg: 'bg-white/20 text-white',
    icon: '!',
    border: 'border-white/10',
  },
  info: {
    bg: 'bg-[#6183FF]',
    text: 'text-white',
    muted: 'text-white/80',
    iconBg: 'bg-white/20 text-white',
    icon: 'i',
    border: 'border-white/10',
  },
  warning: {
    bg: 'bg-amber-500',
    text: 'text-white',
    muted: 'text-white/85',
    iconBg: 'bg-white/20 text-white',
    icon: '!',
    border: 'border-white/10',
  },
};

export default function ToastViewport() {
  const { toasts, dismiss } = useToast();

  if (!toasts.length) return null;

  return (
    <div
      className="fixed z-[9999] top-4 right-4 left-4 sm:left-auto sm:w-[380px] flex flex-col gap-3 pointer-events-none font-sora"
      aria-live="polite"
      aria-relevant="additions"
    >
      {toasts.map((t) => {
        const s = styles[t.type];
        return (
          <div
            key={t.id}
            className={`pointer-events-auto relative overflow-hidden ${s.bg} ${s.text} rounded-2xl border ${s.border} shadow-xl shadow-black/15 animate-in slide-in-from-top-2 fade-in duration-200`}
            role="status"
          >
            <div className="flex items-start gap-3 p-4">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-sm font-black ${s.iconBg}`}
              >
                {s.icon}
              </div>
              <div className="flex-1 min-w-0 pt-0.5">
                {t.title && (
                  <p className={`text-sm font-bold leading-tight mb-0.5 ${s.text}`}>{t.title}</p>
                )}
                <p className={`text-sm font-medium leading-snug break-words ${s.muted}`}>
                  {t.message}
                </p>
              </div>
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                className="text-white/50 hover:text-white transition-colors shrink-0 text-lg leading-none px-1"
                aria-label="Dismiss"
              >
                ×
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
