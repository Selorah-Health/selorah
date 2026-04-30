import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { StarIcon, ShieldCheckIcon, CreditCardIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import ProFeaturesModal from './ProFeaturesModal';

interface ProfileProps {
  user: any;
  avatarGradient: string;
}

export default function Profile({ user, avatarGradient }: ProfileProps) {
  const [showProFeatures, setShowProFeatures] = useState(false);
  const navigate = useNavigate();

  const proFeatures = [
    "Unlimited Emergency Contacts (Up to 10)",
    "Priority Medical Record Verification",
    "Ad-free Experience & Premium Themes",
    "Early Access to Research Rewards",
    "Secure Family Account Sharing",
    "Exclusive Wellness Insights AI"
  ];

  const isPro = user?.user_metadata?.is_pro || false;

  return (
    <div className="bg-white rounded-[32px] border border-gray-50 shadow-sm p-10 min-h-[500px] relative overflow-hidden">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h2 className="text-3xl font-bold text-[#101217] tracking-tight">Profile & Settings</h2>
          <p className="text-gray-400 font-medium">Manage your identity and account preferences.</p>
        </div>
      </div>

      <div className="flex items-center gap-8 mb-12 p-8 bg-gray-50 rounded-[32px] border border-gray-100">
        <div className="w-24 h-24 rounded-full flex items-center justify-center p-[3px] shadow-sm relative" style={{ backgroundImage: "url('/assets/custom-profile-icon-ring.png')", backgroundSize: 'cover', backgroundPosition: 'center' }}>
          <div className={`w-full h-full rounded-full ${avatarGradient}`}></div>
          {isPro && (
            <div className="absolute -bottom-1 -right-1 bg-[#DCE4FF] text-[#6183FF] text-[8px] font-black uppercase px-2 py-1 rounded-full border-2 border-white shadow-sm z-10">
              PRO
            </div>
          )}
        </div>
        <div className="flex-1">
          <h3 className="text-2xl font-bold text-[#101217]">{user?.user_metadata?.first_name || 'User'} {user?.user_metadata?.last_name || ''}</h3>
          <p className="text-gray-500 font-medium">{user?.email || 'use..ail@gmail.com'}</p>
          <div className="flex gap-2 mt-4">
            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${isPro ? 'bg-[#6183FF] text-white border-[#6183FF]' : 'bg-white text-gray-400 border-gray-200'}`}>
              {isPro ? 'Pro Member' : 'Free Account'}
            </span>
            {!isPro && (
              <button 
                onClick={() => setShowProFeatures(true)}
                className="px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-[#4262ff]/10 text-[#4262ff] hover:bg-[#4262ff]/20 transition-all"
              >
                Upgrade now
              </button>
            )}
          </div>
        </div>
      </div>

      {!isPro && (
        <div className="mb-10 bg-[#0A0B14] p-8 rounded-[28px] text-white relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#6183FF]/20 rounded-full blur-3xl -mr-32 -mt-32"></div>
          <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/10">
                <StarIcon className="w-8 h-8 text-[#6183FF]" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Go Pro for only ₦5,000/year</h3>
                <p className="text-white/50 font-medium text-sm">Join 5,000+ users enjoying premium healthcare benefits.</p>
              </div>
            </div>
            <button 
              onClick={() => setShowProFeatures(true)}
              className="w-full lg:w-auto bg-[#6183FF] text-white font-black uppercase tracking-widest text-[11px] px-10 py-4 rounded-xl hover:bg-[#4E6EEF] transition-all shadow-xl shadow-blue-500/20"
            >
              Unlock Pro Features
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div 
          onClick={() => navigate('/dashboard/security')}
          className="p-6 rounded-3xl border border-gray-100 hover:border-[#6183FF]/30 transition-all cursor-pointer group bg-white hover:shadow-xl hover:shadow-blue-500/5"
        >
          <ShieldCheckIcon className="w-6 h-6 text-gray-400 mb-3 group-hover:text-[#6183FF]" />
          <p className="font-bold text-[#101217]">Security</p>
          <p className="text-xs text-gray-400 font-medium">Passwords & MFA</p>
        </div>

        <div 
          onClick={() => navigate('/dashboard/billing')}
          className="p-6 rounded-3xl border border-gray-100 hover:border-[#6183FF]/30 transition-all cursor-pointer group bg-white hover:shadow-xl hover:shadow-blue-500/5"
        >
          <CreditCardIcon className="w-6 h-6 text-gray-400 mb-3 group-hover:text-[#6183FF]" />
          <p className="font-bold text-[#101217]">Billing</p>
          <p className="text-xs text-gray-400 font-medium">Plans & Invoices</p>
        </div>

        <div 
          onClick={() => navigate('/dashboard/family')}
          className="p-6 rounded-3xl border border-gray-100 hover:border-[#6183FF]/30 transition-all cursor-pointer group bg-white hover:shadow-xl hover:shadow-blue-500/5"
        >
          <UserGroupIcon className="w-6 h-6 text-gray-400 mb-3 group-hover:text-[#6183FF]" />
          <p className="font-bold text-[#101217]">Family</p>
          <p className="text-xs text-gray-400 font-medium">Manage Members</p>
        </div>
      </div>

      <ProFeaturesModal isOpen={showProFeatures} onClose={() => setShowProFeatures(false)} />
    </div>
  );
}
