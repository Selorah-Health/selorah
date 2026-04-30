import { BeakerIcon, ChartBarIcon, CurrencyDollarIcon, SparklesIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

export default function Research() {
  const studies = [
    { id: 1, title: 'Cardiovascular Health Study', provider: 'Lagos University Teaching Hospital', reward: '₦15,000', eligibility: '95%', duration: '4 weeks', tag: 'High Match' },
    { id: 2, title: 'Type 2 Diabetes Research', provider: 'Havana Specialist Hospital', reward: '₦25,000', eligibility: '80%', duration: '3 months', tag: 'New' },
    { id: 3, title: 'Sleep Pattern Analysis', provider: 'Selorah Wellness Center', reward: '₦5,000', eligibility: '100%', duration: '1 week', tag: 'Fast Pay' },
  ];

  return (
    <div className="space-y-10 font-sora">
      <div className="flex flex-col gap-1">
        <h2 className="text-3xl font-black text-[#101217] tracking-tight">Clinical Research</h2>
        <p className="text-gray-400 font-medium text-base">Contribute to medical science and earn rewards for your data.</p>
      </div>

      {/* Research Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Eligibility Score', value: '92%', icon: SparklesIcon, color: 'text-purple-500', bg: 'bg-purple-50' },
          { label: 'Active Studies', value: '02', icon: BeakerIcon, color: 'text-blue-500', bg: 'bg-blue-50' },
          { label: 'Total Rewards', value: '₦42,500', icon: CurrencyDollarIcon, color: 'text-green-500', bg: 'bg-green-50' },
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

      {/* Available Studies */}
      <div className="bg-white rounded-[40px] border border-gray-50 shadow-sm p-6 md:p-10">
        <div className="flex items-center justify-between mb-10">
          <h3 className="text-xl font-bold text-[#101217]">Recommended for You</h3>
          <button className="text-[#6183FF] font-bold text-sm flex items-center gap-2 hover:underline">
            Browse All <ChevronRightIcon className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-6">
          {studies.map((study) => (
            <div key={study.id} className="group p-6 bg-gray-50/50 border border-transparent hover:border-[#6183FF]/20 rounded-3xl transition-all cursor-pointer">
              <div className="flex flex-col lg:flex-row justify-between gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="bg-[#6183FF] text-white text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded">
                      {study.tag}
                    </span>
                    <span className="text-[10px] font-bold text-gray-400 uppercase">{study.provider}</span>
                  </div>
                  <h4 className="text-lg font-bold text-[#101217] mb-2 group-hover:text-[#6183FF] transition-colors">{study.title}</h4>
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                      <span className="text-xs font-bold text-gray-500">{study.eligibility} Eligible</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <ChartBarIcon className="w-4 h-4 text-gray-400" />
                      <span className="text-xs font-bold text-gray-500">{study.duration}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between lg:justify-end gap-8">
                  <div className="text-right">
                    <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-1">Potential Reward</p>
                    <p className="text-xl font-black text-[#101217]">{study.reward}</p>
                  </div>
                  <button className="bg-white border border-gray-100 text-[#6183FF] font-bold py-3 px-8 rounded-2xl shadow-sm hover:bg-[#6183FF] hover:text-white transition-all">
                    Apply
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
