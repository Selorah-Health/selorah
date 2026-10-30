import { useCallback, useEffect, useState } from 'react';
import {
  ArrowPathIcon,
  CheckIcon,
  ClockIcon,
  CreditCardIcon,
  LinkIcon,
  QrCodeIcon,
  ShieldExclamationIcon,
  SignalSlashIcon,
  TrashIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { QRCodeCanvas } from 'qrcode.react';
import { createClient } from '../lib/supabase/client';
import { useToast } from '../contexts/ToastContext';
import { useSync } from '../contexts/SyncContext';
import { ensurePermanentToken, readCachedPermanentToken, sharedUrl } from '../lib/qr';
import { confirmDialog } from '../lib/dialogs';
import { enqueueAction } from '../lib/offline/queue';

type TempLink = {
  id: string;
  token: string;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
  scans?: number | null;
  last_scanned_at?: string | null;
};

function timeLeftLabel(expiresAt: string | null) {
  if (!expiresAt) return 'No expiry';
  const seconds = Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000);
  if (seconds <= 0) return 'Expired';
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h left`;
  if (hours > 0) return `${hours}h ${minutes}m left`;
  return `${minutes}m left`;
}

export default function QRCodes() {
  const supabase = createClient();
  const { success: toastSuccess, error: toastError, warning, info } = useToast();
  const { online } = useSync();
  const [tab, setTab] = useState<'permanent' | 'temporary'>('permanent');
  const [permanentToken, setPermanentToken] = useState<string | null>(() =>
    readCachedPermanentToken()
  );
  const [links, setLinks] = useState<TempLink[]>([]);
  const [expiryType, setExpiryType] = useState<'preset' | 'custom'>('preset');
  const [expiry, setExpiry] = useState('60');
  const [customExpiry, setCustomExpiry] = useState('5');
  const [activeToken, setActiveToken] = useState<string | null>(null);
  const [activeExpiry, setActiveExpiry] = useState<string | null>(null);
  const [localOnly, setLocalOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const profile = await ensurePermanentToken(supabase);
      if (profile?.permanent_qr_token) setPermanentToken(profile.permanent_qr_token);
    } catch {
      const cached = readCachedPermanentToken();
      if (cached) setPermanentToken(cached);
    }

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('shared_links')
        .select('id, token, expires_at, is_active, created_at, scans, last_scanned_at')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(20);

      const now = Date.now();
      setLinks(
        ((data || []) as TempLink[]).filter(
          (link) => !link.expires_at || new Date(link.expires_at).getTime() > now
        )
      );
    } catch {
      // Offline: the permanent code is still available from cache.
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    void load();
  }, [load]);

  const copy = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(value);
      window.setTimeout(() => setCopied(null), 1800);
    } catch {
      info('Copy is blocked in this browser. Long press the link to copy it.');
    }
  };

  const generateCode = async () => {
    let durationMins = 0;
    let expiresAt: string;

    if (expiryType === 'preset' && expiry === 'none') {
      expiresAt = new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000).toISOString();
    } else {
      durationMins = expiryType === 'custom' ? parseInt(customExpiry, 10) : parseInt(expiry, 10);
      if (!Number.isFinite(durationMins) || durationMins <= 0) {
        warning('Choose a valid access duration.');
        return;
      }
      expiresAt = new Date(Date.now() + durationMins * 60000).toISOString();
    }

    setBusy(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Sign in again to create a code.');

      const token =
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

      if (online) {
        const { data, error } = await supabase
          .from('shared_links')
          .insert({
            token,
            user_id: user.id,
            expires_at: expiresAt,
            is_active: true,
            label: 'Temporary access code',
          })
          .select('id, token, expires_at, is_active, created_at')
          .single();

        if (error) throw error;
        setLinks((current) => [data as TempLink, ...current]);
        setActiveToken(data.token);
        setLocalOnly(false);
        toastSuccess('Temporary QR code created.');
      } else {
        await enqueueAction({
          type: 'link.create',
          payload: {
            token,
            userId: user.id,
            expiresAt,
            recordId: null,
          },
        });
        setLinks((current) => [
          {
            id: `local-${token}`,
            token,
            expires_at: expiresAt,
            is_active: true,
            created_at: new Date().toISOString(),
            scans: 0,
          },
          ...current,
        ]);
        setActiveToken(token);
        setLocalOnly(true);
        toastSuccess('QR code created offline. It activates when you reconnect.');
      }

      setActiveExpiry(expiry === 'none' && expiryType === 'preset' ? null : expiresAt);
    } catch (err) {
      toastError(err instanceof Error ? err.message : 'The code could not be created.');
    } finally {
      setBusy(false);
    }
  };

  const revoke = async (link: TempLink) => {
    const confirmed = await confirmDialog({
      title: 'Delete this temporary code?',
      message:
        'Anyone holding this QR code loses access immediately. This cannot be undone.',
      confirmLabel: 'Delete code',
      tone: 'danger',
      icon: 'shield',
    });
    if (!confirmed) return;

    try {
      if (link.id.startsWith('local-')) {
        setLinks((current) => current.filter((item) => item.id !== link.id));
        if (activeToken === link.token) {
          setActiveToken(null);
          setActiveExpiry(null);
        }
        toastSuccess('Offline code removed.');
        return;
      }

      if (!online) {
        await enqueueAction({ type: 'link.revoke', payload: { token: link.token } });
        setLinks((current) => current.filter((item) => item.id !== link.id));
        toastSuccess('Revocation saved. It syncs when you reconnect.');
        return;
      }

      const { error } = await supabase
        .from('shared_links')
        .update({ is_active: false, revoked_at: new Date().toISOString() })
        .eq('token', link.token);

      if (error) throw error;
      setLinks((current) => current.filter((item) => item.id !== link.id));
      if (activeToken === link.token) {
        setActiveToken(null);
        setActiveExpiry(null);
      }
      toastSuccess('Temporary code deleted. It will not work again.');
    } catch (err) {
      toastError(err instanceof Error ? err.message : 'The code could not be deleted.');
    }
  };

  if (loading) {
    return <div className="h-64 animate-pulse rounded-[28px] bg-white" />;
  }

  return (
    <div className="space-y-6 font-sora">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#6183FF]">
            Secure sharing
          </p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-[#101217] sm:text-3xl">
            QR codes
          </h2>
          <p className="mt-1 max-w-xl text-sm font-medium text-gray-400">
            Your permanent card code for emergencies, plus temporary codes you can delete at any
            time.
          </p>
        </div>
        {!online && (
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-orange-50 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.08em] text-orange-500">
            <SignalSlashIcon className="h-3.5 w-3.5" />
            Offline. Codes save locally
          </span>
        )}
      </div>

      <div className="inline-flex rounded-full border border-gray-200 bg-white p-1">
        {[
          { id: 'permanent' as const, label: 'Permanent card', icon: CreditCardIcon },
          { id: 'temporary' as const, label: 'Temporary code', icon: ClockIcon },
        ].map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`inline-flex min-h-[38px] items-center gap-1.5 rounded-full px-4 text-[10px] font-black uppercase tracking-[0.08em] transition-colors ${
              tab === item.id ? 'bg-[#6183FF] text-white' : 'text-gray-500 hover:text-[#101217]'
            }`}
          >
            <item.icon className="h-3.5 w-3.5" />
            {item.label}
          </button>
        ))}
      </div>

      {tab === 'permanent' ? (
        <div className="grid gap-5 lg:grid-cols-12">
          <div className="rounded-[28px] border border-gray-50 bg-white p-6 shadow-sm sm:p-8 lg:col-span-7">
            <div className="flex flex-col items-center text-center">
              <div className="rounded-[32px] border border-gray-100 bg-white p-6 shadow-xl shadow-[#6183FF]/5">
                {permanentToken ? (
                  <QRCodeCanvas
                    value={sharedUrl(permanentToken)}
                    size={230}
                    level="H"
                    includeMargin={false}
                    imageSettings={{
                      src: '/logo.svg',
                      x: undefined,
                      y: undefined,
                      height: 48,
                      width: 48,
                      excavate: true,
                    }}
                  />
                ) : (
                  <div className="flex h-[230px] w-[230px] items-center justify-center text-gray-300">
                    <QrCodeIcon className="h-16 w-16" />
                  </div>
                )}
              </div>

              <h3 className="mt-5 text-lg font-bold text-[#101217]">Your permanent Selorah code</h3>
              <p className="mt-1 max-w-sm text-xs font-medium leading-relaxed text-gray-400">
                This code never expires. A clinician can scan it in an emergency, and you can
                revoke any device from your access log.
              </p>

              {permanentToken && (
                <button
                  type="button"
                  onClick={() => copy(sharedUrl(permanentToken))}
                  className="mt-4 flex min-h-[42px] items-center gap-2 rounded-full bg-[#F8F9FE] px-4 text-[11px] font-bold text-gray-600 transition-colors hover:bg-[#EEF2FF] hover:text-[#6183FF]"
                >
                  {copied === sharedUrl(permanentToken) ? (
                    <CheckIcon className="h-4 w-4" />
                  ) : (
                    <LinkIcon className="h-4 w-4" />
                  )}
                  {copied === sharedUrl(permanentToken) ? 'Link copied' : 'Copy emergency link'}
                </button>
              )}
            </div>
          </div>

          <div className="space-y-4 lg:col-span-5">
            <div className="rounded-[24px] border border-[#6183FF]/15 bg-[#EEF2FF] p-5">
              <p className="text-sm font-bold text-[#101217]">Carry it on your card</p>
              <p className="mt-1 text-[11px] font-medium leading-relaxed text-gray-500">
                Order a physical Selorah card with this QR code, your blood group, and emergency
                contact printed on it.
              </p>
              <button
                type="button"
                onClick={() => (window.location.href = '/dashboard/card')}
                className="mt-3 flex min-h-[40px] items-center gap-1.5 rounded-full bg-[#6183FF] px-4 text-[11px] font-bold text-white"
              >
                <CreditCardIcon className="h-4 w-4" />
                Open Selorah card
              </button>
            </div>

            <div className="rounded-[24px] border border-gray-50 bg-white p-5 shadow-sm">
              <p className="text-sm font-bold text-[#101217]">What gets shared</p>
              <ul className="mt-2 space-y-1.5 text-[11px] font-medium leading-relaxed text-gray-500">
                <li>Your emergency profile and blood group.</li>
                <li>The medical records in your vault.</li>
                <li>Every scan is logged and you are notified.</li>
              </ul>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-12">
          <div className="rounded-[28px] border border-gray-50 bg-white p-5 shadow-sm sm:p-6 lg:col-span-6">
            <h3 className="text-base font-bold text-[#101217]">Create a temporary code</h3>
            <p className="mt-1 text-[11px] font-medium leading-relaxed text-gray-400">
              Give a clinic time-limited access. Delete it early whenever you want.
            </p>

            <div className="mt-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[9px] font-black uppercase tracking-[0.12em] text-gray-400">
                  Access duration
                </span>
                <div className="flex gap-1">
                  {[
                    { id: 'preset' as const, label: 'Presets' },
                    { id: 'custom' as const, label: 'Custom' },
                  ].map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setExpiryType(option.id)}
                      className={`rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.08em] ${
                        expiryType === option.id
                          ? 'bg-[#EEF2FF] text-[#6183FF]'
                          : 'text-gray-400'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {expiryType === 'preset' ? (
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { label: '1h', val: '60' },
                    { label: '6h', val: '360' },
                    { label: '24h', val: '1440' },
                    { label: '7d', val: '10080' },
                  ].map((option) => (
                    <button
                      key={option.val}
                      type="button"
                      onClick={() => setExpiry(option.val)}
                      className={`min-h-[44px] rounded-xl border-2 text-xs font-bold transition-all ${
                        expiry === option.val
                          ? 'border-[#6183FF] bg-[#6183FF] text-white'
                          : 'border-gray-100 text-gray-400 hover:border-[#6183FF]/30'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="number"
                    min={1}
                    max={43200}
                    value={customExpiry}
                    onChange={(event) => setCustomExpiry(event.target.value)}
                    className="min-h-[44px] flex-1 rounded-xl border border-gray-200 px-3.5 text-sm font-bold outline-none focus:border-[#6183FF]"
                  />
                  <span className="flex items-center rounded-xl bg-[#F8F9FE] px-3.5 text-[10px] font-black text-gray-400">
                    MINS
                  </span>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={generateCode}
              disabled={busy}
              className="mt-4 flex min-h-[46px] w-full items-center justify-center gap-2 rounded-full bg-[#6183FF] text-sm font-bold text-white shadow-lg shadow-[#6183FF]/20 disabled:opacity-60"
            >
              <QrCodeIcon className="h-4 w-4" />
              {busy ? 'Creating...' : online ? 'Generate QR code' : 'Create offline QR code'}
            </button>

            {activeToken && (
              <div className="mt-5 rounded-2xl border border-gray-100 bg-[#F8F9FE] p-4 text-center">
                <div className="mx-auto w-fit rounded-2xl bg-white p-3 shadow-sm">
                  <QRCodeCanvas value={sharedUrl(activeToken)} size={160} level="H" />
                </div>
                <p className="mt-2 text-[10px] font-bold text-[#101217]">
                  {localOnly
                    ? 'Saved offline. Activates when you reconnect.'
                    : activeExpiry
                      ? timeLeftLabel(activeExpiry)
                      : 'No expiry'}
                </p>
                <button
                  type="button"
                  onClick={() => copy(sharedUrl(activeToken))}
                  className="mt-2 text-[10px] font-bold text-[#6183FF] hover:underline"
                >
                  Copy link
                </button>
              </div>
            )}
          </div>

          <div className="rounded-[28px] border border-gray-50 bg-white p-5 shadow-sm sm:p-6 lg:col-span-6">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-bold text-[#101217]">Active temporary codes</h3>
                <p className="text-[11px] font-medium text-gray-400">
                  Delete one to revoke access immediately.
                </p>
              </div>
              <button
                type="button"
                onClick={() => void load()}
                aria-label="Refresh codes"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-gray-400 hover:text-[#6183FF]"
              >
                <ArrowPathIcon className="h-4 w-4" />
              </button>
            </div>

            {links.length === 0 ? (
              <div className="mt-4 rounded-2xl border border-dashed border-gray-200 bg-[#F8F9FE] px-4 py-8 text-center">
                <ClockIcon className="mx-auto h-6 w-6 text-gray-300" />
                <p className="mt-2 text-xs font-bold text-[#101217]">No active codes</p>
                <p className="mt-1 text-[10px] font-medium text-gray-400">
                  Temporary codes appear here until they expire or you delete them.
                </p>
              </div>
            ) : (
              <div className="mt-3 space-y-2.5">
                {links.map((link) => (
                  <div
                    key={link.id}
                    className="flex items-center gap-3 rounded-2xl border border-gray-100 p-3"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#EEF2FF] text-[#6183FF]">
                      <QrCodeIcon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-bold text-[#101217]">
                        {timeLeftLabel(link.expires_at)}
                      </p>
                      <p className="truncate text-[9px] font-medium text-gray-400">
                        {link.scans || 0} scan{(link.scans || 0) === 1 ? '' : 's'} - created{' '}
                        {new Date(link.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => revoke(link)}
                      aria-label="Delete temporary code"
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-500 transition-colors hover:bg-red-500 hover:text-white"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex items-start gap-2 rounded-2xl border border-gray-100 bg-white px-4 py-3">
        <ShieldExclamationIcon className="mt-0.5 h-4 w-4 shrink-0 text-[#6183FF]" />
        <p className="text-[10px] font-medium leading-relaxed text-gray-400">
          Anyone with a code can view the records you shared. Only share codes with people you
          trust, and check your access log after a visit.
        </p>
        {activeToken && (
          <button
            type="button"
            onClick={() => {
              setActiveToken(null);
              setActiveExpiry(null);
            }}
            className="ml-auto flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-gray-300 hover:text-gray-500"
            aria-label="Hide active code"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
