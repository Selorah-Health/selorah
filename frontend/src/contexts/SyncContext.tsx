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
import { useToast } from './ToastContext';

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
  const { info, success, warning } = useToast();
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
  const wasOfflineRef = useRef(false);

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
        success(
          `${result.synced} queued item${result.synced === 1 ? '' : 's'} synced.`,
          'Back online'
        );
      }
    } catch {
      // Keep the queue for the next attempt.
    } finally {
      syncingRef.current = false;
      setSyncing(false);
      refreshPending();
    }
  }, [refreshPending, success, supabase]);

  useEffect(() => {
    refreshPending();

    const handleOnline = () => {
      setOnline(true);
      wasOfflineRef.current = false;
      info('Connection restored. Your changes are syncing.');
      void syncNow();
    };

    const handleOffline = () => {
      setOnline(false);
      wasOfflineRef.current = true;
      warning('You are offline. Changes will be saved on this device and synced later.');
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
  }, [info, refreshPending, syncNow, warning]);

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
