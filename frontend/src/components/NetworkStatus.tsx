import { SignalSlashIcon } from '@heroicons/react/24/outline';
import { useSync } from '../contexts/SyncContext';

/**
 * A quiet offline indicator. Syncing itself is silent, so this never mentions
 * syncing and never shows a spinner. It only tells the patient that their
 * changes are safe on this device while the connection is down.
 */
export default function NetworkStatus() {
  const { online, pending } = useSync();

  if (online) return null;

  const label =
    pending > 0
      ? `Offline. ${pending} change${pending === 1 ? '' : 's'} saved on this device`
      : 'Offline. Changes save on this device';

  return (
    <div
      role="status"
      aria-live="polite"
      data-state="offline"
      className="fixed left-1/2 top-[max(0.5rem,env(safe-area-inset-top))] z-[300] -translate-x-1/2 pointer-events-none"
    >
      <div className="flex items-center gap-2 rounded-full bg-[#101217] px-3.5 py-2 text-[11px] font-bold text-white shadow-lg shadow-black/10">
        <SignalSlashIcon className="h-4 w-4" />
        <span className="whitespace-nowrap">{label}</span>
      </div>
    </div>
  );
}
