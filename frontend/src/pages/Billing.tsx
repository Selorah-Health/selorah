import { useState, useEffect } from 'react';
import { CreditCardIcon, ArrowLeftIcon, CheckBadgeIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';

export default function Billing() {
  const navigate = useNavigate();
  const [isPro, setIsPro] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('selorah_user');
    if (saved) {
      setIsPro(JSON.parse(saved).is_pro);
    }
  }, []);

  const togglePlan = () => {
    const saved = localStorage.getItem('selorah_user');
    if (saved) {
      const user = JSON.parse(saved);
      user.is_pro = !user.is_pro;
      localStorage.setItem('selorah_user', JSON.stringify(user));
      setIsPro(user.is_pro);
      window.dispatchEvent(new Event('storage')); // Notify other components
      alert(`Plan updated to ${user.is_pro ? 'PRO' : 'FREE'}! This change is now active across your dashboard.`);
    }
  };

  return (
    <div className="space-y-8 font-sora">
      <button onClick={() => navigate('/dashboard/profile')} className="flex items-center gap-2 text-gray-400 hover:text-[#6183FF] transition-all group">
        <ArrowLeftIcon className="w-4 h-4" />
        <span className="font-bold text-sm">Back to Profile</span>
      </button>

      <div className="bg-white rounded-[40px] border border-gray-50 shadow-xl shadow-blue-500/5 overflow-hidden">
        <div className="p-10 border-b border-gray-50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center">
              <CreditCardIcon className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-[#101217] tracking-tight">Billing & Subscription</h2>
              <p className="text-gray-400 font-medium text-sm">Manage your plan, payment methods, and billing history.</p>
            </div>
          </div>
        </div>

        <div className="p-10 md:p-14 space-y-12">
          {/* Current Plan Section */}
          <section>
            <div className="bg-[#101217] rounded-[32px] p-10 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-32 -mt-32"></div>
              <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                <div>
                  <span className="bg-white/10 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full mb-4 inline-block">Current Plan</span>
                  <h3 className="text-4xl font-black mb-2">{isPro ? 'Selorah PRO' : 'Selorah Basic'}</h3>
                  <p className="text-white/60 font-medium">{isPro ? 'Unlimited emergency access & priority support' : 'Limited records and emergency sharing'}</p>
                </div>
                <button 
                  onClick={togglePlan}
                  className="bg-white text-[#101217] font-bold py-4 px-10 rounded-2xl hover:bg-gray-100 transition-all shadow-xl shadow-white/5"
                >
                  {isPro ? 'Downgrade Plan' : 'Upgrade to PRO'}
                </button>
              </div>
            </div>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Payment Method */}
            <div className="p-8 border border-gray-100 rounded-[32px]">
              <h4 className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-6">Payment Method</h4>
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                  <CreditCardIcon className="w-6 h-6 text-gray-400" />
                </div>
                <div>
                  <p className="font-bold text-[#101217] text-sm">•••• •••• •••• 4242</p>
                  <p className="text-[10px] text-gray-400 font-bold uppercase">Expires 12/28</p>
                </div>
              </div>
            </div>

            {/* Invoices */}
            <div className="p-8 border border-gray-100 rounded-[32px]">
              <h4 className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-6">Recent Invoices</h4>
              <div className="space-y-3">
                {[
                  { date: 'Apr 1, 2026', amount: '₦5,000', status: 'Paid' },
                  { date: 'Mar 1, 2026', amount: '₦5,000', status: 'Paid' },
                ].map((inv, i) => (
                  <div key={i} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-all cursor-pointer group">
                    <div className="flex items-center gap-3">
                      <DocumentTextIcon className="w-5 h-5 text-gray-300 group-hover:text-[#6183FF]" />
                      <span className="text-sm font-bold text-[#101217]">{inv.date}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-bold text-gray-500">{inv.amount}</span>
                      <CheckBadgeIcon className="w-5 h-5 text-green-500" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
