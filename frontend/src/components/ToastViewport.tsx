import { useToast, type ToastType } from '../contexts/ToastContext';

const styles: Record<
  ToastType,
  { bar: string; iconBg: string; icon: string; ring: string }
> = {
  success: {
    bar: 'bg-emerald-500',
    iconBg: 'bg-emerald-50 text-emerald-600',
    icon: '✓',
    ring: 'shadow-emerald-500/10',
  },
  error: {
    bar: 'bg-red-500',
    iconBg: 'bg-red-50 text-red-600',
    icon: '!',
    ring: 'shadow-red-500/10',
  },
  info: {
    bar: 'bg-[#6183FF]',
    iconBg: 'bg-[#EEF2FF] text-[#6183FF]',
    icon: 'i',
    ring: 'shadow-blue-500/10',
  },
  warning: {
    bar: 'bg-amber-500',
    iconBg: 'bg-amber-50 text-amber-600',
    icon: '!',
    ring: 'shadow-amber-500/10',
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
            className={`pointer-events-auto relative overflow-hidden bg-white rounded-2xl border border-gray-100 shadow-xl ${s.ring} animate-in slide-in-from-top-2 fade-in duration-200`}
            role="status"
          >
            <div className={`absolute left-0 top-0 bottom-0 w-1 ${s.bar}`} />
            <div className="flex items-start gap-3 p-4 pl-5">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-sm font-black ${s.iconBg}`}
              >
                {s.icon}
              </div>
              <div className="flex-1 min-w-0 pt-0.5">
                {t.title && (
                  <p className="text-sm font-bold text-[#101217] leading-tight mb-0.5">
                    {t.title}
                  </p>
                )}
                <p className="text-sm text-gray-500 font-medium leading-snug break-words">
                  {t.message}
                </p>
              </div>
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                className="text-gray-300 hover:text-gray-500 transition-colors shrink-0 text-lg leading-none px-1"
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
