import { CloudArrowUpIcon, WifiIcon, SignalSlashIcon } from '@heroicons/react/24/outline';
import { useSync } from '../contexts/SyncContext';

export default function NetworkStatus() {
  const { online, syncing, pending } = useSync();

  const show = !online || syncing || pending > 0;
  if (!show) return null;

  const label = !online
    ? pending > 0
      ? `Offline. ${pending} change${pending === 1 ? '' : 's'} waiting`
      : 'Offline. Changes save on this device'
    : syncing
      ? 'Syncing changes'
      : `${pending} change${pending === 1 ? '' : 's'} waiting to sync`;

  const Icon = !online ? SignalSlashIcon : syncing ? CloudArrowUpIcon : WifiIcon;
  const tone = !online
    ? 'bg-[#101217] text-white'
    : syncing
      ? 'bg-[#6183FF] text-white'
      : 'bg-[#EEF2FF] text-[#4D6ED6]';

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed left-1/2 top-[max(0.5rem,env(safe-area-inset-top))] z-[300] -translate-x-1/2 pointer-events-none"
    >
      <div
        className={`flex items-center gap-2 rounded-full px-3.5 py-2 text-[11px] font-bold shadow-lg shadow-black/10 ${tone}`}
      >
        <Icon className={`h-4 w-4 ${syncing ? 'animate-pulse' : ''}`} />
        <span className="whitespace-nowrap">{label}</span>
      </div>
    </div>
  );
}
