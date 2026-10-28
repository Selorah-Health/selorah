import { useCallback, useEffect, useState } from 'react';
import {
  ArrowRightIcon,
  ComputerDesktopIcon,
  DevicePhoneMobileIcon,
  QrCodeIcon,
  ShieldCheckIcon,
  ShieldExclamationIcon,
} from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import { createClient } from '../lib/supabase/client';
import { useToast } from '../contexts/ToastContext';

type AccessEntry = {
  id: string;
  title: string;
  action: string;
  time: string;
  date: string;
  sortAt: number;
  color: string;
  status: 'Active' | 'Revoked' | 'Expired';
  device: string;
  verified: boolean;
  kind: 'provider' | 'link';
  linkToken?: string;
  isRevoked?: boolean;
};

function timeLabel(value?: string | null) {
  if (!value) return '';
  return new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function dateLabel(value?: string | null) {
  if (!value) return '';
  return new Date(value).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function AccessLog() {
  const { success, error: toastError } = useToast();
  const [logs, setLogs] = useState<AccessEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const supabase = createClient();

  const loadLogs = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setLogs([]);
      setLoading(false);
      return;
    }

    const entries: AccessEntry[] = [];

    try {
      const { data: accessRows, error } = await supabase
        .from('access_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('accessed_at', { ascending: false });

      if (!error && accessRows) {
        const providerIds = Array.from(
          new Set(
            accessRows
              .map((row: Record<string, any>) => row.provider_id)
              .filter(Boolean)
          )
        ) as string[];

        const providerNames = new Map<string, string>();
        if (providerIds.length) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, first_name, last_name, organization_name')
            .in('id', providerIds);

          (profiles || []).forEach((profile: Record<string, any>) => {
            const name =
              profile.organization_name ||
              [profile.first_name, profile.last_name].filter(Boolean).join(' ') ||
              'Verified provider';
            providerNames.set(profile.id, name);
          });
        }

        accessRows.forEach((row: Record<string, any>) => {
          const title =
            row.organization_name ||
            providerNames.get(row.provider_id) ||
            'Verified provider';
          const createdAt = row.accessed_at ? new Date(row.accessed_at).getTime() : 0;

          entries.push({
            id: String(row.id),
            title,
            action: row.action || 'Viewed your medical record',
            time: timeLabel(row.accessed_at),
            date: dateLabel(row.accessed_at),
            sortAt: createdAt,
            color: row.color || 'bg-[#6183FF]',
            status: 'Active',
            device: 'Provider portal',
            verified: Boolean(row.provider_id || row.organization_name),
            kind: 'provider',
          });
        });
      }
    } catch {
      // Older projects may not have access_logs.
    }

    try {
      const { data: links } = await supabase
        .from('shared_links')
        .select('id, token, is_active, expires_at, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      const now = Date.now();
      (links || []).forEach((link: Record<string, any>) => {
        const expired = link.expires_at
          ? new Date(link.expires_at).getTime() < now
          : false;
        const live = link.is_active && !expired;
        const createdAt = link.created_at ? new Date(link.created_at).getTime() : 0;

        entries.push({
          id: `link-${link.id}`,
          title: live ? 'Active QR access link' : 'QR access link',
          action: live
            ? 'Anyone with the code can view the records you selected.'
            : expired
              ? 'This shared link expired.'
              : 'This shared link was revoked.',
          time: timeLabel(link.created_at),
          date: dateLabel(link.created_at),
          sortAt: createdAt,
          color: live ? 'bg-[#5FFAB0]' : 'bg-red-400',
          status: live ? 'Active' : expired ? 'Expired' : 'Revoked',
          device: 'QR code',
          verified: true,
          kind: 'link',
          linkToken: link.token,
          isRevoked: !live,
        });
      });
    } catch {
      // Older projects may not have shared_links.
    }

    setLogs(entries.sort((a, b) => b.sortAt - a.sortAt));
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const handleRevoke = async (entry: AccessEntry) => {
    if (!entry.linkToken) return;
    if (!window.confirm('Revoke this QR link? Anyone holding it loses access immediately.')) {
      return;
    }

    const { error } = await supabase
      .from('shared_links')
      .update({ is_active: false })
      .eq('token', entry.linkToken);

    if (error) {
      toastError(error.message, 'Could not revoke access');
      return;
    }

    setLogs((previous) =>
      previous.map((item) =>
        item.id === entry.id
          ? {
              ...item,
              title: 'QR access link',
              action: 'This shared link was revoked.',
              color: 'bg-red-400',
              status: 'Revoked' as const,
              isRevoked: true,
            }
          : item
      )
    );
    success('Access has been revoked. The link will not work again.');
  };

  return (
    <div className="space-y-6 font-sora">
      <div className="rounded-[28px] border border-gray-50 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#EEF2FF] text-[#6183FF]">
              <ShieldExclamationIcon className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-[#101217] sm:text-2xl">
                Access audit log
              </h2>
              <p className="mt-1 max-w-lg text-sm font-medium leading-relaxed text-gray-400">
                Every time a provider opens your record or a QR link is used, it is recorded here.
              </p>
            </div>
          </div>
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-[#EAFBF2] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-[#15955C]">
            <ShieldCheckIcon className="h-3.5 w-3.5" />
            Encrypted audit
          </span>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((item) => (
            <div
              key={item}
              className="h-24 animate-pulse rounded-3xl border border-gray-50 bg-white"
            />
          ))}
        </div>
      ) : logs.length === 0 ? (
        <div className="rounded-[28px] border border-gray-50 bg-white p-8 text-center shadow-sm sm:p-12">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#F8F9FE] text-[#6183FF]">
            <QrCodeIcon className="h-8 w-8" />
          </div>
          <h3 className="mt-4 text-lg font-bold text-[#101217]">No access activity yet</h3>
          <p className="mx-auto mt-2 max-w-sm text-sm font-medium leading-relaxed text-gray-400">
            When you share a record with a clinic, their access will appear here with a
            timestamp. You can revoke a share at any time.
          </p>
          <button
            type="button"
            onClick={() => navigate('/dashboard/qrcodes')}
            className="mt-5 inline-flex min-h-[42px] items-center gap-2 rounded-full bg-[#6183FF] px-5 text-xs font-bold text-white"
          >
            Create a QR code
            <ArrowRightIcon className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {logs.map((entry) => {
            const isQr = entry.kind === 'link';
            const isMobile = entry.device.toLowerCase().includes('iphone');
            const revoked = entry.status !== 'Active';
            return (
              <div
                key={entry.id}
                className={`flex flex-col gap-4 rounded-[24px] border bg-white p-5 transition-all sm:flex-row sm:items-center sm:p-6 ${
                  revoked
                    ? 'border-gray-100 opacity-65'
                    : 'border-gray-50 hover:border-[#6183FF]/25 hover:shadow-sm'
                }`}
              >
                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
                    isQr
                      ? 'bg-[#EEF2FF] text-[#6183FF]'
                      : isMobile
                        ? 'bg-orange-50 text-orange-500'
                        : 'bg-blue-50 text-blue-500'
                  }`}
                >
                  {isQr ? (
                    <QrCodeIcon className="h-5 w-5" />
                  ) : isMobile ? (
                    <DevicePhoneMobileIcon className="h-5 w-5" />
                  ) : (
                    <ComputerDesktopIcon className="h-5 w-5" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p
                      className={`text-sm font-bold ${
                        revoked ? 'text-gray-400' : 'text-[#101217]'
                      }`}
                    >
                      {entry.title}
                    </p>
                    {revoked ? (
                      <span className="rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.1em] text-gray-400">
                        {entry.status}
                      </span>
                    ) : (
                      <span className="rounded-full border border-green-200 bg-green-50 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.1em] text-green-600">
                        Live
                      </span>
                    )}
                  </div>
                  <p
                    className={`mt-1 text-xs font-medium leading-relaxed ${
                      revoked ? 'text-gray-300' : 'text-gray-500'
                    }`}
                  >
                    {entry.action}
                    <span className="mx-1.5 text-gray-300">via</span>
                    <span className="font-bold text-gray-600">{entry.device}</span>
                  </p>
                  <div className="mt-1.5 flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.08em] text-gray-300">
                    <span>{entry.time}</span>
                    <span>•</span>
                    <span>{entry.date}</span>
                  </div>
                </div>

                <div className="flex w-full items-center gap-2 sm:w-auto">
                  <button
                    type="button"
                    onClick={() => navigate(`/dashboard/access-log/${entry.id}`)}
                    className="flex min-h-[40px] flex-1 items-center justify-center rounded-full bg-gray-50 px-4 text-[11px] font-bold text-[#101217] transition-colors hover:bg-gray-100 sm:flex-none"
                  >
                    Details
                  </button>
                  {isQr && !revoked && (
                    <button
                      type="button"
                      onClick={() => handleRevoke(entry)}
                      className="flex min-h-[40px] flex-1 items-center justify-center rounded-full bg-red-50 px-4 text-[11px] font-bold text-red-500 transition-colors hover:bg-red-500 hover:text-white sm:flex-none"
                    >
                      Revoke
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
