import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { StarIcon, ShieldCheckIcon, CreditCardIcon, UserGroupIcon, IdentificationIcon } from '@heroicons/react/24/outline';
import { createClient } from '../../lib/supabase/client';
import { isValidNin, writeLocalSession, readLocalSession } from '../../lib/auth/session';
import ProFeaturesModal from './ProFeaturesModal';

interface ProfileProps {
  user: any;
  avatarGradient: string;
}

export default function Profile({ user, avatarGradient }: ProfileProps) {
  const [showProFeatures, setShowProFeatures] = useState(false);
  const [nin, setNin] = useState('');
  const [ninSaving, setNinSaving] = useState(false);
  const [ninMsg, setNinMsg] = useState<string | null>(null);
  const navigate = useNavigate();
  const supabase = createClient();

  useEffect(() => {
    const local = readLocalSession();
    if (local?.nin) setNin(local.nin);
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('profiles').select('nin').eq('id', user.id).maybeSingle();
      if ((data as any)?.nin) setNin((data as any).nin);
    })();
  }, []);

  const saveNin = async () => {
    setNinMsg(null);
    if (nin && !isValidNin(nin)) {
      setNinMsg('NIN must be exactly 11 digits.');
      return;
    }
    setNinSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setNinMsg('Please log in to save your NIN.');
        return;
      }
      const { error } = await supabase.from('profiles').update({ nin: nin || null } as any).eq('id', user.id);
      if (error) throw error;
      writeLocalSession({ nin });
      setNinMsg('NIN saved. You can use it to log in.');
    } catch (e: any) {
      setNinMsg(e.message || 'Failed to save NIN.');
    } finally {
      setNinSaving(false);
    }
  };

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

      <div className="mb-10 p-8 bg-gray-50 rounded-[28px] border border-gray-100">
        <div className="flex items-center gap-3 mb-4">
          <IdentificationIcon className="w-6 h-6 text-[#6183FF]" />
          <h3 className="text-lg font-bold text-[#101217]">National Identification Number (NIN)</h3>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          Required for hospital lookup and optional login. 11 digits. You can add this if you skipped it during onboarding.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            inputMode="numeric"
            maxLength={11}
            value={nin}
            onChange={(e) => setNin(e.target.value.replace(/\D/g, '').slice(0, 11))}
            placeholder="Enter 11-digit NIN"
            className="flex-1 bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-[#6183FF]"
          />
          <button
            type="button"
            onClick={saveNin}
            disabled={ninSaving}
            className="bg-[#6183FF] text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-[#4E6EEF] disabled:opacity-50"
          >
            {ninSaving ? 'Saving…' : 'Save NIN'}
          </button>
        </div>
        {ninMsg && <p className="text-sm mt-3 text-gray-600">{ninMsg}</p>}
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
