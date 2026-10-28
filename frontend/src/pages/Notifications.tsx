import { useCallback, useEffect, useState } from 'react';
import {
  BellIcon,
  CheckCircleIcon,
  ChevronRightIcon,
  ShieldCheckIcon,
  SparklesIcon,
  StarIcon,
} from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import { createClient } from '../lib/supabase/client';
import { readProState } from '../lib/pro';
import { useToast } from '../contexts/ToastContext';

type NotificationRow = {
  id: string;
  title: string;
  body: string;
  createdAt: string | null;
  isRead: boolean;
  kind: 'access' | 'system' | 'billing';
};

function relativeTime(value?: string | null) {
  if (!value) return 'Just now';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Recently';
  const diff = Date.now() - date.getTime();
  const minutes = Math.round(diff / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function iconFor(kind: NotificationRow['kind']) {
  if (kind === 'access') return ShieldCheckIcon;
  if (kind === 'billing') return StarIcon;
  return SparklesIcon;
}

const SEEN_KEY = 'selorah_notifications_seen_at';

function readSeenAt() {
  try {
    const raw = localStorage.getItem(SEEN_KEY);
    const value = raw ? Number(raw) : 0;
    return Number.isFinite(value) ? value : 0;
  } catch {
    return 0;
  }
}

export default function Notifications() {
  const navigate = useNavigate();
  const supabase = createClient();
  const { success } = useToast();
  const [isPro, setIsPro] = useState(() => readProState().active);
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const refreshPro = () => setIsPro(readProState().active);
    window.addEventListener('selorah:pro-updated', refreshPro);
    window.addEventListener('storage', refreshPro);
    return () => {
      window.removeEventListener('selorah:pro-updated', refreshPro);
      window.removeEventListener('storage', refreshPro);
    };
  }, []);

  const loadNotifications = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    try {
      // Access activity is the notification source of truth. Older projects do
      // not have a notifications table, so deriving from access_logs keeps the
      // page useful without inventing events.
      const { data, error } = await supabase
        .from('access_logs')
        .select('id, action, hospital_name, accessed_at')
        .eq('user_id', user.id)
        .order('accessed_at', { ascending: false })
        .limit(30);

      if (error) {
        setNotifications([]);
        return;
      }

      const seenAt = readSeenAt();
      setNotifications(
        (data || []).map((row: Record<string, any>) => ({
          id: String(row.id),
          title: row.hospital_name || 'Record accessed',
          body: row.action || 'A verified provider viewed your shared medical record.',
          createdAt: row.accessed_at || null,
          isRead: row.accessed_at
            ? new Date(row.accessed_at).getTime() <= seenAt
            : false,
          kind: 'access' as const,
        }))
      );
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    loadNotifications();
    const refreshPro = () => setIsPro(readProState().active);
    window.addEventListener('selorah:pro-updated', refreshPro);
    window.addEventListener('storage', refreshPro);
    return () => {
      window.removeEventListener('selorah:pro-updated', refreshPro);
      window.removeEventListener('storage', refreshPro);
    };
  }, [loadNotifications]);

  const unread = notifications.filter((item) => !item.isRead).length;

  const markAllRead = async () => {
    if (!unread) return;

    try {
      localStorage.setItem(SEEN_KEY, String(Date.now()));
    } catch {
      // Private mode can block storage. The in-memory state still updates.
    }

    setNotifications((previous) => previous.map((item) => ({ ...item, isRead: true })));
    success('You are all caught up.');
  };

  return (
    <div className="space-y-6 font-sora">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold tracking-tight text-[#101217] sm:text-3xl">
              Notifications
            </h2>
            {unread > 0 && (
              <span className="rounded-full bg-[#6183FF] px-2 py-0.5 text-[9px] font-black text-white">
                {unread}
              </span>
            )}
          </div>
          <p className="mt-1 text-sm font-medium text-gray-400">
            Access activity, account updates, and product news.
          </p>
        </div>
        <button
          type="button"
          onClick={markAllRead}
          disabled={unread === 0}
          className="inline-flex min-h-[40px] w-fit items-center gap-1.5 rounded-full border border-gray-200 bg-white px-4 text-[11px] font-bold text-gray-500 transition-colors hover:border-[#6183FF]/40 hover:text-[#6183FF] disabled:cursor-default disabled:opacity-40"
        >
          <CheckCircleIcon className="h-3.5 w-3.5" />
          Mark all as read
        </button>
      </div>

      {!isPro && (
        <div className="relative overflow-hidden rounded-[24px] bg-[#020924] p-5 text-white sm:p-6">
          <div
            aria-hidden
            className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-[#6183FF]/30 blur-2xl"
          />
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-[#5FFAB0]">
                <StarIcon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-bold">Unlock Selorah Pro</p>
                <p className="mt-0.5 text-[11px] font-medium leading-relaxed text-white/50">
                  Priority verification, family sharing, and up to 10 emergency contacts.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate('/dashboard/upgrade')}
              className="flex min-h-[42px] items-center justify-center gap-1.5 rounded-full bg-white px-5 text-[11px] font-bold text-[#020924]"
            >
              See Pro features
              <ChevronRightIcon className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      <div className="rounded-[28px] border border-gray-50 bg-white p-5 shadow-sm sm:p-6">
        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((item) => (
              <div key={item} className="h-20 animate-pulse rounded-2xl bg-[#F8F9FE]" />
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F8F9FE] text-[#6183FF]">
              <BellIcon className="h-7 w-7" />
            </div>
            <h3 className="mt-4 text-base font-bold text-[#101217]">No notifications yet</h3>
            <p className="mx-auto mt-1.5 max-w-sm text-xs font-medium leading-relaxed text-gray-400">
              When a provider opens your shared record, or your account changes, you will see it
              here.
            </p>
            <button
              type="button"
              onClick={() => navigate('/dashboard/access-log')}
              className="mt-4 inline-flex min-h-[40px] items-center gap-1.5 rounded-full bg-[#6183FF] px-4 text-[11px] font-bold text-white"
            >
              Check your access log
              <ChevronRightIcon className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <div className="space-y-2.5">
            {notifications.map((item) => {
              const Icon = iconFor(item.kind);
              return (
                <div
                  key={item.id}
                  className={`flex items-start gap-3 rounded-2xl border p-4 transition-colors ${
                    item.isRead
                      ? 'border-gray-100 bg-white'
                      : 'border-[#6183FF]/15 bg-[#EEF2FF]/60'
                  }`}
                >
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                      item.isRead ? 'bg-gray-50 text-gray-400' : 'bg-white text-[#6183FF]'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-bold text-[#101217]">{item.title}</p>
                      {!item.isRead && (
                        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#6183FF]" />
                      )}
                    </div>
                    {item.body && (
                      <p className="mt-1 text-xs font-medium leading-relaxed text-gray-500">
                        {item.body}
                      </p>
                    )}
                    <p className="mt-1.5 text-[9px] font-black uppercase tracking-[0.1em] text-gray-300">
                      {relativeTime(item.createdAt)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
