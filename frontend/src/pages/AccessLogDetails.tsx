import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeftIcon,
  ClockIcon,
  ComputerDesktopIcon,
  DocumentMagnifyingGlassIcon,
  GlobeAltIcon,
  QrCodeIcon,
  ShieldCheckIcon,
  ShieldExclamationIcon,
} from '@heroicons/react/24/outline';
import { createClient } from '../lib/supabase/client';
import { useToast } from '../contexts/ToastContext';

type DetailEntry = {
  title: string;
  subtitle: string;
  action: string;
  timestamp: string;
  device: string;
  verified: boolean;
  kind: 'provider' | 'link';
  token?: string;
  expiresAt?: string | null;
  revoked?: boolean;
};

function formatDateTime(value?: string | null) {
  if (!value) return 'Not recorded';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not recorded';
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function AccessLogDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const supabase = createClient();
  const { success, error: toastError } = useToast();
  const [entry, setEntry] = useState<DetailEntry | null>(null);
  const [loading, setLoading] = useState(true);

  const loadEntry = useCallback(async () => {
    if (!id) {
      setLoading(false);
      return;
    }

    if (id.startsWith('link-')) {
      const linkId = id.replace('link-', '');
      const { data } = await supabase
        .from('shared_links')
        .select('id, token, is_active, expires_at, created_at')
        .eq('id', linkId)
        .maybeSingle();

      if (data) {
        const expired = data.expires_at
          ? new Date(data.expires_at).getTime() < Date.now()
          : false;
        const live = data.is_active && !expired;
        setEntry({
          title: live ? 'Active QR access link' : 'QR access link',
          subtitle: live ? 'Live share' : expired ? 'Expired share' : 'Revoked share',
          action: live
            ? 'Anyone holding this code can view the records you selected.'
            : expired
              ? 'This link expired and no longer grants access.'
              : 'You revoked this link. It no longer grants access.',
          timestamp: formatDateTime(data.created_at),
          device: 'QR code',
          verified: true,
          kind: 'link',
          token: data.token,
          expiresAt: data.expires_at,
          revoked: !live,
        });
      }
      setLoading(false);
      return;
    }

    const { data: log } = await supabase
      .from('access_logs')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (log) {
      let title = log.organization_name || 'Verified provider';
      if (log.provider_id) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('first_name, last_name, organization_name')
          .eq('id', log.provider_id)
          .maybeSingle();
        if (profile) {
          title =
            profile.organization_name ||
            [profile.first_name, profile.last_name].filter(Boolean).join(' ') ||
            title;
        }
      }

      setEntry({
        title,
        subtitle: log.provider_id ? 'Verified provider session' : 'Recorded access',
        action: log.action || 'Viewed your medical record',
        timestamp: formatDateTime(log.accessed_at),
        device: 'Provider portal',
        verified: Boolean(log.provider_id || log.organization_name),
        kind: 'provider',
      });
    }

    setLoading(false);
  }, [id, supabase]);

  useEffect(() => {
    loadEntry();
  }, [loadEntry]);

  const revokeLink = async () => {
    if (!entry?.token) return;
    if (!window.confirm('Revoke this QR link now? It will stop working immediately.')) return;

    const { error } = await supabase
      .from('shared_links')
      .update({ is_active: false })
      .eq('token', entry.token);

    if (error) {
      toastError(error.message, 'Could not revoke access');
      return;
    }

    setEntry((previous) =>
      previous
        ? {
            ...previous,
            title: 'QR access link',
            subtitle: 'Revoked share',
            action: 'You revoked this link. It no longer grants access.',
            revoked: true,
          }
        : previous
    );
    success('Access revoked. The link will not work again.');
  };

  return (
    <div className="space-y-5 font-sora">
      <button
        type="button"
        onClick={() => navigate('/dashboard/access-log')}
        className="group flex items-center gap-2 text-xs font-bold text-gray-400 transition-colors hover:text-[#6183FF]"
      >
        <ArrowLeftIcon className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
        Back to access log
      </button>

      {loading ? (
        <div className="h-80 animate-pulse rounded-[28px] border border-gray-50 bg-white" />
      ) : !entry ? (
        <div className="rounded-[28px] border border-gray-50 bg-white p-10 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F8F9FE] text-gray-300">
            <DocumentMagnifyingGlassIcon className="h-7 w-7" />
          </div>
          <h2 className="mt-4 text-lg font-bold text-[#101217]">This entry is not available</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm font-medium leading-relaxed text-gray-400">
            The activity may have been removed, or it belongs to a different account.
          </p>
          <button
            type="button"
            onClick={() => navigate('/dashboard/access-log')}
            className="mt-5 min-h-[42px] rounded-full bg-[#6183FF] px-5 text-xs font-bold text-white"
          >
            Return to access log
          </button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-[28px] border border-gray-50 bg-white shadow-sm">
          <div className="border-b border-gray-50 p-6 sm:p-8">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
                    entry.kind === 'link'
                      ? 'bg-[#EEF2FF] text-[#6183FF]'
                      : entry.revoked
                        ? 'bg-red-50 text-red-400'
                        : 'bg-green-50 text-green-600'
                  }`}
                >
                  {entry.kind === 'link' ? (
                    <QrCodeIcon className="h-6 w-6" />
                  ) : (
                    <DocumentMagnifyingGlassIcon className="h-6 w-6" />
                  )}
                </div>
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-[#101217]">
                    {entry.title}
                  </h2>
                  <p className="mt-0.5 text-xs font-medium text-gray-400">{entry.subtitle}</p>
                </div>
              </div>

              <span
                className={`inline-flex w-fit items-center gap-1.5 rounded-full border px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.12em] ${
                  entry.revoked
                    ? 'border-red-100 bg-red-50 text-red-500'
                    : 'border-green-100 bg-green-50 text-green-600'
                }`}
              >
                <ShieldCheckIcon className="h-3.5 w-3.5" />
                {entry.revoked ? 'Revoked' : entry.verified ? 'Verified session' : 'Recorded'}
              </span>
            </div>
          </div>

          <div className="grid gap-8 p-6 sm:p-8 md:grid-cols-2">
            <div className="space-y-6">
              <div>
                <h3 className="mb-3 text-[9px] font-black uppercase tracking-[0.18em] text-gray-300">
                  Activity summary
                </h3>
                <div className="rounded-2xl border border-gray-100 bg-[#F8F9FE] p-5">
                  <p className="text-sm font-bold leading-relaxed text-[#101217]">
                    {entry.action}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div>
                  <h4 className="mb-1.5 flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.14em] text-gray-300">
                    <ClockIcon className="h-3 w-3" />
                    Timestamp
                  </h4>
                  <p className="text-xs font-bold text-[#101217]">{entry.timestamp}</p>
                </div>
                <div>
                  <h4 className="mb-1.5 flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.14em] text-gray-300">
                    <GlobeAltIcon className="h-3 w-3" />
                    Source
                  </h4>
                  <p className="text-xs font-bold text-[#101217]">{entry.device}</p>
                </div>
              </div>

              {entry.token && (
                <div>
                  <h4 className="mb-1.5 text-[9px] font-black uppercase tracking-[0.14em] text-gray-300">
                    Share token
                  </h4>
                  <p className="break-all rounded-xl bg-gray-50 px-3 py-2 font-mono text-[10px] font-semibold text-gray-500">
                    {entry.token}
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-5">
              <div>
                <h3 className="mb-3 text-[9px] font-black uppercase tracking-[0.18em] text-gray-300">
                  Device verification
                </h3>
                <div className="flex items-center gap-3 rounded-2xl border border-gray-100 p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EEF2FF] text-[#6183FF]">
                    <ComputerDesktopIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#101217]">{entry.device}</p>
                    <p className="mt-0.5 text-[9px] font-black uppercase tracking-[0.12em] text-green-500">
                      Encrypted connection
                    </p>
                  </div>
                </div>
              </div>

              {entry.kind === 'link' && entry.expiresAt && (
                <div className="rounded-2xl border border-gray-100 p-4">
                  <p className="text-[9px] font-black uppercase tracking-[0.14em] text-gray-300">
                    Expires
                  </p>
                  <p className="mt-1 text-xs font-bold text-[#101217]">
                    {formatDateTime(entry.expiresAt)}
                  </p>
                </div>
              )}

              <div className="rounded-2xl border border-red-100 bg-red-50/50 p-5">
                <div className="mb-2 flex items-center gap-2">
                  <ShieldExclamationIcon className="h-4 w-4 text-red-500" />
                  <h3 className="text-[10px] font-black uppercase tracking-[0.14em] text-red-600">
                    Security controls
                  </h3>
                </div>
                <p className="text-[11px] font-medium leading-relaxed text-red-700/60">
                  {entry.kind === 'link'
                    ? 'Revoking this link immediately invalidates the code for everyone who has it.'
                    : 'Provider access comes from a QR link you shared. Revoke the matching link in your access log to stop future sessions.'}
                </p>
                <button
                  type="button"
                  onClick={
                    entry.kind === 'link' && !entry.revoked
                      ? revokeLink
                      : () => navigate('/dashboard/access-log')
                  }
                  className={`mt-4 w-full rounded-2xl py-3.5 text-xs font-bold transition-colors ${
                    entry.kind === 'link' && !entry.revoked
                      ? 'bg-red-500 text-white hover:bg-red-600'
                      : 'border border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {entry.kind === 'link' && !entry.revoked
                    ? 'Revoke this link'
                    : 'Review all access'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
