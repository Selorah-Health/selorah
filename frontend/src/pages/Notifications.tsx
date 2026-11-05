import { useCallback, useEffect, useState } from 'react';
import {
  BellIcon,
  CheckCircleIcon,
  ChevronRightIcon,
  CreditCardIcon,
  QrCodeIcon,
  ShieldCheckIcon,
  SparklesIcon,
  StarIcon,
} from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import { createClient } from '../lib/supabase/client';
import { readProState } from '../lib/pro';
import { useToast } from '../contexts/ToastContext';
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  subscribeNotifications,
  type NotificationKind,
  type NotificationRow,
} from '../lib/notifications';

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

function iconFor(kind: NotificationKind) {
  if (kind === 'access') return ShieldCheckIcon;
  if (kind === 'billing') return CreditCardIcon;
  if (kind === 'card') return QrCodeIcon;
  if (kind === 'security') return ShieldCheckIcon;
  return SparklesIcon;
}

export default function Notifications() {
  const navigate = useNavigate();
  const supabase = createClient();
  const { success, error: toastError } = useToast();
  const [isPro, setIsPro] = useState(() => readProState().active);
  const [userId, setUserId] = useState<string | null>(null);
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

  const loadNotifications = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setNotifications([]);
        setUserId(null);
        setLoading(false);
        return;
      }

      setUserId(user.id);

      try {
        setNotifications(await fetchNotifications(supabase));
      } catch (error) {
        // Older projects may not have the notifications table yet. Fall back
        // to real access-log entries so the page still shows genuine activity.
        console.warn('Notifications table unavailable:', error);
        try {
          const { data } = await supabase
            .from('access_logs')
            .select('id, action, hospital_name, accessed_at')
            .eq('user_id', user.id)
            .order('accessed_at', { ascending: false })
            .limit(30);

          setNotifications(
            (data || []).map((row: Record<string, any>) => ({
              id: String(row.id),
              kind: 'access' as const,
              title: row.hospital_name || 'Record accessed',
              body: row.action || 'A verified provider viewed your shared medical record.',
              href: `/dashboard/access-log/${row.id}`,
              is_read: true,
              created_at: row.accessed_at || new Date().toISOString(),
            }))
          );
        } catch {
          setNotifications([]);
        }
      } finally {
        setLoading(false);
      }
    },
    [supabase]
  );

  useEffect(() => {
    void loadNotifications();
  }, [loadNotifications]);

  // Realtime updates from scans, card orders, billing, and withdrawals.
  useEffect(() => {
    if (!userId) return;
    return subscribeNotifications(supabase, userId, () => {
      void loadNotifications(true);
    });
  }, [userId, supabase, loadNotifications]);

  const unread = notifications.filter((item) => !item.is_read).length;

  const markAllRead = async () => {
    if (!unread) return;

    try {
      await markAllNotificationsRead(supabase);
      setNotifications((previous) => previous.map((item) => ({ ...item, is_read: true })));
      success('You are all caught up.');
    } catch (error) {
      toastError(
        error instanceof Error ? error.message : 'Could not mark notifications as read.'
      );
    }
  };

  const openNotification = async (item: NotificationRow) => {
    if (!item.is_read) {
      try {
        await markNotificationRead(supabase, item.id);
        setNotifications((previous) =>
          previous.map((row) => (row.id === item.id ? { ...row, is_read: true } : row))
        );
      } catch {
        // A failed read receipt should not block navigation.
      }
    }

    if (item.href) navigate(item.href);
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
              <span className="rounded-full bg-primary px-2 py-0.5 text-[9px] font-black text-white">
                {unread}
              </span>
            )}
          </div>
          <p className="mt-1 text-sm font-medium text-gray-400">
            QR scans, card updates, billing, and account activity.
          </p>
        </div>
        <button
          type="button"
          onClick={markAllRead}
          disabled={unread === 0}
          className="inline-flex min-h-[40px] w-fit items-center gap-1.5 rounded-full border border-gray-200 bg-white px-4 text-[11px] font-bold text-gray-500 transition-colors hover:border-primary/40 hover:text-primary disabled:cursor-default disabled:opacity-40"
        >
          <CheckCircleIcon className="h-3.5 w-3.5" />
          Mark all as read
        </button>
      </div>

      {!isPro && (
        <div className="relative overflow-hidden rounded-[24px] bg-[#020924] p-5 text-white sm:p-6">
          <div
            aria-hidden
            className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-primary/30 blur-2xl"
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
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F8F9FE] text-primary">
              <BellIcon className="h-7 w-7" />
            </div>
            <h3 className="mt-4 text-base font-bold text-[#101217]">No notifications yet</h3>
            <p className="mx-auto mt-1.5 max-w-sm text-xs font-medium leading-relaxed text-gray-400">
              When someone scans your QR code, orders a card, or your account changes, you will
              see it here.
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => navigate('/dashboard/access-log')}
                className="inline-flex min-h-[40px] items-center gap-1.5 rounded-full bg-primary px-4 text-[11px] font-bold text-white"
              >
                Check your access log
                <ChevronRightIcon className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => navigate('/dashboard/card')}
                className="inline-flex min-h-[40px] items-center gap-1.5 rounded-full border border-gray-200 bg-white px-4 text-[11px] font-bold text-gray-500"
              >
                <QrCodeIcon className="h-3.5 w-3.5" />
                Get your Selorah card
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2.5">
            {notifications.map((item) => {
              const Icon = iconFor(item.kind);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => void openNotification(item)}
                  className={`flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition-colors ${
                    item.is_read
                      ? 'border-gray-100 bg-white hover:border-gray-200'
                      : 'border-primary/15 bg-primary/10 hover:border-primary/30'
                  }`}
                >
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                      item.is_read ? 'bg-gray-50 text-gray-400' : 'bg-white text-primary'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-start justify-between gap-3">
                      <span className="text-sm font-bold text-[#101217]">{item.title}</span>
                      {!item.is_read && (
                        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                      )}
                    </span>
                    {item.body && (
                      <span className="mt-1 block text-xs font-medium leading-relaxed text-gray-500">
                        {item.body}
                      </span>
                    )}
                    <span className="mt-1.5 block text-[9px] font-black uppercase tracking-[0.1em] text-gray-300">
                      {relativeTime(item.created_at)}
                    </span>
                  </span>
                  {item.href && (
                    <ChevronRightIcon className="mt-1 h-4 w-4 shrink-0 text-gray-300" />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
