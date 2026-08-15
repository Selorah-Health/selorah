import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import {
  EyeIcon,
  EyeSlashIcon,
  ArrowPathIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
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
    agree: false,
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

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    // Cache names early so onboarding can prefill even if the user refreshes mid-flow
    try {
      const existing = localStorage.getItem('selorah_user');
      const prev = existing ? JSON.parse(existing) : {};
      localStorage.setItem(
        'selorah_user',
        JSON.stringify({
          ...prev,
          first_name: formData.firstName.trim(),
          last_name: formData.lastName.trim(),
          email: formData.identifier.trim(),
        })
      );
    } catch {
      // ignore storage errors
    }
    // Simulate OTP send step (real implementation would call Supabase/phone OTP here)
    setTimeout(() => {
      setLoading(false);
      setStep(2);
    }, 800);
  };

  const handleVerifyOtp = async () => {
    setLoading(true);
    setError(null);

    try {
      const url = import.meta.env.VITE_SUPABASE_URL;
      const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
      if (!url || !key || url.includes('placeholder')) {
        throw new Error(
          'Authentication is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment.'
        );
      }

      // Only email signup is supported via Supabase auth in this flow
      const type = validateIdentifier(formData.identifier);
      if (type !== 'email') {
        throw new Error('Phone signup is not yet available. Please use an email address.');
      }

      const { error: authError } = await supabase.auth.signUp({
        email: formData.identifier.trim(),
        password: formData.password,
        options: {
          data: {
            first_name: formData.firstName.trim(),
            last_name: formData.lastName.trim(),
          },
        },
      });

      if (authError) throw authError;

      localStorage.setItem(
        'selorah_user',
        JSON.stringify({
          first_name: formData.firstName.trim(),
          last_name: formData.lastName.trim(),
          email: formData.identifier.trim(),
          is_pro: false,
          role: 'patient',
        })
      );

      navigate('/onboarding');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      if (message.includes('Failed to fetch') || message.includes('NetworkError')) {
        setError(
          'Unable to reach the authentication server. Check your connection or contact support if this persists.'
        );
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return;
    if (value && !/^\d$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
  };

  const handleSocialSignup = (provider: 'google' | 'apple') => {
    setError(
      `${provider === 'google' ? 'Google' : 'Apple'} sign-up is coming soon. Please use email for now.`
    );
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#0A0B14] text-white font-sora">
      <SEOTitle title="Create Account" />

      {/* LEFT SIDE - Desktop only */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <img
          src="/assets/hero-bg-image-2.jpg"
          alt="Medical Background"
          className="absolute inset-0 w-full h-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0B14] to-transparent" />
        <div className="relative z-10 flex flex-col justify-between h-full p-12">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 flex items-center justify-center">
              <img src="/logo.svg" alt="Selorah Logo" className="w-full h-full object-contain" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-white">Selorah Health</span>
          </div>
          <div className="max-w-md">
            <h1 className="text-4xl xl:text-5xl font-bold leading-tight mb-4 text-white">
              Empowering You to Own and Earn from Your Health Data
            </h1>
            <div className="flex gap-2 mt-4">
              <div className="w-8 h-1 bg-[#4262FF] rounded-full" />
              <div className="w-8 h-1 bg-white/30 rounded-full" />
              <div className="w-8 h-1 bg-white/30 rounded-full" />
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE - Form */}
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 py-8 sm:py-12 min-h-screen lg:min-h-0 overflow-y-auto">
        <div className="max-w-md w-full mx-auto">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <img src="/logo.svg" alt="Selorah" className="w-9 h-9 object-contain" />
            <span className="text-lg font-bold tracking-tight">Selorah Health</span>
          </div>

          {step === 1 ? (
            <>
              <div className="flex justify-between items-center mb-6 sm:mb-8">
                <h2 className="text-2xl sm:text-3xl font-bold text-white">Create an account</h2>
                <Link to="/" className="text-white/60 hover:text-white text-sm whitespace-nowrap">
                  Back →
                </Link>
              </div>

              <p className="text-white/60 mb-6 sm:mb-8 text-sm sm:text-base">
                Already have an account?{' '}
                <Link to="/login" className="text-[#4262FF] hover:underline">
                  Log in
                </Link>
              </p>

              {error && (
                <div
                  role="alert"
                  className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 sm:p-4 rounded-xl mb-6 text-sm break-words"
                >
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <input
                    type="text"
                    required
                    autoComplete="given-name"
                    placeholder="First name"
                    className="bg-[#1A1B2E] border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder:text-gray-500 focus:border-[#4262FF] outline-none text-base"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  />
                  <input
                    type="text"
                    required
                    autoComplete="family-name"
                    placeholder="Last name"
                    className="bg-[#1A1B2E] border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder:text-gray-500 focus:border-[#4262FF] outline-none text-base"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  />
                </div>

                <input
                  type="text"
                  required
                  autoComplete="email"
                  placeholder="Email or phone number"
                  className="w-full bg-[#1A1B2E] border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder:text-gray-500 focus:border-[#4262FF] outline-none text-base"
                  value={formData.identifier}
                  onChange={(e) => setFormData({ ...formData, identifier: e.target.value })}
                />

                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="new-password"
                    placeholder="Password (min. 8 characters)"
                    className="w-full bg-[#1A1B2E] border border-white/10 rounded-xl px-4 py-3.5 pr-12 text-white placeholder:text-gray-500 focus:border-[#4262FF] outline-none text-base"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white p-1"
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="w-5 h-5" />
                    ) : (
                      <EyeIcon className="w-5 h-5" />
                    )}
                  </button>
                </div>

                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="agree-terms"
                    checked={formData.agree}
                    onChange={(e) => setFormData({ ...formData, agree: e.target.checked })}
                    className="mt-1 h-4 w-4 rounded border-white/20 bg-[#1A1B2E] text-[#4262FF] focus:ring-[#4262FF]"
                  />
                  <label htmlFor="agree-terms" className="text-sm text-white/70 cursor-pointer leading-snug">
                    I agree to the{' '}
                    <Link to="/terms" className="text-white hover:underline">
                      Terms &amp; Conditions
                    </Link>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={loading || !formData.agree}
                  className="w-full bg-[#4262FF] hover:bg-[#3250E6] py-3.5 sm:py-4 rounded-xl font-bold text-white transition-all disabled:opacity-50 min-h-[48px]"
                >
                  {loading ? (
                    <ArrowPathIcon className="w-4 h-4 animate-spin mx-auto shrink-0" aria-hidden="true" />
                  ) : (
                    'Sign Up'
                  )}
                </button>

                {/* Social — always visible on mobile */}
                <div className="relative py-6 flex items-center justify-center">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/10" />
                  </div>
                  <span className="relative z-10 px-4 bg-[#0A0B14] text-xs text-white/40 uppercase tracking-widest">
                    Or register with
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <button
                    type="button"
                    onClick={() => handleSocialSignup('google')}
                    className="flex items-center justify-center gap-2 sm:gap-3 bg-transparent border border-white/10 py-3 rounded-xl hover:bg-white/5 transition-all text-white min-h-[48px]"
                  >
                    <img src="/assets/google-logo.png" alt="" className="w-5 h-5" />
                    <span className="font-medium text-sm">Google</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSocialSignup('apple')}
                    className="flex items-center justify-center gap-2 sm:gap-3 bg-transparent border border-white/10 py-3 rounded-xl hover:bg-white/5 transition-all text-white min-h-[48px]"
                  >
                    <img src="/assets/apple-logo.png" alt="" className="w-5 h-5" />
                    <span className="font-medium text-sm">Apple</span>
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="text-center">
              <div className="w-16 h-16 bg-[#4262FF]/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <CheckCircleIcon className="w-8 h-8 text-[#4262FF]" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">Verify your account</h2>
              <p className="text-white/60 mb-8 text-sm sm:text-base">
                We&apos;ve sent a 6-digit code to{' '}
                <span className="font-bold text-white break-all">{formData.identifier}</span>
              </p>

              {error && (
                <div
                  role="alert"
                  className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 sm:p-4 rounded-xl mb-6 text-sm break-words text-left"
                >
                  {error}
                </div>
              )}

              <div className="flex justify-between gap-2 sm:gap-3 mb-8">
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    id={`otp-${idx}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    autoComplete="one-time-code"
                    className="w-full aspect-square max-w-[52px] bg-[#1A1B2E] border border-white/10 rounded-xl text-center text-2xl sm:text-3xl font-bold focus:border-[#4262FF] outline-none"
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                  />
                ))}
              </div>

              <button
                onClick={handleVerifyOtp}
                disabled={loading || otp.some((d) => !d)}
                className="w-full bg-[#4262FF] py-3.5 sm:py-4 rounded-xl font-bold text-white disabled:opacity-50 min-h-[48px] text-base"
              >
                {loading ? (
                  <ArrowPathIcon className="w-4 h-4 animate-spin mx-auto shrink-0" aria-hidden="true" />
                ) : (
                  'Verify & Create Account'
                )}
              </button>

              <button
                type="button"
                onClick={() => setStep(1)}
                className="mt-4 text-sm text-white/50 hover:text-white transition-colors"
              >
                ← Back to form
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
