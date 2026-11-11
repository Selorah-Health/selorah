import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { createClient } from '../lib/supabase/client';
import { countQueuedActions, QUEUE_EVENT } from '../lib/offline/queue';
import { flushQueue } from '../lib/offline/sync';

type SyncContextValue = {
  online: boolean;
  syncing: boolean;
  pending: number;
  lastSyncedAt: string | null;
  syncNow: () => Promise<void>;
  refreshPending: () => Promise<void>;
};

const SyncContext = createContext<SyncContextValue | null>(null);

export function SyncProvider({ children }: { children: ReactNode }) {
  const supabase = createClient();
  const [online, setOnline] = useState(
    typeof navigator === 'undefined' ? true : navigator.onLine
  );
  const [syncing, setSyncing] = useState(false);
  const [pending, setPending] = useState(0);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(() => {
    try {
      return localStorage.getItem('selorah_last_sync');
    } catch {
      return null;
    }
  });
  const syncingRef = useRef(false);

  const refreshPending = useCallback(async () => {
    const count = await countQueuedActions();
    setPending(count);
  }, []);

  const syncNow = useCallback(async () => {
    if (syncingRef.current) return;
    if (typeof navigator !== 'undefined' && !navigator.onLine) return;

    syncingRef.current = true;
    setSyncing(true);
    try {
      const result = await flushQueue(supabase);
      setPending(result.remaining);
      if (result.synced > 0) {
        const stamp = new Date().toISOString();
        setLastSyncedAt(stamp);
        try {
          localStorage.setItem('selorah_last_sync', stamp);
        } catch {
          // ignore storage quota issues
        }
      }
    } catch {
      // Keep the queue for the next attempt.
    } finally {
      syncingRef.current = false;
      setSyncing(false);
      refreshPending();
    }
  }, [refreshPending, supabase]);

  useEffect(() => {
    refreshPending();

    // Sync is intentionally silent. The only offline UI is the quiet
    // NetworkStatus indicator, so patients never see a sync prompt or toast.
    const handleOnline = () => {
      setOnline(true);
      void syncNow();
    };

    const handleOffline = () => {
      setOnline(false);
    };

    const handleQueue = () => {
      void refreshPending();
      if (navigator.onLine) void syncNow();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener(QUEUE_EVENT, handleQueue);

    if (navigator.onLine) void syncNow();

    const interval = window.setInterval(() => {
      if (navigator.onLine && !document.hidden) {
        refreshPending();
        void syncNow();
      }
    }, 60_000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener(QUEUE_EVENT, handleQueue);
      window.clearInterval(interval);
    };
  }, [refreshPending, syncNow]);

  const value = useMemo<SyncContextValue>(
    () => ({ online, syncing, pending, lastSyncedAt, syncNow, refreshPending }),
    [online, syncing, pending, lastSyncedAt, syncNow, refreshPending]
  );

  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>;
}

export function useSync() {
  const ctx = useContext(SyncContext);
  if (!ctx) throw new Error('useSync must be used within SyncProvider');
  return ctx;
}
