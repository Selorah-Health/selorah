import { WalletIcon, ArrowUpRightIcon, BanknotesIcon, ClockIcon } from '@heroicons/react/24/outline';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, CartesianGrid } from 'recharts';

export default function Earnings() {
  const data = [
    { name: 'Nov', value: 3500 },
    { name: 'Dec', value: 6800 },
    { name: 'Jan', value: 8900 },
    { name: 'Feb', value: 5200 },
    { name: 'Mar', value: 11200 },
    { name: 'Apr', value: 4100, active: true },
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#101217] text-white text-xs font-bold px-3 py-2 rounded-lg shadow-xl">
          <p className="mb-1 text-gray-400">{label} 2025/2026</p>
          <p className="text-[14px]">₦{payload[0].value.toLocaleString()}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-10 font-sora">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-3xl font-black text-[#101217] tracking-tight">Financial Rewards</h2>
          <p className="text-gray-400 font-medium text-base">Monitor and withdraw your data participation earnings.</p>
        </div>
        <button className="bg-[#6183FF] text-white font-bold py-4 px-8 rounded-2xl shadow-xl shadow-blue-500/20 hover:bg-[#4E6EEF] transition-all flex items-center gap-2">
          Withdraw Funds <ArrowUpRightIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Earnings Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Available Balance', value: '₦12,450', icon: BanknotesIcon, color: 'text-green-500', bg: 'bg-green-50' },
          { label: 'Pending Clearance', value: '₦8,200', icon: ClockIcon, color: 'text-orange-500', bg: 'bg-orange-50' },
          { label: 'Lifetime Earnings', value: '₦156,000', icon: WalletIcon, color: 'text-blue-500', bg: 'bg-blue-50' },
        ].map((card, i) => (
          <div key={i} className="bg-white p-8 rounded-[32px] border border-gray-50 shadow-xl shadow-blue-500/5 hover:border-[#6183FF]/30 transition-all group">
            <div className={`w-12 h-12 ${card.bg} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
              <card.icon className={`w-6 h-6 ${card.color}`} />
            </div>
            <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest mb-1">{card.label}</p>
            <p className="text-3xl font-black text-[#101217]">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-[40px] border border-gray-50 shadow-sm p-6 md:p-10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 sm:mb-12 gap-4">
          <div className="flex items-center gap-2">
            <h3 className="text-xl md:text-2xl font-bold text-[#101217]">Earnings (Last 6 months)</h3>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 md:w-6 md:h-6 text-[#6183FF]">
              <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#6183FF]"></div>
              <span className="text-xs font-bold text-gray-500 uppercase">Actual</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#6183FF]/10"></div>
              <span className="text-xs font-bold text-gray-300 uppercase">Projected</span>
            </div>
          </div>
        </div>

        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 5 }} barSize={60}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
              <XAxis 
                dataKey="name" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#9CA3AF', fontWeight: 'bold' }}
                dy={15}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#9CA3AF', fontWeight: 'bold' }}
                tickFormatter={(value) => value >= 1000 ? `${value / 1000}k` : value}
                dx={-10}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
              <Bar dataKey="value" radius={[12, 12, 0, 0]}>
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.active ? '#6183FF' : '#EEF2FF'} 
                    className="transition-all duration-300 hover:opacity-80 cursor-pointer"
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        <div className="text-center mt-10">
          <p className="text-xs text-gray-300 font-bold uppercase tracking-widest">Nov 2025 - Apr 2026</p>
        </div>
      </div>
    </div>
  );
}
