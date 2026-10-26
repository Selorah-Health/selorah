import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  QrCodeIcon,
  ClockIcon,
  ArrowLeftIcon,
  XMarkIcon,
  ShieldExclamationIcon,
  ClipboardDocumentIcon,
  ArrowDownTrayIcon,
  ShareIcon,
  CheckCircleIcon,
  DocumentTextIcon,
  FolderOpenIcon,
} from '@heroicons/react/24/outline';
import { QRCodeCanvas } from 'qrcode.react';
import { createClient } from '../lib/supabase/client';
import { useToast } from '../contexts/ToastContext';
import { useSync } from '../contexts/SyncContext';
import { enqueueAction } from '../lib/offline/queue';
import {
  createShareToken,
  expiryFromMinutes,
  formatCountdown,
  hasCountdown,
  isNetworkError,
  readActiveShare,
  shareUrl,
  writeActiveShare,
  type ActiveShare,
} from '../lib/sharing/share';

type ShareableRecord = {
  id: string;
  name: string;
  pending?: boolean;
};

type QRCodesProps = {
  records?: ShareableRecord[];
};

type ShareState = 'idle' | 'active' | 'revoked' | 'expired';

const DURATION_OPTIONS = [
  { label: 'None', val: 'none' },
  { label: '10m', val: '10' },
  { label: '1h', val: '60' },
  { label: '24h', val: '1440' },
];

function logRevoke(token: string) {
  try {
    const revokeEntry = {
      id: `revoke-${token}`,
      title: 'Shared Link',
      action: 'access revoked for shared QR link',
      timestamp: new Date().toISOString(),
      device: 'QR Code',
      verified: false,
    };
    const existingLogs = JSON.parse(localStorage.getItem('selorah_access_log') || '[]');
    localStorage.setItem('selorah_access_log', JSON.stringify([revokeEntry, ...existingLogs].slice(0, 50)));

    const existingRevoked = JSON.parse(localStorage.getItem('selorah_revoked_logs') || '[]');
    if (!existingRevoked.includes(revokeEntry.id)) {
      localStorage.setItem(
        'selorah_revoked_logs',
        JSON.stringify([revokeEntry.id, ...existingRevoked].slice(0, 50))
      );
    }
  } catch {
    // Access log bridging is best effort.
  }
}

export default function QRCodes({ records = [] }: QRCodesProps) {
  const supabase = createClient();
  const location = useLocation();
  const { success: toastSuccess, error: toastError, warning, info } = useToast();
  const { online } = useSync();

  const [share, setShare] = useState<ActiveShare | null>(null);
  const [state, setState] = useState<ShareState>('idle');
  const [expiryType, setExpiryType] = useState<'preset' | 'custom'>('preset');
  const [expiry, setExpiry] = useState<string>('none');
  const [customExpiry, setCustomExpiry] = useState<string>('5');
  const [selectedRecordId, setSelectedRecordId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [revoking, setRevoking] = useState(false);
  const [copied, setCopied] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const qrRef = useRef<HTMLDivElement>(null);

  const clinicalRecords = useMemo(
    () => records.filter((record) => record?.id && !record.pending),
    [records]
  );

  useEffect(() => {
    const stateRecordId = (location.state as { recordId?: string } | null)?.recordId;
    if (stateRecordId && !share) {
      setSelectedRecordId(stateRecordId);
    }
  }, [location.state, share]);

  const countdownActive = hasCountdown(share?.expiresAt);
  const remaining = countdownActive ? Math.max(0, Math.floor(((share?.expiresAt ? new Date(share.expiresAt).getTime() : 0) - now) / 1000)) : null;

  useEffect(() => {
    if (!share?.expiresAt || !countdownActive) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [share?.expiresAt, countdownActive]);

  useEffect(() => {
    if (state !== 'active' || remaining === null) return;
    if (remaining <= 0) {
      setState('expired');
      writeActiveShare(null);
    }
  }, [remaining, state]);

  useEffect(() => {
    let cancelled = false;

    const applyShare = (next: ActiveShare) => {
      if (cancelled) return;
      setShare(next);
      setSelectedRecordId(next.recordId || '');
      const expired = hasCountdown(next.expiresAt) && new Date(next.expiresAt).getTime() <= Date.now();
      setState(expired ? 'expired' : 'active');
    };

    const restore = async () => {
      try {
        const local = readActiveShare();
        if (local) {
          if (new Date(local.expiresAt).getTime() <= Date.now()) {
            writeActiveShare(null);
          } else {
            applyShare(local);
          }
        }

        const { data: sessionData } = await supabase.auth.getSession();
        const user = sessionData.session?.user;
        if (!user) return;

        const { data, error } = await supabase
          .from('shared_links')
          .select('token, expires_at, is_active, record_id, created_at')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .gt('expires_at', new Date().toISOString())
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error || !data) return;

        const remote: ActiveShare = {
          token: String(data.token),
          expiresAt: String(data.expires_at),
          recordId: data.record_id ? String(data.record_id) : null,
          createdAt: data.created_at ? String(data.created_at) : new Date().toISOString(),
        };
        writeActiveShare(remote);
        applyShare(remote);
      } catch {
        // Offline restore from local storage is enough.
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void restore();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  const deactivateOtherLinks = async (userId: string) => {
    try {
      await supabase
        .from('shared_links')
        .update({ is_active: false })
        .eq('user_id', userId)
        .eq('is_active', true)
        .gt('expires_at', new Date().toISOString());
    } catch {
      // Older projects may not allow the update; the new link still works.
    }
  };

  const queueLinkCreate = async (next: ActiveShare, userId: string) => {
    await enqueueAction({
      type: 'link.create',
      payload: {
        token: next.token,
        userId,
        expiresAt: next.expiresAt,
        recordId: next.recordId,
      },
    });
  };

  const generateCode = async () => {
    if (generating) return;
    setGenerating(true);
    try {
      let minutes: number | null = null;

      if (expiryType === 'custom') {
        const parsed = Number.parseInt(customExpiry, 10);
        if (!Number.isFinite(parsed) || parsed <= 0) {
          warning('Enter a duration in minutes greater than zero.');
          return;
        }
        minutes = Math.min(parsed, 525600);
      } else if (expiry !== 'none') {
        const parsed = Number.parseInt(expiry, 10);
        if (!Number.isFinite(parsed) || parsed <= 0) {
          warning('Choose a valid access duration.');
          return;
        }
        minutes = parsed;
      }

      const selectedRecord = clinicalRecords.find((record) => record.id === selectedRecordId);
      const next: ActiveShare = {
        token: createShareToken(),
        expiresAt: expiryFromMinutes(minutes),
        recordId: selectedRecord?.id || null,
        recordName: selectedRecord?.name,
        createdAt: new Date().toISOString(),
      };

      setShare(next);
      setSelectedRecordId(next.recordId || '');
      setState('active');
      setNow(Date.now());
      writeActiveShare(next);

      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user;

      if (!user) {
        warning('Sign in to activate this link for a doctor.');
        return;
      }

      if (!online) {
        await queueLinkCreate(next, user.id);
        info('Link saved offline. It becomes active when you reconnect.');
        return;
      }

      await deactivateOtherLinks(user.id);

      const row: Record<string, unknown> = {
        user_id: user.id,
        token: next.token,
        expires_at: next.expiresAt,
        is_active: true,
      };
      if (next.recordId) row.record_id = next.recordId;

      const { error } = await supabase.from('shared_links').insert(row);

      if (error) {
        if (error.code === '23505') {
          toastSuccess('Secure link is ready.');
          return;
        }
        if (isNetworkError(error.message)) {
          await queueLinkCreate(next, user.id);
          info('Link saved offline. It becomes active when you reconnect.');
          return;
        }
        writeActiveShare(null);
        setShare(null);
        setState('idle');
        toastError(error.message, 'Could not create link');
        return;
      }

      toastSuccess('Secure link is active. It is ready to scan or share.');
    } finally {
      setGenerating(false);
    }
  };

  const revokeAccess = async () => {
    if (!share || revoking) return;
    setRevoking(true);
    setState('revoked');
    writeActiveShare(null);
    logRevoke(share.token);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user;

      if (user) {
        const revoke = async () =>
          supabase
            .from('shared_links')
            .update({ is_active: false })
            .eq('token', share.token)
            .eq('user_id', user.id);

        if (!online) {
          await enqueueAction({ type: 'link.revoke', payload: { token: share.token } });
          info('Revoked on this device. The server will be updated when you reconnect.');
        } else {
          const { error } = await revoke();
          if (error && isNetworkError(error.message)) {
            await enqueueAction({ type: 'link.revoke', payload: { token: share.token } });
            info('Revoked on this device. The server will be updated when you reconnect.');
          } else if (error) {
            toastError(error.message, 'Server revoke failed');
          }
        }
      }

      toastSuccess('Access revoked. This QR code no longer grants access.');
    } catch {
      toastSuccess('Access revoked on this device.');
    } finally {
      setRevoking(false);
    }
  };

  const link = share ? shareUrl(share.token) : '';

  const copyLink = async () => {
    if (!link) return;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(link);
      } else {
        const field = document.createElement('textarea');
        field.value = link;
        field.style.position = 'fixed';
        field.style.opacity = '0';
        document.body.appendChild(field);
        field.select();
        document.execCommand('copy');
        document.body.removeChild(field);
      }
      setCopied(true);
      toastSuccess('Secure link copied.');
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      toastError('Could not copy the link. Select it and copy manually.');
    }
  };

  const shareLink = async () => {
    if (!link) return;
    const title = share?.recordName ? `Selorah record: ${share.recordName}` : 'Selorah health record';
    if (navigator.share) {
      try {
        await navigator.share({ title, text: 'Open this time-limited Selorah record.', url: link });
        return;
      } catch {
        // User cancelled or share is unavailable. Fall back to copy.
      }
    }
    await copyLink();
  };

  const downloadQr = () => {
    const canvas = qrRef.current?.querySelector('canvas');
    if (!canvas) {
      toastError('The QR code is still rendering. Try again.');
      return;
    }
    try {
      const url = canvas.toDataURL('image/png');
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `selorah-qr-${share?.token || 'code'}.png`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
    } catch {
      toastError('Could not download the QR code.');
    }
  };

  const startOver = () => {
    setShare(null);
    setState('idle');
    setSelectedRecordId('');
    setCopied(false);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-[32px] border border-gray-50 shadow-sm p-10 min-h-[500px] flex flex-col items-center justify-center text-center font-sora">
        <p className="text-gray-400 font-medium">Loading access codes...</p>
      </div>
    );
  }

  const isRevoked = state === 'revoked';
  const isExpired = state === 'expired';
  const isActive = state === 'active' && !isRevoked && !isExpired;

  return (
    <div className="bg-white rounded-[32px] border border-gray-50 shadow-sm p-6 sm:p-10 min-h-[500px] flex flex-col items-center justify-center text-center font-sora">
      {!share ? (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-md w-full">
          <div className="w-24 h-24 bg-[#EEF2FF] rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-sm">
            <QrCodeIcon className="w-12 h-12 text-[#6183FF]" />
          </div>
          <h2 className="text-3xl font-bold text-[#101217] mb-3">Temporary Access Codes</h2>
          <p className="text-gray-500 mb-8">
            Generate a secure QR code to instantly share specific medical records with doctors during visits.
          </p>

          <div className="mb-8 text-left">
            <label className="mb-3 block text-[10px] font-black uppercase tracking-widest text-gray-400">
              What to share
            </label>
            <div className="relative">
              <FolderOpenIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#6183FF]" />
              <select
                value={selectedRecordId}
                onChange={(event) => setSelectedRecordId(event.target.value)}
                className="w-full appearance-none rounded-xl border border-gray-100 bg-gray-50 py-3.5 pl-12 pr-10 text-sm font-bold text-gray-700 outline-none focus:border-[#6183FF]"
              >
                <option value="">Full medical history</option>
                {clinicalRecords.map((record) => (
                  <option key={record.id} value={record.id}>
                    {record.name}
                  </option>
                ))}
              </select>
              <DocumentTextIcon className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-300" />
            </div>
            <p className="mt-2 text-[11px] font-medium text-gray-400">
              {selectedRecordId
                ? 'Only the selected record will be visible through this code.'
                : 'Every clinical record in your profile will be visible through this code.'}
            </p>
          </div>

          <div className="mb-10 text-left">
            <div className="flex justify-between items-center mb-4">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block">
                Set Access Duration
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setExpiryType('preset')}
                  className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded ${
                    expiryType === 'preset' ? 'text-[#6183FF] bg-blue-50' : 'text-gray-400'
                  }`}
                >
                  Presets
                </button>
                <button
                  type="button"
                  onClick={() => setExpiryType('custom')}
                  className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded ${
                    expiryType === 'custom' ? 'text-[#6183FF] bg-blue-50' : 'text-gray-400'
                  }`}
                >
                  Custom
                </button>
              </div>
            </div>

            {expiryType === 'preset' ? (
              <div className="grid grid-cols-4 gap-3">
                {DURATION_OPTIONS.map((option) => (
                  <button
                    type="button"
                    key={option.val}
                    onClick={() => setExpiry(option.val)}
                    className={`min-h-[48px] py-3 rounded-xl font-bold text-sm transition-all border-2 ${
                      expiry === option.val
                        ? 'bg-[#6183FF] text-white border-[#6183FF] shadow-lg shadow-blue-500/20'
                        : 'bg-white text-gray-400 border-gray-100 hover:border-[#6183FF]/30'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex gap-3">
                <input
                  type="number"
                  min="1"
                  max="525600"
                  inputMode="numeric"
                  value={customExpiry}
                  onChange={(event) => setCustomExpiry(event.target.value)}
                  className="flex-1 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 font-bold text-gray-700 focus:outline-none focus:border-[#6183FF]"
                  placeholder="Minutes"
                />
                <div className="bg-gray-100 rounded-xl px-4 py-3 font-bold text-gray-400 flex items-center">
                  MINS
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={generateCode}
            disabled={generating}
            className="w-full bg-[#6183FF] text-white font-bold py-4 px-8 rounded-2xl shadow-xl shadow-blue-500/20 hover:bg-[#4E6EEF] transition-all flex items-center justify-center gap-3 disabled:opacity-60"
          >
            {generating ? 'Creating secure link...' : 'Generate Secure QR Code'}
          </button>

          {!online && (
            <p className="mt-4 text-xs font-medium text-amber-600">
              You are offline. The code is stored here and activated when you reconnect.
            </p>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center animate-in zoom-in duration-500 w-full">
          <div className="flex items-center gap-2 mb-2">
            <span
              className={`w-2 h-2 rounded-full ${
                isRevoked || isExpired ? 'bg-red-500' : 'bg-green-500 animate-pulse'
              }`}
            />
            <h2 className="text-2xl font-bold text-[#101217]">
              {isRevoked ? 'Access Revoked' : isExpired ? 'Code Expired' : 'Access Token Active'}
            </h2>
          </div>
          <p className="text-gray-500 mb-5 max-w-sm">
            {isRevoked
              ? 'This token has been manually invalidated and can no longer be used.'
              : isExpired
                ? 'This code reached its time limit. Generate a new one if access is still needed.'
                : 'Ask your doctor to scan this code to view your verified medical history.'}
          </p>

          <div className="mb-6 inline-flex max-w-full items-center gap-2 rounded-full bg-gray-50 px-4 py-2 text-xs font-bold text-gray-500">
            <FolderOpenIcon className="h-4 w-4 shrink-0 text-[#6183FF]" />
            <span className="truncate">
              Sharing: {share.recordId ? share.recordName || 'Selected record' : 'Full medical history'}
            </span>
          </div>

          <div
            ref={qrRef}
            className={`bg-white p-5 sm:p-8 border border-gray-100 rounded-[32px] sm:rounded-[40px] shadow-2xl shadow-blue-500/5 mb-6 flex items-center justify-center relative ${
              isRevoked || isExpired ? 'opacity-20 grayscale' : ''
            }`}
          >
            <QRCodeCanvas
              value={isActive ? link : isRevoked ? 'REVOKED' : 'EXPIRED'}
              size={240}
              level="H"
              includeMargin={false}
              imageSettings={{
                src: '/logo.png',
                x: undefined,
                y: undefined,
                height: 50,
                width: 50,
                excavate: true,
              }}
            />
            {(isRevoked || isExpired) && (
              <div className="absolute inset-0 flex items-center justify-center">
                <ShieldExclamationIcon className="w-24 h-24 text-red-500 opacity-50" />
              </div>
            )}
          </div>

          {isActive && countdownActive && remaining !== null && (
            <div
              className={`mb-6 flex items-center gap-2 px-6 py-2.5 rounded-full font-bold text-sm ${
                remaining < 60 ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-[#6183FF]'
              }`}
            >
              <ClockIcon className="w-4 h-4" />
              Expires in: {formatCountdown(remaining)}
            </div>
          )}

          {isActive && !countdownActive && (
            <div className="mb-6 flex items-center gap-2 px-6 py-2.5 rounded-full bg-green-50 font-bold text-sm text-green-600">
              <CheckCircleIcon className="w-4 h-4" />
              No expiry set
            </div>
          )}

          {isActive && (
            <div className="flex w-full max-w-sm flex-col items-center gap-3">
              <div className="w-full text-center text-[10px] font-black uppercase tracking-widest text-gray-300">
                Secure Link
              </div>
              <a
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full truncate rounded-2xl border border-gray-100 bg-gray-50 px-5 py-4 text-center font-mono text-sm text-gray-500 transition-all hover:bg-gray-100 hover:text-[#6183FF]"
              >
                {link}
              </a>

              <div className="grid w-full grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={copyLink}
                  className="flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-[#EEF2FF] px-3 py-3 text-xs font-bold text-[#4D6ED6] transition-all hover:bg-[#DCE4FF]"
                >
                  {copied ? <CheckCircleIcon className="h-4 w-4" /> : <ClipboardDocumentIcon className="h-4 w-4" />}
                  {copied ? 'Copied' : 'Copy link'}
                </button>
                <button
                  type="button"
                  onClick={shareLink}
                  className="flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-[#6183FF] px-3 py-3 text-xs font-bold text-white transition-all hover:bg-[#4E6EEF]"
                >
                  <ShareIcon className="h-4 w-4" />
                  Share
                </button>
              </div>

              <button
                type="button"
                onClick={downloadQr}
                className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-gray-100 bg-white px-3 py-3 text-xs font-bold text-gray-500 transition-all hover:border-[#6183FF]/30 hover:text-[#6183FF]"
              >
                <ArrowDownTrayIcon className="h-4 w-4" />
                Download QR image
              </button>

              <button
                type="button"
                onClick={revokeAccess}
                disabled={revoking}
                className="mt-2 flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-red-50 py-3 text-xs font-bold uppercase tracking-widest text-red-500 transition-all hover:bg-red-100 disabled:opacity-60"
              >
                <XMarkIcon className="w-4 h-4" />
                {revoking ? 'Revoking...' : 'Revoke Access Now'}
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={startOver}
            className="mt-8 flex items-center gap-2 text-sm font-bold text-gray-400 transition-colors hover:text-[#6183FF]"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            {isRevoked || isExpired ? 'Generate a new code' : 'Back to generation'}
          </button>

          {share.recordId && !isActive && (
            <p className="mt-4 text-[11px] font-medium text-gray-400">
              This code was limited to {share.recordName || 'one record'}.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
