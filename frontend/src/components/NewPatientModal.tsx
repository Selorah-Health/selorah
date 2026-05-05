import { useState, useEffect } from 'react';
import { XMarkIcon, UserIcon, PhoneIcon, CalendarIcon, HeartIcon } from '@heroicons/react/24/outline';

interface NewPatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (patient: any) => void;
}

export default function NewPatientModal({ isOpen, onClose, onAdd }: NewPatientModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    dob: '',
    gender: 'Other',
    bloodGroup: 'Unknown'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setFormData({
        name: '',
        phone: '',
        dob: '',
        gender: 'Other',
        bloodGroup: 'Unknown'
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
      const newPatient = {
        id: `SH-${Math.floor(10000 + Math.random() * 90000)}`,
        name: formData.name,
        lastVisit: 'Just now',
        status: 'Checked In'
      };
      onAdd(newPatient);
      setIsSubmitting(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-md transition-all duration-300">
      <div className="absolute inset-0" onClick={onClose}></div>
      <div className="relative bg-white border border-gray-100 rounded-[40px] p-10 max-w-lg w-full shadow-[0_32px_64px_-12px_rgba(0,0,0,0.1)] overflow-hidden animate-in fade-in zoom-in duration-300">
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 text-gray-400 hover:text-gray-900 transition-colors p-2 rounded-full hover:bg-gray-50"
        >
          <XMarkIcon className="w-6 h-6" />
        </button>

        <div className="mb-10">
          <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mb-6">
            <UserIcon className="w-8 h-8 text-[#6183FF]" />
          </div>
          <h3 className="text-3xl font-black text-[#101217] tracking-tight mb-2">Register New Patient</h3>
          <p className="text-gray-500 font-medium">Create a digital health token for a new patient in the Selorah network.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Full Legal Name</label>
              <div className="relative">
                <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="e.g. Chioma Adebayo"
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-12 py-4 text-sm font-bold focus:outline-none focus:border-[#6183FF] focus:ring-4 focus:ring-blue-500/5 transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Phone Number</label>
                <div className="relative">
                  <PhoneIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    placeholder="080 000 0000"
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-12 py-4 text-sm font-bold focus:outline-none focus:border-[#6183FF] focus:ring-4 focus:ring-blue-500/5 transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Date of Birth</label>
                <div className="relative">
                  <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="date"
                    required
                    value={formData.dob}
                    onChange={(e) => setFormData({...formData, dob: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-12 py-4 text-sm font-bold focus:outline-none focus:border-[#6183FF] focus:ring-4 focus:ring-blue-500/5 transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Gender</label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({...formData, gender: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 text-sm font-bold focus:outline-none focus:border-[#6183FF] transition-all appearance-none cursor-pointer"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Blood Group</label>
                <select
                  value={formData.bloodGroup}
                  onChange={(e) => setFormData({...formData, bloodGroup: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 text-sm font-bold focus:outline-none focus:border-[#6183FF] transition-all appearance-none cursor-pointer"
                >
                  {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'].map(bg => (
                    <option key={bg} value={bg}>{bg}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-[#6183FF] text-white font-black py-5 rounded-2xl hover:bg-[#4E6EEF] transition-all shadow-xl shadow-blue-500/20 flex items-center justify-center gap-3 mt-4 active:scale-[0.98]"
          >
            {isSubmitting ? (
              <span className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin"></span>
            ) : (
              <>
                <HeartIcon className="w-5 h-5" />
                Initialize Patient Token
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
