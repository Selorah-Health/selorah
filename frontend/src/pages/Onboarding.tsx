import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  UserIcon, 
  SparklesIcon, 
  CheckCircleIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
  BuildingOffice2Icon,
  BeakerIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    role: 'patient',
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: '',
    interests: [] as string[]
  });

  const nextStep = () => setStep(step + 1);
  const prevStep = () => setStep(step - 1);

  const toggleInterest = (interest: string) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest) 
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  const handleFinish = () => {
    // Save to Supabase here later
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-[#0A0B14] text-white flex flex-col font-sora selection:bg-primary/30">
      {/* Header */}
      <header className="p-8 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <img src="/logo.svg" alt="Selorah Logo" className="w-10 h-10" />
          <span className="text-2xl font-bold tracking-tight">Selorah</span>
        </div>
        <div className="flex gap-2">
          {[1, 2, 3, 4].map((s) => (
            <div 
              key={s} 
              className={`h-1.5 rounded-full transition-all duration-500 ${s === step ? 'w-8 bg-primary' : s < step ? 'w-4 bg-primary/40' : 'w-4 bg-white/10'}`}
            ></div>
          ))}
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-xl w-full">
          {step === 1 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="space-y-2">
                <h1 className="text-4xl font-bold">How will you use Selorah?</h1>
                <p className="text-white/60 text-lg">Choose the account type that fits you best.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { id: 'patient', title: 'Patient', desc: 'Manage your personal health records', icon: UserIcon },
                  { id: 'provider', title: 'Provider', desc: 'Access and update patient records', icon: BuildingOffice2Icon },
                  { id: 'researcher', title: 'Researcher', desc: 'Analyze anonymized health data', icon: BeakerIcon },
                  { id: 'insurer', title: 'Insurer', desc: 'Verify health claims securely', icon: ShieldCheckIcon },
                ].map((role) => (
                  <button 
                    key={role.id}
                    onClick={() => setFormData({...formData, role: role.id})}
                    className={`p-6 rounded-3xl border text-left transition-all flex flex-col gap-4 ${formData.role === role.id ? 'bg-primary border-primary shadow-lg shadow-primary/20' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
                  >
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${formData.role === role.id ? 'bg-white/20' : 'bg-white/10'}`}>
                      <role.icon className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="font-bold text-xl">{role.title}</p>
                      <p className={`text-sm ${formData.role === role.id ? 'text-white/80' : 'text-white/40'}`}>{role.desc}</p>
                    </div>
                  </button>
                ))}
              </div>

              <button 
                onClick={nextStep}
                className="w-full bg-primary py-5 rounded-2xl font-bold hover:bg-primary-hover transition-all flex items-center justify-center gap-2 group"
              >
                Continue
                <ChevronRightIcon className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="space-y-2">
                <h1 className="text-4xl font-bold">Let's get to know you</h1>
                <p className="text-white/60 text-lg">Personalize your {formData.role} experience.</p>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-white/40 uppercase tracking-widest">First Name</label>
                    <input 
                      type="text" 
                      placeholder="Samuel"
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:border-primary transition-all"
                      value={formData.firstName}
                      onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-white/40 uppercase tracking-widest">Last Name</label>
                    <input 
                      type="text" 
                      placeholder="Amanze"
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:border-primary transition-all"
                      value={formData.lastName}
                      onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-white/40 uppercase tracking-widest">Date of Birth</label>
                  <input 
                    type="date" 
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:border-primary transition-all text-white"
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({...formData, dateOfBirth: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-white/40 uppercase tracking-widest">Gender</label>
                  <div className="grid grid-cols-3 gap-4">
                    {['Male', 'Female', 'Other'].map((g) => (
                      <button 
                        key={g}
                        onClick={() => setFormData({...formData, gender: g})}
                        className={`py-4 rounded-2xl border transition-all ${formData.gender === g ? 'bg-primary border-primary font-bold' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={prevStep}
                  className="flex-1 bg-white/5 py-5 rounded-2xl font-bold hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                >
                  <ChevronLeftIcon className="w-5 h-5" />
                  Back
                </button>
                <button 
                  onClick={nextStep}
                  disabled={!formData.firstName || !formData.gender}
                  className="flex-[2] bg-primary py-5 rounded-2xl font-bold hover:bg-primary-hover transition-all flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continue
                  <ChevronRightIcon className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="space-y-2">
                <h1 className="text-4xl font-bold">What are your goals?</h1>
                <p className="text-white/60 text-lg">Choose what matters most to you.</p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {[
                  { id: 'records', title: 'Manage Records', desc: 'Securely store and share medical documents', icon: UserIcon },
                  { id: 'research', title: 'Contribute to Research', desc: 'Help advance medicine with anonymized data', icon: SparklesIcon },
                  { id: 'earnings', title: 'Earn Rewards', desc: 'Get paid for your contributions', icon: CheckCircleIcon },
                ].map((item) => (
                  <button 
                    key={item.id}
                    onClick={() => toggleInterest(item.id)}
                    className={`p-6 rounded-[2rem] border text-left transition-all flex items-center gap-6 ${formData.interests.includes(item.id) ? 'bg-primary/20 border-primary shadow-lg shadow-primary/10' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
                  >
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${formData.interests.includes(item.id) ? 'bg-primary' : 'bg-white/10'}`}>
                      <item.icon className="w-7 h-7" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-xl">{item.title}</p>
                      <p className="text-white/50">{item.desc}</p>
                    </div>
                    {formData.interests.includes(item.id) && (
                      <CheckCircleIcon className="w-8 h-8 text-primary" />
                    )}
                  </button>
                ))}
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={prevStep}
                  className="flex-1 bg-white/5 py-5 rounded-2xl font-bold hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                >
                  <ChevronLeftIcon className="w-5 h-5" />
                  Back
                </button>
                <button 
                  onClick={nextStep}
                  className="flex-[2] bg-primary py-5 rounded-2xl font-bold hover:bg-primary-hover transition-all flex items-center justify-center gap-2 group"
                >
                  Almost done
                  <ChevronRightIcon className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-12 text-center animate-in zoom-in duration-700">
              <div className="relative">
                <div className="w-32 h-32 bg-primary rounded-full mx-auto flex items-center justify-center shadow-2xl shadow-primary/40 relative z-10">
                  <CheckCircleIcon className="w-16 h-16" />
                </div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-primary/20 rounded-full blur-3xl animate-pulse"></div>
              </div>

              <div className="space-y-4">
                <h1 className="text-5xl font-bold">You are all set!</h1>
                <p className="text-white/60 text-xl max-w-sm mx-auto">Welcome to the future of healthcare ownership, {formData.firstName}.</p>
              </div>

              <button 
                onClick={handleFinish}
                className="w-full bg-primary py-6 rounded-[2rem] font-bold text-xl hover:bg-primary-hover transition-all shadow-xl shadow-primary/20 hover:scale-105 active:scale-95"
              >
                Go to Dashboard
              </button>
            </div>
          )}
        </div>
      </main>

      <footer className="p-8 text-center opacity-20">
        <p className="text-sm font-bold uppercase tracking-[0.3em]">Selorah Health • Privacy by Design</p>
      </footer>
    </div>
  );
}
