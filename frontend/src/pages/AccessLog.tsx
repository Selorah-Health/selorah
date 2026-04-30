import { useState, useEffect } from 'react';
import { ShieldExclamationIcon, ListBulletIcon, TrashIcon, InformationCircleIcon, NoSymbolIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';

export default function AccessLog() {
  const [logs] = useState([
    { id: 1, title: 'Reddington Hospital', action: 'viewed SNH Lab Result', time: '2hr ago', date: 'April 7, 2026', color: 'bg-[#22C55E]', status: 'Active' },
    { id: 2, title: 'St. Nicholas Hospital', action: 'gained access to medical history', time: 'Yesterday', date: 'April 6, 2026', color: 'bg-[#FACC15]', status: 'Active' },
    { id: 3, title: 'Igandon General Hospital', action: 'viewed YFB Vaccination', time: '2 days ago', date: 'April 5, 2026', color: 'bg-[#EF4444]', status: 'Active' },
    { id: 4, title: 'Dr. Adeyemi', action: 'added a new prescription', time: 'Last week', date: 'March 15, 2026', color: 'bg-[#3B82F6]', status: 'Fixed' },
  ]);

  const [revokedIds, setRevokedIds] = useState<number[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const saved = localStorage.getItem('selorah_revoked_logs');
    if (saved) {
      setRevokedIds(JSON.parse(saved));
    }
  }, []);

  const handleRevoke = (e: React.MouseEvent, id: number, title: string) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to REVOKE all access for ${title}? they will no longer be able to view your records.`)) {
      const newRevoked = [...revokedIds, id];
      setRevokedIds(newRevoked);
      localStorage.setItem('selorah_revoked_logs', JSON.stringify(newRevoked));
      alert(`Access for ${title} has been permanently revoked.`);
    }
  };

  const handleViewLog = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    navigate(`/dashboard/access-log/${id}`);
  };

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
        {logs.map((log) => {
          const isRevoked = revokedIds.includes(log.id);
          return (
            <div 
              key={log.id} 
              onClick={() => navigate(`/dashboard/access-log/${log.id}`)}
              className={`group flex flex-col md:flex-row items-start md:items-center gap-6 p-6 bg-white border rounded-3xl transition-all hover:shadow-lg hover:shadow-blue-500/5 cursor-pointer ${isRevoked ? 'border-red-100 bg-red-50/10' : 'border-gray-50 hover:border-[#6183FF]/30'}`}
            >
              <div className={`w-3 h-3 rounded-full shrink-0 border-2 border-white shadow-sm ${isRevoked ? 'bg-red-500' : log.color}`} title={isRevoked ? 'Revoked' : log.status}></div>
              
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <p className={`text-base font-bold transition-colors ${isRevoked ? 'text-gray-400' : 'text-[#101217] group-hover:text-[#6183FF]'}`}>{log.title}</p>
                  {isRevoked ? (
                    <span className="text-[9px] font-black uppercase tracking-widest bg-red-100 text-red-500 px-2 py-0.5 rounded border border-red-200">
                      Revoked
                    </span>
                  ) : (
                    <span className="text-[9px] font-black uppercase tracking-widest bg-gray-50 text-gray-400 px-2 py-0.5 rounded border border-gray-100">
                      {log.status}
                    </span>
                  )}
                </div>
                <p className={`text-sm font-medium ${isRevoked ? 'text-gray-300 line-through' : 'text-gray-500'}`}>{log.action}</p>
                <div className="flex items-center gap-4 mt-2">
                  <span className="text-[10px] text-gray-300 font-black uppercase tracking-tighter">{log.time}</span>
                  <span className="text-[10px] text-gray-300 font-black uppercase tracking-tighter">•</span>
                  <span className="text-[10px] text-gray-300 font-black uppercase tracking-tighter">{log.date}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto">
                <button 
                  onClick={(e) => handleViewLog(e, log.id)}
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-gray-50 text-[#101217] px-5 py-3 rounded-xl font-bold text-xs hover:bg-gray-100 transition-all"
                >
                  <ListBulletIcon className="w-4 h-4" />
                  View Log
                </button>
                {isRevoked ? (
                  <button 
                    disabled
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-gray-100 text-gray-300 px-5 py-3 rounded-xl font-bold text-xs cursor-not-allowed"
                  >
                    <NoSymbolIcon className="w-4 h-4" />
                    Revoked
                  </button>
                ) : (
                  <button 
                    onClick={(e) => handleRevoke(e, log.id, log.title)}
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-red-50 text-red-500 px-5 py-3 rounded-xl font-bold text-xs hover:bg-red-500 hover:text-white transition-all group/revoke"
                  >
                    <TrashIcon className="w-4 h-4" />
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
