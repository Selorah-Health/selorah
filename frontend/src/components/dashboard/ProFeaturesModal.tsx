import { StarIcon, XMarkIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

interface ProFeaturesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProFeaturesModal({ isOpen, onClose }: ProFeaturesModalProps) {
  if (!isOpen) return null;

  const proFeatures = [
    "Unlimited Emergency Contacts (Up to 10)",
    "Priority Medical Record Verification",
    "Ad-free Experience & Premium Themes",
    "Early Access to Research Rewards",
    "Secure Family Account Sharing",
    "Exclusive Wellness Insights AI"
  ];

  return (
    <div className="fixed inset-0 bg-[#0A0B14]/90 backdrop-blur-md z-[100] flex items-center justify-center p-6">
      <div className="bg-white w-full max-w-md rounded-[40px] p-10 animate-in zoom-in-95 duration-200 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#6183FF] to-[#3672F8]"></div>
        <div className="flex justify-between items-center mb-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-[#EEF2FF] rounded-2xl flex items-center justify-center shadow-inner">
              <StarIcon className="w-7 h-7 text-[#6183FF]" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-[#101217]">Selorah Pro</h3>
              <p className="text-[10px] font-black text-[#6183FF] uppercase tracking-[0.2em]">Premium Tier</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <XMarkIcon className="w-6 h-6 text-gray-300" />
          </button>
        </div>

        <div className="space-y-5 mb-10">
          {proFeatures.map((feature, idx) => (
            <div key={idx} className="flex items-center gap-4 group">
              <div className="w-6 h-6 rounded-full bg-green-50 flex items-center justify-center shrink-0 group-hover:bg-green-100 transition-colors">
                <CheckCircleIcon className="w-4 h-4 text-green-500" />
              </div>
              <span className="font-bold text-gray-600 text-sm tracking-tight">{feature}</span>
            </div>
          ))}
        </div>

        <button className="w-full bg-[#6183FF] text-white font-bold py-5 rounded-3xl shadow-2xl shadow-blue-500/30 hover:bg-[#4E6EEF] transition-all transform hover:scale-[1.02] active:scale-[0.98]">
          Upgrade to Pro • ₦5,000 / year
        </button>
        <p className="text-center text-[10px] text-gray-300 font-bold uppercase tracking-widest mt-6">Cancel anytime • Secure payment by Paystack</p>
      </div>
    </div>
  );
}
