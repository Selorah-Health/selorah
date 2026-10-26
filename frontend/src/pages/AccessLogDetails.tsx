import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from '../contexts/ToastContext';
import { createClient } from '../lib/supabase/client';
import {
  ArrowLeftIcon,
  ShieldCheckIcon,
  DevicePhoneMobileIcon,
  GlobeAltIcon,
  ClockIcon,
  ShieldExclamationIcon,
  DocumentMagnifyingGlassIcon,
} from '@heroicons/react/24/outline';

type LogDetail = {
  title: string;
  action: string;
  time: string;
  date: string;
  color: string;
  location: string;
  ip: string;
  device: string;
  type: string;
  linkToken?: string;
  revoked?: boolean;
  expired?: boolean;
};

const STATIC_LOGS: Record<string, LogDetail> = {
  '1': {
    title: 'Reddington Hospital',
    action: 'viewed SNH Lab Result',
    time: '2hr ago',
    date: 'April 7, 2026',
    color: 'bg-[#22C55E]',
    location: 'Lagos, Nigeria',
    ip: '192.168.1.45',
    device: 'Hospital Workstation (Chrome/Windows)',
    type: 'Verified Provider',
  },
  '2': {
    title: 'St. Nicholas Hospital',
    action: 'gained access to medical history',
    time: 'Yesterday',
    date: 'April 6, 2026',
    color: 'bg-[#FACC15]',
    location: 'Lagos Island, Nigeria',
    ip: '41.203.77.12',
    device: 'iPad Pro (Safari/iOS)',
    type: 'Emergency Access',
  },
  '3': {
    title: 'Igando General Hospital',
    action: 'viewed YFB Vaccination',
    time: '2 days ago',
    date: 'April 5, 2026',
    color: 'bg-[#EF4444]',
    location: 'Alimosho, Nigeria',
    ip: '102.89.2.21',
    device: 'Android Tablet (Chrome)',
    type: 'Verified Provider',
  },
  '4': {
    title: 'Dr. Adeyemi',
    action: 'added a new prescription',
    time: 'Last week',
    date: 'March 15, 2026',
    color: 'bg-[#3B82F6]',
    location: 'Victoria Island, Nigeria',
    ip: '105.112.33.8',
    device: 'iPhone 15 (Mobile App)',
    type: 'Verified Doctor',
  },
};

function formatTime(value?: string | null) {
  if (!value) return '';
  return new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDate(value?: string | null) {
  if (!value) return '';
  return new Date(value).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function AccessLogDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { success: toastSuccess, error: toastError } = useToast();
  const supabase = createClient();
  const [log, setLog] = useState<LogDetail | null>(STATIC_LOGS[id || ''] || null);
  const [loading, setLoading] = useState(true);
  const [revoking, setRevoking] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!id) {
        setLoading(false);
        return;
      }

      try {
        if (id.startsWith('link-')) {
          const linkId = id.slice(5);
          const { data } = await supabase
            .from('shared_links')
            .select('id, token, is_active, expires_at, created_at')
            .eq('id', linkId)
            .maybeSingle();

          if (data && !cancelled) {
            const expired = new Date(data.expires_at).getTime() <= Date.now();
            const live = data.is_active && !expired;
            setLog({
              title: live ? 'Active QR Access Link' : 'QR Access Link',
              action: live
                ? 'live shared link, anyone with the code can view records'
                : data.is_active
                  ? 'shared link expired'
                  : 'shared link was revoked',
              time: formatTime(data.created_at),
              date: formatDate(data.created_at),
              color: live ? 'bg-[#22C55E]' : 'bg-[#EF4444]',
              location: 'Not recorded',
              ip: 'Not recorded',
              device: 'QR Code',
              type: 'Temporary QR Access',
              linkToken: data.token,
              revoked: !data.is_active,
              expired: data.is_active && expired,
            });
          }
        } else {
          const { data } = await supabase
            .from('access_logs')
            .select('*')
            .eq('id', id)
            .maybeSingle();

          if (data && !cancelled) {
            setLog({
              title: data.organization_name || 'Verified Healthcare Provider',
              action: data.action || 'viewed your medical records',
              time: formatTime(data.created_at),
              date: formatDate(data.created_at),
              color: data.color || 'bg-[#6183FF]',
              location: data.location || 'Not recorded',
              ip: data.ip_address || 'Not recorded',
              device: data.device || 'Hospital Portal',
              type: 'Verified Provider',
            });
          }
        }

        if (!cancelled) {
          const revoked = JSON.parse(localStorage.getItem('selorah_revoked_logs') || '[]');
          if (Array.isArray(revoked) && revoked.includes(id)) {
            setLog((prev) =>
              prev
                ? {
                    ...prev,
                    revoked: true,
                    action: 'access revoked for this share',
                    color: 'bg-[#EF4444]',
                  }
                : prev
            );
          }
        }
      } catch {
        // Keep the static fallback when the server is unavailable.
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [id, supabase]);

  const handleRevoke = async () => {
    if (!log) return;
    if (!window.confirm(`Revoke all future access for ${log.title}?`)) return;

    setRevoking(true);
    try {
      if (log.linkToken) {
        const { error } = await supabase
          .from('shared_links')
          .update({ is_active: false })
          .eq('token', log.linkToken);
        if (error) throw error;
      }

      if (id) {
        const existing = JSON.parse(localStorage.getItem('selorah_revoked_logs') || '[]');
        if (!existing.includes(id)) {
          localStorage.setItem('selorah_revoked_logs', JSON.stringify([...existing, id]));
        }
      }

      toastSuccess('Access revoked. Security team has been notified.');
      navigate('/dashboard/access-log');
    } catch (error) {
      toastError(
        error instanceof Error ? error.message : 'Could not revoke this access.',
        'Revoke failed'
      );
    } finally {
      setRevoking(false);
    }
  };

  if (loading && !log) {
    return (
      <div className="bg-white rounded-[40px] border border-gray-50 shadow-xl shadow-blue-500/5 p-10 min-h-[400px] flex items-center justify-center">
        <p className="text-gray-400 font-medium">Loading access details...</p>
      </div>
    );
  }

  if (!log) {
    return (
      <div className="space-y-6 font-sora">
        <button
          onClick={() => navigate('/dashboard/access-log')}
          className="flex items-center gap-2 text-gray-400 hover:text-[#6183FF] transition-all group"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          <span className="font-bold text-sm">Back to Access Log</span>
        </button>
        <div className="bg-white rounded-[40px] border border-gray-50 shadow-xl shadow-blue-500/5 p-10 min-h-[400px] flex flex-col items-center justify-center text-center">
          <ShieldExclamationIcon className="w-12 h-12 text-gray-300 mb-4" />
          <h2 className="text-2xl font-black text-[#101217]">Access record not found</h2>
          <p className="text-gray-400 font-medium mt-2">
            This entry may have been removed or belongs to another account.
          </p>
        </div>
      </div>
    );
  }

  const isRevoked = log.revoked === true;

  return (
    <div className="space-y-6 font-sora">
      <button
        onClick={() => navigate('/dashboard/access-log')}
        className="flex items-center gap-2 text-gray-400 hover:text-[#6183FF] transition-all group"
      >
        <ArrowLeftIcon className="w-4 h-4" />
        <span className="font-bold text-sm">Back to Access Log</span>
      </button>

      <div className="bg-white rounded-[40px] border border-gray-50 shadow-xl shadow-blue-500/5 overflow-hidden">
        <div className="p-6 sm:p-10 border-b border-gray-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-5">
            <div
              className={`w-14 h-14 rounded-2xl ${log.color} flex items-center justify-center shadow-lg shadow-blue-500/10`}
            >
              <DocumentMagnifyingGlassIcon className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-[#101217] tracking-tight">{log.title}</h2>
              <p className="text-gray-400 font-medium text-sm">{log.type}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {isRevoked || log.expired ? (
              <span className="bg-red-50 text-red-500 text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-full border border-red-100 flex items-center gap-2">
                <ShieldExclamationIcon className="w-4 h-4" />
                {isRevoked ? 'Access Revoked' : 'Code Expired'}
              </span>
            ) : (
              <span className="bg-green-50 text-green-600 text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-full border border-green-100 flex items-center gap-2">
                <ShieldCheckIcon className="w-4 h-4" /> Secure Session
              </span>
            )}
          </div>
        </div>

        <div className="p-6 sm:p-10 md:p-14">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="space-y-10">
              <div>
                <h3 className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] mb-4">
                  Activity Summary
                </h3>
                <div className="bg-gray-50 rounded-3xl p-6 border border-gray-100">
                  <p className="text-[#101217] font-bold text-lg mb-2">&quot;{log.action}&quot;</p>
                  <p className="text-gray-400 text-sm font-medium">
                    This action was authorized via a temporary QR access token generated by the patient.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8">
                <div>
                  <h4 className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-2 flex items-center gap-2">
                    <ClockIcon className="w-3 h-3" /> Timestamp
                  </h4>
                  <p className="font-bold text-[#101217]">{log.date}</p>
                  <p className="text-xs text-gray-400 font-medium">{log.time}</p>
                </div>
                <div>
                  <h4 className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-2 flex items-center gap-2">
                    <GlobeAltIcon className="w-3 h-3" /> Geolocation
                  </h4>
                  <p className="font-bold text-[#101217]">{log.location}</p>
                  <p className="text-xs text-gray-400 font-medium">IP: {log.ip}</p>
                </div>
              </div>
            </div>

            <div className="space-y-10">
              <div>
                <h3 className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] mb-4">
                  Device Verification
                </h3>
                <div className="flex items-center gap-4 p-6 border border-gray-100 rounded-3xl">
                  <div className="w-12 h-12 bg-[#EEF2FF] rounded-2xl flex items-center justify-center shadow-inner">
                    <DevicePhoneMobileIcon className="w-6 h-6 text-[#6183FF]" />
                  </div>
                  <div>
                    <p className="font-bold text-[#101217] text-sm">{log.device}</p>
                    <p className="text-[10px] font-black text-green-500 uppercase tracking-widest mt-1">
                      Encrypted Connection
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-red-50/50 rounded-3xl p-8 border border-red-100/50">
                <div className="flex items-center gap-3 mb-4">
                  <ShieldExclamationIcon className="w-6 h-6 text-red-500" />
                  <h3 className="text-sm font-black text-red-600 uppercase tracking-widest">
                    Security Controls
                  </h3>
                </div>
                <p className="text-xs text-red-700/60 font-medium mb-6 leading-relaxed">
                  If you do not recognize this activity, your account security might be compromised.
                  Revoking access will immediately invalidate all active sessions for this provider.
                </p>
                <button
                  onClick={handleRevoke}
                  disabled={isRevoked || revoking}
                  className="w-full bg-red-500 text-white font-bold py-4 rounded-2xl shadow-lg shadow-red-500/20 hover:bg-red-600 transition-all disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isRevoked ? 'Access Already Revoked' : revoking ? 'Revoking...' : 'Revoke Provider Access'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
