import { useState, useEffect } from 'react';
import { ShieldExclamationIcon, DevicePhoneMobileIcon, ComputerDesktopIcon, QrCodeIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import { createClient } from '../lib/supabase/client';
import { useToast } from '../contexts/ToastContext';

export default function AccessLog() {
  const { success: toastSuccess, error: toastError } = useToast();
  const [staticLogs] = useState([
    { id: 1, title: 'Reddington Hospital', action: 'viewed SNH Lab Result', time: '2hr ago', date: 'April 7, 2026', color: 'bg-[#22C55E]', status: 'Active', device: 'Hospital Workstation', verified: true },
    { id: 2, title: 'St. Nicholas Hospital', action: 'gained access to medical history', time: 'Yesterday', date: 'April 6, 2026', color: 'bg-[#FACC15]', status: 'Active', device: 'Hospital Workstation', verified: true },
    { id: 3, title: 'Igando General Hospital', action: 'viewed YFB Vaccination', time: '2 days ago', date: 'April 5, 2026', color: 'bg-[#EF4444]', status: 'Active', device: 'Hospital Workstation', verified: true },
  ]);

  const [dynamicLogs, setDynamicLogs] = useState<any[]>([]);
  const [dbLogs, setDbLogs] = useState<any[]>([]);
  const [sharedLinkLogs, setSharedLinkLogs] = useState<any[]>([]);
  const [revokedIds, setRevokedIds] = useState<string[]>([]);
  const navigate = useNavigate();
  const supabase = createClient();

  useEffect(() => {
    const fetchAll = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Fetch access_logs (provider visits)
      const { data: accessData, error: accessError } = await supabase
        .from('access_logs')
        .select(`
          id,
          action,
          created_at,
          profiles:provider_id(first_name, last_name, organization_name)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (accessData && !accessError) {
        const formatted = accessData.map((log: any) => {
          let providerTitle = 'Verified Healthcare Provider';
          if (log.profiles) {
            const profile = Array.isArray(log.profiles) ? log.profiles[0] : log.profiles;
            if (profile) {
              providerTitle = profile.organization_name || `${profile.first_name} ${profile.last_name}`;
            }
          }

          return {
            id: log.id,
            title: providerTitle,
            action: log.action,
            time: new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            date: new Date(log.created_at).toLocaleDateString(),
            color: 'bg-[#6183FF]',
            status: 'Active',
            device: 'Hospital Portal',
            verified: true,
          };
        });
        setDbLogs(formatted);
      }

      // 2. Fetch shared_links (active + revoked QR grants)
      const { data: links, error: linksError } = await supabase
        .from('shared_links')
        .select('id, token, is_active, expires_at, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (links && !linksError) {
        const now = Date.now();
        const formattedLinks = links.map((link: any) => {
          const expired = new Date(link.expires_at).getTime() < now;
          const isLive = link.is_active && !expired;
          return {
            id: `link-${link.id}`,
            token: link.token,
            title: isLive ? 'Active QR Access Link' : 'QR Access Link',
            action: isLive
              ? 'live shared link — anyone with the code can view records'
              : link.is_active
                ? 'shared link expired'
                : 'shared link was revoked',
            time: new Date(link.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            date: new Date(link.created_at).toLocaleDateString(),
            color: isLive ? 'bg-green-500' : 'bg-red-400',
            status: isLive ? 'Active' : 'Revoked',
            device: 'QR Code',
            verified: false,
            isRevokedLink: !isLive,
            linkToken: link.token,
          };
        });
        setSharedLinkLogs(formattedLinks);

        // Mark revoked ones in revokedIds so the badge/UI stays consistent
        const revokedFromDb = formattedLinks
          .filter((l: any) => l.isRevokedLink)
          .map((l: any) => l.id);
        setRevokedIds((prev) => {
          const merged = Array.from(new Set([...prev, ...revokedFromDb]));
          localStorage.setItem('selorah_revoked_logs', JSON.stringify(merged));
          return merged;
        });
      }
    };

    fetchAll();

    // Local storage logs (visits / demo revoke entries)
    const savedRevoked = localStorage.getItem('selorah_revoked_logs');
    if (savedRevoked) {
      try {
        setRevokedIds(JSON.parse(savedRevoked));
      } catch (e) {}
    }

    const savedLogs = localStorage.getItem('selorah_access_log');
    if (savedLogs) {
      try {
        setDynamicLogs(JSON.parse(savedLogs));
      } catch (e) {}
    }
  }, []);

  const handleRevoke = async (e: React.MouseEvent, id: string, title: string, linkToken?: string) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to REVOKE access for ${title}?`)) return;

    const newRevoked = [...revokedIds, id];
    setRevokedIds(newRevoked);
    localStorage.setItem('selorah_revoked_logs', JSON.stringify(newRevoked));

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      if (linkToken) {
        // Revoke this specific QR token
        await supabase
          .from('shared_links')
          .update({ is_active: false })
          .eq('token', linkToken);
      } else if (String(id).startsWith('link-')) {
        // Fallback: revoke by shared_links id
        const realId = String(id).replace('link-', '');
        await supabase
          .from('shared_links')
          .update({ is_active: false })
          .eq('id', realId);
      } else {
        // Generic log revoke: deactivate all active tokens for safety
        await supabase
          .from('shared_links')
          .update({ is_active: false })
          .eq('user_id', user.id)
          .eq('is_active', true);
      }
    }

    // Refresh shared link list so Active → Revoked updates immediately
    setSharedLinkLogs((prev) =>
      prev.map((l) =>
        l.id === id
          ? {
              ...l,
              title: 'QR Access Link',
              action: 'shared link was revoked',
              status: 'Revoked',
              color: 'bg-red-400',
              isRevokedLink: true,
            }
          : l
      )
    );

    toastSuccess(`Access for ${title} has been permanently revoked.`);
  };

  const localDynamicFormatted = dynamicLogs.map((l) => ({
    ...l,
    title: l.verified ? l.title : (String(l.action || '').toLowerCase().includes('revoked') ? 'Shared Link' : 'Unverified Device'),
    action: l.action || 'viewed medical history via shared link',
    time: l.timestamp
      ? new Date(l.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : 'Just now',
    date: l.timestamp ? new Date(l.timestamp).toLocaleDateString() : new Date().toLocaleDateString(),
    color: 'bg-orange-500',
    device: l.device || 'Unknown Device',
    verified: !!l.verified,
  }));

  // Shared links first (live ones at top), then real DB logs, local demo logs, static
  const allLogs = [...sharedLinkLogs, ...dbLogs, ...localDynamicFormatted, ...staticLogs];

  return (
    <div className="bg-white rounded-[40px] border border-gray-50 shadow-xl shadow-blue-500/5 p-10 min-h-[500px] font-sora">
      <div className="flex items-center justify-between mb-10 pb-8 border-b border-gray-50">
        <div>
          <h2 className="text-3xl font-black text-[#101217] tracking-tight">Access Audit Log</h2>
          <p className="text-gray-400 font-medium text-sm mt-1">Monitor and control who has interacted with your health data.</p>
        </div>
        <div className="bg-[#EEF2FF] p-3 rounded-2xl">
          <ShieldExclamationIcon className="w-8 h-8 text-[#6183FF]" />
        </div>
      </div>

      <div className="space-y-4">
        {allLogs.length === 0 && (
          <p className="text-gray-400 text-center py-12">No access activity yet.</p>
        )}

        {allLogs.map((log, index) => {
          const logId = log.id.toString();
          const isRevoked =
            revokedIds.includes(logId) ||
            log.isRevokedLink === true ||
            (log.action && String(log.action).toLowerCase().includes('revoked')) ||
            (log.action && String(log.action).toLowerCase().includes('expired'));
          const isMobile =
            log.device?.toLowerCase().includes('iphone') ||
            log.device?.toLowerCase().includes('android');
          const isQr = log.device?.toLowerCase().includes('qr');

          return (
            <div
              key={`${logId}-${index}`}
              className={`group flex flex-col md:flex-row items-start md:items-center gap-6 p-6 bg-white border rounded-3xl transition-all hover:shadow-lg hover:shadow-blue-500/5 ${
                isRevoked
                  ? 'border-red-100 bg-red-50/10 opacity-60'
                  : 'border-gray-50 hover:border-[#6183FF]/30'
              }`}
            >
              <div
                className={`w-12 h-12 rounded-2xl shrink-0 flex items-center justify-center ${
                  log.verified ? 'bg-blue-50 text-blue-500' : isQr ? 'bg-indigo-50 text-indigo-500' : 'bg-orange-50 text-orange-500'
                }`}
              >
                {isQr ? (
                  <QrCodeIcon className="w-6 h-6" />
                ) : isMobile ? (
                  <DevicePhoneMobileIcon className="w-6 h-6" />
                ) : (
                  <ComputerDesktopIcon className="w-6 h-6" />
                )}
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1 flex-wrap">
                  <p className={`text-base font-bold ${isRevoked ? 'text-gray-400' : 'text-[#101217]'}`}>
                    {log.title}
                  </p>
                  {!log.verified && !isRevoked && (
                    <span className="text-[9px] font-black uppercase tracking-widest bg-orange-100 text-orange-600 px-2 py-0.5 rounded border border-orange-200">
                      Unverified
                    </span>
                  )}
                  {!isRevoked && log.status === 'Active' && (
                    <span className="text-[9px] font-black uppercase tracking-widest bg-green-100 text-green-600 px-2 py-0.5 rounded border border-green-200">
                      Live
                    </span>
                  )}
                  {isRevoked && (
                    <span className="text-[9px] font-black uppercase tracking-widest bg-red-100 text-red-500 px-2 py-0.5 rounded border border-red-200">
                      Revoked
                    </span>
                  )}
                </div>
                <p className={`text-sm font-medium ${isRevoked ? 'text-gray-300' : 'text-gray-500'}`}>
                  {log.action}{' '}
                  <span className="text-gray-300 mx-1">via</span>{' '}
                  <span className="font-bold text-gray-700">{log.device}</span>
                </p>
                <div className="flex items-center gap-4 mt-2">
                  <span className="text-[10px] text-gray-400 font-black uppercase tracking-tighter">{log.time}</span>
                  <span className="text-[10px] text-gray-300 font-black uppercase tracking-tighter">•</span>
                  <span className="text-[10px] text-gray-400 font-black uppercase tracking-tighter">{log.date}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto">
                <button
                  onClick={() => navigate(`/dashboard/access-log/${logId}`)}
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-gray-50 text-[#101217] px-5 py-3 rounded-xl font-bold text-xs hover:bg-gray-100 transition-all"
                >
                  Details
                </button>
                {!isRevoked && (
                  <button
                    onClick={(e) => handleRevoke(e, logId, log.title, log.linkToken)}
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-red-50 text-red-500 px-5 py-3 rounded-xl font-bold text-xs hover:bg-red-500 hover:text-white transition-all"
                  >
                    Revoke
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
