import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { EyeIcon, EyeSlashIcon, ArrowPathIcon, PhoneIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { createClient } from '../lib/supabase/client';
import SEOTitle from '../components/SEOTitle';

export default function Signup() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState(1); // 1: Info, 2: OTP
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const navigate = useNavigate();
  const supabase = createClient();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    identifier: '', // Can be Email or Phone
    password: '',
    agree: false
  });

  const validateIdentifier = (val: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^\+?[\d\s-]{10,}$/;
    
    if (emailRegex.test(val)) return 'email';
    if (phoneRegex.test(val)) return 'phone';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.agree) {
      setError('You must agree to the terms and conditions');
      return;
    }

    const type = validateIdentifier(formData.identifier);
    if (!type) {
      setError('Please enter a valid email address or phone number');
      return;
    }

    setLoading(true);

    // Simulate sending OTP
    setTimeout(() => {
      setLoading(false);
      setStep(2);
    }, 1500);
  };

  const handleVerifyOtp = async () => {
    setLoading(true);
    setError(null);

    // Simulate OTP Verification and Signup
    setTimeout(async () => {
      try {
        // Persist user info for the demo
        localStorage.setItem('selorah_user', JSON.stringify({
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: validateIdentifier(formData.identifier) === 'email' ? formData.identifier : '',
          phone: validateIdentifier(formData.identifier) === 'phone' ? formData.identifier : '',
          is_pro: false
        }));
        navigate('/onboarding');
      } catch (err: any) {
        setError(err.message || 'An error occurred');
      } finally {
        setLoading(false);
      }
    }, 1500);
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto focus next
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#0A0B14] text-white selection:bg-primary/30 font-sora">
      <SEOTitle title="Create Account" />
      {/* Left Side: Image & Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <img
          src="/assets/hero-bg-image-2.jpg"
          alt="Medical Background"
          className="absolute inset-0 w-full h-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0B14] to-transparent"></div>
        <div className="relative z-10 flex flex-col justify-between h-full p-12">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 flex items-center justify-center">
              <img src="/logo.svg" alt="Selorah Logo" className="w-full h-full object-contain" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-white">Selorah Health</span>
          </div>
          <div className="max-w-md">
            <h1 className="text-5xl font-bold leading-tight mb-4 text-white">
              Empowering You to Own and Earn from Your Health Data
            </h1>
            <div className="flex gap-2 mt-4">
              <div className="w-8 h-1 bg-[#4262FF] rounded-full"></div>
              <div className="w-8 h-1 bg-white/30 rounded-full"></div>
              <div className="w-8 h-1 bg-white/30 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side: Signup Form */}
      <div className="flex-1 flex flex-col justify-center px-4 py-12">
        <div className="max-w-md w-full mx-auto">
          {step === 1 ? (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-bold text-white">Create an account</h2>
                <Link to="/" className="text-white/60 hover:text-white transition-colors text-sm">
                  Back →
                </Link>
              </div>

              <p className="text-white/60 mb-8 font-medium">
                Already have an account? <Link to="/login" className="text-[#4262FF] hover:underline">Log in</Link>
              </p>

              {error && (
                <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-4 rounded-xl mb-6 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text" required placeholder="First name"
                    className="w-full bg-[#1A1B2E] border border-white/10 rounded-xl px-4 py-3.5 focus:outline-none focus:border-[#4262FF] transition-all text-white placeholder:text-gray-500"
                    value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  />
                  <input
                    type="text" required placeholder="Last name"
                    className="w-full bg-[#1A1B2E] border border-white/10 rounded-xl px-4 py-3.5 focus:outline-none focus:border-[#4262FF] transition-all text-white placeholder:text-gray-500"
                    value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  />
                </div>

                <div className="relative">
                  <input
                    type="text" required placeholder="Email or Phone Number"
                    autoComplete="off"
                    className="w-full bg-[#1A1B2E] border border-white/10 rounded-xl px-4 py-3.5 pl-12 focus:outline-none focus:border-[#4262FF] transition-all text-white placeholder:text-gray-500"
                    value={formData.identifier} onChange={(e) => setFormData({ ...formData, identifier: e.target.value })}
                  />
                  <PhoneIcon className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                </div>

                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"} required placeholder="Create password"
                    autoComplete="new-password"
                    className="w-full bg-[#1A1B2E] border border-white/10 rounded-xl px-4 py-3.5 focus:outline-none focus:border-[#4262FF] transition-all text-white placeholder:text-gray-500"
                    value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                  <button
                    type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                  >
                    {showPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                  </button>
                </div>

                <div className="flex items-start gap-3 py-2">
                  <input
                    type="checkbox" id="terms" className="mt-1 accent-[#4262FF] w-4 h-4 cursor-pointer"
                    checked={formData.agree} onChange={(e) => setFormData({ ...formData, agree: e.target.checked })}
                  />
                  <label htmlFor="terms" className="text-sm text-white/60 select-none cursor-pointer">
                    I agree to the <Link to="/terms" className="text-white hover:underline">Terms & Conditions</Link>
                  </label>
                </div>

                <button
                  type="submit" disabled={loading || !formData.agree}
                  className="w-full bg-[#4262FF] py-4 rounded-xl font-bold hover:bg-[#3250E6] transition-all mt-4 flex items-center justify-center gap-2 text-white shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? <ArrowPathIcon className="w-5 h-5 animate-spin" /> : 'Sign Up'}
                </button>

                <div className="relative py-8 flex items-center justify-center">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/10"></div>
                  </div>
                  <span className="relative z-10 px-4 bg-[#0A0B14] text-xs text-white/40 uppercase tracking-widest">
                    Or sign up with
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      setLoading(true);
                      setTimeout(() => navigate('/onboarding'), 1500);
                    }}
                    className="flex items-center justify-center gap-3 bg-transparent border border-white/10 py-3 rounded-xl hover:bg-white/5 transition-all text-white group"
                  >
                    <img src="/assets/google-logo.png" alt="Google" className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    <span className="font-medium text-sm">Google</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLoading(true);
                      setTimeout(() => navigate('/onboarding'), 1500);
                    }}
                    className="flex items-center justify-center gap-3 bg-transparent border border-white/10 py-3 rounded-xl hover:bg-white/5 transition-all text-white group"
                  >
                    <img src="/assets/apple-logo.png" alt="Apple" className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    <span className="font-medium text-sm">Apple</span>
                  </button>
                </div>

                <p className="text-center text-xs text-white/40 pt-8 px-8">
                  By signing up, you agree to receive a one-time verification code via WhatsApp or SMS.
                </p>
              </form>
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500 text-center">
              <div className="w-16 h-16 bg-[#4262FF]/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <CheckCircleIcon className="w-8 h-8 text-[#4262FF]" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">Verify your account</h2>
              <p className="text-white/60 mb-10">
                We've sent a 6-digit code to <span className="text-white font-bold">{formData.identifier}</span> via {validateIdentifier(formData.identifier) === 'email' ? 'Email' : 'WhatsApp/SMS'}.
              </p>

              <div className="flex justify-between gap-2 mb-10">
                {otp.map((digit, idx) => (
                  <input
                    key={idx} id={`otp-${idx}`}
                    type="text" maxLength={1}
                    className="w-full aspect-square bg-[#1A1B2E] border border-white/10 rounded-xl text-center text-2xl font-bold focus:outline-none focus:border-[#4262FF] transition-all"
                    value={digit} onChange={(e) => handleOtpChange(idx, e.target.value)}
                  />
                ))}
              </div>

              <button
                onClick={handleVerifyOtp} disabled={loading || otp.some(d => !d)}
                className="w-full bg-[#4262FF] py-4 rounded-xl font-bold hover:bg-[#3250E6] transition-all flex items-center justify-center gap-2 text-white shadow-lg shadow-blue-500/20 disabled:opacity-50"
              >
                {loading ? <ArrowPathIcon className="w-5 h-5 animate-spin" /> : 'Verify & Create Account'}
              </button>

              <button
                onClick={() => setStep(1)}
                className="mt-6 text-white/40 hover:text-white text-sm font-medium transition-colors"
              >
                Entered wrong number? <span className="text-[#4262FF]">Edit number</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

