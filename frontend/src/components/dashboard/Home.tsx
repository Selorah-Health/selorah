import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import { ChevronRightIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';

interface Record {
  id: string;
  name: string;
  date: string;
  status: string;
  icon: string;
}

interface HomeProps {
  user: any;
  records: Record[];
  getFormattedDate: () => string;
}

export default function Home({ user, records, getFormattedDate }: HomeProps) {
  const navigate = useNavigate();

  return (
    <>
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-3">
          <h2 className="text-3xl font-bold text-[#101217] tracking-tight">Welcome back, {user?.user_metadata?.first_name || 'User'}</h2>
          <img src="/assets/custom-heart.png" alt="H" className="w-8 h-8 object-contain" />
        </div>
        <p className="text-gray-400 font-medium text-base">{getFormattedDate()}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-[#6183FF] text-white p-6 rounded-[24px] shadow-sm flex flex-col justify-between min-h-[140px] cursor-pointer hover:opacity-90 transition-opacity">
          <div><p className="text-[10px] font-bold opacity-80 mb-1 uppercase tracking-wider">Health Score</p><span className="text-[36px] font-bold leading-none">60/100</span></div>
          <div className="flex items-end justify-between">
            <p className="text-[11px] font-medium">↑ +5 this month</p>
            <img src="/assets/custom-heart.png" alt="I" className="w-8 h-8 brightness-0 invert opacity-60" />
          </div>
        </div>
        <div onClick={() => navigate('/dashboard/records')} className="bg-white p-6 rounded-[24px] border border-gray-50 shadow-sm flex flex-col justify-between min-h-[140px] cursor-pointer hover:border-[#6183FF]/30 transition-colors">
          <div><p className="text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-wider">Total Records</p><span className="text-[36px] font-bold text-[#101217] leading-none">12</span></div>
          <div className="flex items-end justify-between">
            <p className="text-[11px] font-bold text-gray-400">8 verified • 4 self-reported</p>
            <img src="/assets/total-records-card-icon.png" alt="I" className="w-8 h-8" />
          </div>
        </div>
        <div onClick={() => navigate('/dashboard/earnings')} className="bg-white p-6 rounded-[24px] border border-gray-50 shadow-sm flex flex-col justify-between min-h-[140px] cursor-pointer hover:border-[#6183FF]/30 transition-colors">
          <div><p className="text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-wider">This Month Earnings</p><span className="text-[36px] font-bold text-[#101217] leading-none">₦3,000</span></div>
          <div className="flex items-end justify-between">
            <p className="text-[11px] font-bold text-gray-400">₦10,000 projected</p>
            <img src="/assets/this-month-earnings-card-icon.png" alt="I" className="w-8 h-8" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-[24px] border border-gray-50 shadow-sm flex flex-col justify-between min-h-[140px] cursor-pointer hover:border-[#6183FF]/30 transition-colors">
          <div><p className="text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-wider">Active Access Grants</p><span className="text-[36px] font-bold text-[#101217] leading-none">2</span></div>
          <div className="flex items-end justify-between">
            <p className="text-[11px] font-bold text-gray-400">1 expiring soon</p>
            <img src="/assets/active-access-grants-card-icon.png" alt="I" className="w-8 h-8" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-7 bg-white rounded-[32px] border border-gray-50 shadow-sm p-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-[#101217]">Recent Records</h3>
            <button onClick={() => navigate('/dashboard/records')} className="text-[#6183FF] font-bold text-sm flex items-center gap-1 group hover:underline">
              See all <ChevronRightIcon className="w-3 h-3 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
          <div className="divide-y divide-gray-50">
            {records.map((record) => (
              <div 
                key={record.id} 
                onClick={() => navigate(`/dashboard/records/${record.id}`)}
                className="flex items-center justify-between py-4 first:pt-0 last:pb-0 hover:bg-gray-50 px-2 -mx-2 rounded-xl transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-[#F8F9FE] rounded-xl flex items-center justify-center p-1.5 group-hover:bg-white transition-colors shadow-sm border border-transparent group-hover:border-gray-100">
                    <img src={record.icon} alt="R" className="w-full h-full object-contain" />
                  </div>
                  <div>
                    <p className="font-bold text-[#101217] text-base group-hover:text-[#6183FF] transition-colors">{record.name}</p>
                    <p className="text-[12px] text-gray-400 font-medium">{record.date}</p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${record.status === 'Shared Once' ? 'bg-[#EEF2FF] text-[#6183FF]' : 'bg-[#6183FF] text-white'}`}>{record.status}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="col-span-5 space-y-6">
          <div className="bg-white rounded-[32px] border border-gray-50 shadow-sm p-8">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-bold text-[#101217]">Access Log</h3>
              <button onClick={() => navigate('/dashboard/access-log')} className="text-[#6183FF] font-bold text-sm flex items-center gap-1 hover:underline">
                View Full Audit <ChevronRightIcon className="w-3 h-3" />
              </button>
            </div>
            <div className="space-y-6">
              {[
                { title: 'Reddington Hospital', action: 'viewed SNH Lab Result', time: '2hr ago', color: 'bg-[#22C55E]' },
                { title: 'St. Nicholas Hospital', action: 'gained access to your medical history', time: 'Yesterday', color: 'bg-[#FACC15]' },
                { title: 'Igandon General Hospital', action: 'viewed YFB Vaccination', time: '2 days ago', color: 'bg-[#EF4444]' },
              ].map((log, i) => (
                <div key={i} className="flex items-start gap-3"><div className={`w-2.5 h-2.5 rounded-full ${log.color} mt-1 shrink-0 border border-white shadow-sm`}></div><div className="flex-1"><p className="text-[13px] font-medium text-[#101217] leading-tight"><span className="font-bold">{log.title}</span> {log.action}</p></div><span className="text-[10px] text-gray-400 font-black uppercase whitespace-nowrap pt-0.5">{log.time}</span></div>
              ))}
            </div>
          </div>
          <div onClick={() => navigate('/dashboard/earnings')} className="bg-white rounded-[32px] border border-gray-50 shadow-sm p-8 cursor-pointer hover:border-[#6183FF]/30 transition-colors">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-[#101217]">Earnings (Last 6 months)</h3>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-[#6183FF]">
                  <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            
            <div className="h-[180px] w-full -ml-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[
                  { name: 'Nov', value: 3500 },
                  { name: 'Dec', value: 6800 },
                  { name: 'Jan', value: 8900 },
                  { name: 'Feb', value: 5200 },
                  { name: 'Mar', value: 11200 },
                  { name: 'Apr', value: 4100, active: true },
                ]} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis 
                    dataKey="name" 
                    axisLine={{ stroke: '#F3F4F6' }}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: '#9CA3AF', fontWeight: 'bold' }}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={{ stroke: '#F3F4F6' }}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: '#9CA3AF', fontWeight: 'bold' }}
                    tickFormatter={(value) => value >= 1000 ? `${value / 1000}k` : value}
                  />
                  <Tooltip 
                    cursor={{ fill: 'transparent' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={40}>
                    {
                      [
                        { name: 'Nov', value: 3500 },
                        { name: 'Dec', value: 6800 },
                        { name: 'Jan', value: 8900 },
                        { name: 'Feb', value: 5200 },
                        { name: 'Mar', value: 11200 },
                        { name: 'Apr', value: 4100, active: true },
                      ].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.active ? '#6183FF' : '#EEF2FF'} />
                      ))
                    }
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            <div className="text-center mt-2">
              <p className="text-[9px] text-gray-300 font-bold uppercase">Nov 2025 - Apr 2026</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
