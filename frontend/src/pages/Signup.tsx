import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { EyeIcon, EyeSlashIcon, ArrowPathIcon, PhoneIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import SEOTitle from '../components/SEOTitle';
import { createClient } from '../lib/supabase/client';

export default function Signup() {
  const supabase = createClient();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState(1);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    identifier: '',
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
    setTimeout(() => {
      setLoading(false);
      setStep(2);
    }, 1200);
  };

  const handleVerifyOtp = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.identifier,
        password: formData.password,
        options: {
          data: {
            first_name: formData.firstName,
            last_name: formData.lastName,
          }
        }
      });

      if (authError) throw authError;

      localStorage.setItem('selorah_user', JSON.stringify({
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.identifier,
        is_pro: false
      }));

      navigate('/onboarding');
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
  };

  return (
    <div className="min-h-screen flex font-sora">
      <SEOTitle title="Create Account" />

      {/* LEFT SIDE - Fixed Background Image */}
      <div className="hidden lg:flex lg:w-1/2 fixed inset-0 bg-cover bg-center items-center overflow-hidden">
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

      {/* RIGHT SIDE - Scrollable Form */}
      <div className="flex-1 flex items-center justify-center min-h-screen lg:ml-[50%] bg-[#0A0B14] px-6 py-12 overflow-y-auto">
        <div className="max-w-md w-full">
          {step === 1 ? (
            <>
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-bold text-white">Create an account</h2>
                <Link to="/" className="text-white/60 hover:text-white text-sm">Back →</Link>
              </div>

              <p className="text-white/60 mb-8">
                Already have an account? <Link to="/login" className="text-[#4262FF] hover:underline">Log in</Link>
              </p>

              {error && (
                <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-4 rounded-xl mb-6 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <input type="text" required placeholder="First name"
                    className="bg-[#1A1B2E] border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder:text-gray-500 focus:border-[#4262FF] outline-none"
                    value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} />

                  <input type="text" required placeholder="Last name"
                    className="bg-[#1A1B2E] border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder:text-gray-500 focus:border-[#4262FF] outline-none"
                    value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} />
                </div>

                <div className="relative">
                  <input type="text" required placeholder="Email or Phone Number"
                    className="w-full bg-[#1A1B2E] border border-white/10 rounded-xl px-4 py-3.5 pl-12 text-white placeholder:text-gray-500 focus:border-[#4262FF] outline-none"
                    value={formData.identifier} onChange={(e) => setFormData({ ...formData, identifier: e.target.value })} />
                  <PhoneIcon className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                </div>

                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"} required placeholder="Create password"
                    className="w-full bg-[#1A1B2E] border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder:text-gray-500 focus:border-[#4262FF] outline-none"
                    value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/60">
                    {showPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  <input type="checkbox" id="terms" className="accent-[#4262FF] w-4 h-4"
                    checked={formData.agree} onChange={(e) => setFormData({ ...formData, agree: e.target.checked })} />
                  <label htmlFor="terms" className="text-sm text-white/70 cursor-pointer">
                    I agree to the <Link to="/terms" className="text-white hover:underline">Terms & Conditions</Link>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={loading || !formData.agree}
                  className="w-full bg-[#4262FF] hover:bg-[#3250E6] py-4 rounded-xl font-bold text-white transition-all disabled:opacity-50"
                >
                  {loading ? <ArrowPathIcon className="w-5 h-5 animate-spin mx-auto" /> : 'Sign Up'}
                </button>
              </form>
            </>
          ) : (
            // OTP Step (unchanged layout)
            <div className="text-center">
              {/* Your existing OTP UI */}
              <div className="w-16 h-16 bg-[#4262FF]/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <CheckCircleIcon className="w-8 h-8 text-[#4262FF]" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">Verify your account</h2>
              <p className="text-white/60 mb-10">
                We've sent a 6-digit code to <span className="font-bold">{formData.identifier}</span>
              </p>

              {/* OTP Inputs */}
              <div className="flex justify-between gap-3 mb-10">
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    id={`otp-${idx}`}
                    type="text"
                    maxLength={1}
                    className="w-full aspect-square bg-[#1A1B2E] border border-white/10 rounded-xl text-center text-3xl font-bold focus:border-[#4262FF] outline-none"
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                  />
                ))}
              </div>

              <button onClick={handleVerifyOtp} disabled={loading || otp.some(d => !d)}
                className="w-full bg-[#4262FF] py-4 rounded-xl font-bold text-white">
                {loading ? <ArrowPathIcon className="animate-spin mx-auto" /> : 'Verify & Create Account'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}