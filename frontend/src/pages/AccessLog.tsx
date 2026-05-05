import { useState, useEffect } from 'react';
import { ShieldExclamationIcon, ListBulletIcon, TrashIcon, NoSymbolIcon, DevicePhoneMobileIcon, ComputerDesktopIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';

export default function AccessLog() {
  const [staticLogs] = useState([
    { id: 1, title: 'Reddington Hospital', action: 'viewed SNH Lab Result', time: '2hr ago', date: 'April 7, 2026', color: 'bg-[#22C55E]', status: 'Active', device: 'Hospital Workstation', verified: true },
    { id: 2, title: 'St. Nicholas Hospital', action: 'gained access to medical history', time: 'Yesterday', date: 'April 6, 2026', color: 'bg-[#FACC15]', status: 'Active', device: 'Hospital Workstation', verified: true },
    { id: 3, title: 'Igando General Hospital', action: 'viewed YFB Vaccination', time: '2 days ago', date: 'April 5, 2026', color: 'bg-[#EF4444]', status: 'Active', device: 'Hospital Workstation', verified: true },
  ]);

  const [dynamicLogs, setDynamicLogs] = useState<any[]>([]);
  const [revokedIds, setRevokedIds] = useState<string[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const savedRevoked = localStorage.getItem('selorah_revoked_logs');
    if (savedRevoked) {
      setRevokedIds(JSON.parse(savedRevoked));
    }

    const savedLogs = localStorage.getItem('selorah_access_log');
    if (savedLogs) {
      setDynamicLogs(JSON.parse(savedLogs));
    }
  }, []);

  const handleRevoke = (e: React.MouseEvent, id: string, title: string) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to REVOKE all access for ${title}?`)) {
      const newRevoked = [...revokedIds, id];
      setRevokedIds(newRevoked);
      localStorage.setItem('selorah_revoked_logs', JSON.stringify(newRevoked));
      alert(`Access for ${title} has been permanently revoked.`);
    }
  };

  const allLogs = [...dynamicLogs.map(l => ({
    ...l,
    title: l.verified ? l.title : 'Unverified Device',
    action: 'viewed medical history via shared link',
    time: 'Just now',
    date: new Date(l.timestamp).toLocaleDateString(),
    color: 'bg-orange-500'
  })), ...staticLogs];

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
        {allLogs.map((log, index) => {
          const logId = log.id.toString();
          const isRevoked = revokedIds.includes(logId);
          const isMobile = log.device?.toLowerCase().includes('iphone') || log.device?.toLowerCase().includes('android');

          return (
            <div 
              key={index} 
              className={`group flex flex-col md:flex-row items-start md:items-center gap-6 p-6 bg-white border rounded-3xl transition-all hover:shadow-lg hover:shadow-blue-500/5 ${isRevoked ? 'border-red-100 bg-red-50/10 opacity-60' : 'border-gray-50 hover:border-[#6183FF]/30'}`}
            >
              <div className={`w-12 h-12 rounded-2xl shrink-0 flex items-center justify-center ${log.verified ? 'bg-blue-50 text-blue-500' : 'bg-orange-50 text-orange-500'}`}>
                {isMobile ? <DevicePhoneMobileIcon className="w-6 h-6" /> : <ComputerDesktopIcon className="w-6 h-6" />}
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <p className={`text-base font-bold ${isRevoked ? 'text-gray-400' : 'text-[#101217]'}`}>
                    {log.title}
                  </p>
                  {!log.verified && (
                    <span className="text-[9px] font-black uppercase tracking-widest bg-orange-100 text-orange-600 px-2 py-0.5 rounded border border-orange-200">
                      Unverified
                    </span>
                  )}
                  {isRevoked && (
                    <span className="text-[9px] font-black uppercase tracking-widest bg-red-100 text-red-500 px-2 py-0.5 rounded border border-red-200">
                      Revoked
                    </span>
                  )}
                </div>
                <p className={`text-sm font-medium ${isRevoked ? 'text-gray-300' : 'text-gray-500'}`}>
                  {log.action} <span className="text-gray-300 mx-1">via</span> <span className="font-bold text-gray-700">{log.device}</span>
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
                    onClick={(e) => handleRevoke(e, logId, log.title)}
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
