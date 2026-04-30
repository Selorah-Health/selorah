import { useState } from 'react';
import { StarIcon, SparklesIcon } from '@heroicons/react/24/outline';
import ProFeaturesModal from '../components/dashboard/ProFeaturesModal';

export default function Notifications() {
  const [showProFeatures, setShowProFeatures] = useState(false);

  const proFeatures = [
    "Unlimited Emergency Contacts (Up to 10)",
    "Priority Medical Record Verification",
    "Ad-free Experience & Premium Themes",
    "Early Access to Research Rewards",
    "Secure Family Account Sharing",
    "Exclusive Wellness Insights AI"
  ];

  return (
    <div className="bg-white rounded-[32px] border border-gray-50 shadow-sm p-10 min-h-[500px] relative overflow-hidden">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-[#101217]">Notifications</h2>
          <p className="text-gray-500 font-medium">View recent system alerts and updates.</p>
        </div>
      </div>

      {/* Pro Upgrade Ad */}
      <div className="mb-10 bg-gradient-to-r from-[#6183FF] to-[#3672F8] p-8 rounded-[24px] text-white relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10 group-hover:scale-125 transition-transform duration-700"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4 text-center md:text-left">
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
              <StarIcon className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold">Unlock Selorah Pro</h3>
              <p className="text-white/80 font-medium text-sm">Experience the full power of your health data.</p>
            </div>
          </div>
          <button 
            onClick={() => setShowProFeatures(true)}
            className="bg-white text-[#6183FF] font-black uppercase tracking-widest text-[11px] px-8 py-3.5 rounded-xl hover:bg-[#F0F2FF] transition-all shadow-lg"
          >
            See Pro Features
          </button>
        </div>
      </div>
      
      <div className="space-y-4">
        <div className="p-5 rounded-[20px] bg-[#F0F2FF] border border-[#6183FF]/10 flex items-start gap-4">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shrink-0 shadow-sm">
            <SparklesIcon className="w-5 h-5 text-[#6183FF]" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-[#050038]">Welcome to Selorah!</h3>
            <p className="text-sm text-gray-500 mt-1 leading-relaxed">Your account has been successfully created. Complete your profile to unlock all features and start earning rewards.</p>
            <span className="text-[10px] font-black text-[#6183FF] uppercase tracking-widest mt-3 block">Just now</span>
          </div>
        </div>
      </div>

      <ProFeaturesModal isOpen={showProFeatures} onClose={() => setShowProFeatures(false)} />
    </div>
  );
}
