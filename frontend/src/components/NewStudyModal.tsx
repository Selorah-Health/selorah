import { useState, useEffect } from 'react';
import { XMarkIcon, BeakerIcon, CurrencyDollarIcon, UsersIcon, DocumentTextIcon } from '@heroicons/react/24/outline';

interface NewStudyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (study: any) => void;
}

export default function NewStudyModal({ isOpen, onClose, onAdd }: NewStudyModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    budget: '',
    targetParticipants: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setFormData({
        title: '',
        description: '',
        budget: '',
        targetParticipants: ''
      });
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API delay
    setTimeout(() => {
      const newStudy = {
        id: Math.floor(100 + Math.random() * 900),
        title: formData.title,
        description: formData.description,
        participants: 0,
        status: 'Pending Approval'
      };
      onAdd(newStudy);
      setIsSubmitting(false);
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#050038]/60 backdrop-blur-md transition-all duration-300">
      <div className="absolute inset-0" onClick={onClose}></div>
      <div className="relative bg-[#0A0B14] border border-white/10 rounded-[40px] p-10 max-w-xl w-full shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)] overflow-hidden animate-in fade-in zoom-in duration-300">
        {/* Glow Effects */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-[#6183FF] opacity-10 blur-[100px] rounded-full pointer-events-none"></div>
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-[#14F1D9] opacity-5 blur-[100px] rounded-full pointer-events-none"></div>

        <button 
          onClick={onClose}
          className="absolute top-6 right-6 text-gray-400 hover:text-white transition-colors p-2 rounded-full hover:bg-white/5"
        >
          <XMarkIcon className="w-6 h-6" />
        </button>

        <div className="mb-10 relative">
          <div className="w-14 h-14 bg-[#6183FF]/20 rounded-2xl flex items-center justify-center mb-6 border border-[#6183FF]/30">
            <BeakerIcon className="w-8 h-8 text-[#6183FF]" />
          </div>
          <h3 className="text-3xl font-black text-white tracking-tight mb-2">Launch New Study</h3>
          <p className="text-gray-400 font-medium">Define your research parameters and start recruiting participants.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 relative">
          <div className="space-y-5">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-[#6183FF] mb-2">Study Title</label>
              <div className="relative">
                <DocumentTextIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  placeholder="e.g. Longitudinal Sickle Cell Analysis"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-12 py-4 text-sm font-bold text-white focus:outline-none focus:border-[#6183FF] focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-gray-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-[#6183FF] mb-2">Description & Goals</label>
              <textarea
                required
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Describe the clinical significance and methodology..."
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm font-bold text-white focus:outline-none focus:border-[#6183FF] transition-all placeholder:text-gray-600 resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-[#6183FF] mb-2">Funding Budget (USD)</label>
                <div className="relative">
                  <CurrencyDollarIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="number"
                    required
                    value={formData.budget}
                    onChange={(e) => setFormData({...formData, budget: e.target.value})}
                    placeholder="50,000"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-12 py-4 text-sm font-bold text-white focus:outline-none focus:border-[#6183FF] transition-all placeholder:text-gray-600"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-[#6183FF] mb-2">Target Participants</label>
                <div className="relative">
                  <UsersIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="number"
                    required
                    value={formData.targetParticipants}
                    onChange={(e) => setFormData({...formData, targetParticipants: e.target.value})}
                    placeholder="1,000"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-12 py-4 text-sm font-bold text-white focus:outline-none focus:border-[#6183FF] transition-all placeholder:text-gray-600"
                  />
                </div>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-[#6183FF] text-white font-black py-5 rounded-2xl hover:bg-white hover:text-[#050038] transition-all shadow-xl shadow-blue-500/10 flex items-center justify-center gap-3 mt-4 active:scale-[0.98] group"
          >
            {isSubmitting ? (
              <span className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin"></span>
            ) : (
              <>
                <BeakerIcon className="w-5 h-5 transition-transform group-hover:rotate-12" />
                Submit for IRB Review
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
