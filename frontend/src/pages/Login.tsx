import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { EyeIcon, EyeSlashIcon, ArrowPathIcon, PhoneIcon } from '@heroicons/react/24/outline';
import { createClient } from '../lib/supabase/client';
import SEOTitle from '../components/SEOTitle';

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const supabase = createClient();

  const [formData, setFormData] = useState({
    identifier: '',
    password: '',
    role: 'patient',
    remember: false
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

    const type = validateIdentifier(formData.identifier);
    if (!type) {
      setError('Please enter a valid email address or phone number');
      return;
    }

    setLoading(true);

    try {
      // In a real app, we would use the identifier for authentication
      setTimeout(() => {
        const savedUser = localStorage.getItem('selorah_user');
        const userData = savedUser ? JSON.parse(savedUser) : { first_name: 'Returning', last_name: 'User' };
        
        localStorage.setItem('selorah_user', JSON.stringify({
          ...userData,
          email: validateIdentifier(formData.identifier) === 'email' ? formData.identifier : userData.email,
          phone: validateIdentifier(formData.identifier) === 'phone' ? formData.identifier : userData.phone,
          role: formData.role
        }));

        if (formData.role === 'provider' || formData.role === 'hospital') {
          navigate('/hospital');
        } else if (formData.role === 'researcher') {
          navigate('/researcher');
        } else if (formData.role === 'insurer') {
          navigate('/insurer');
        } else {
          navigate('/dashboard');
        }
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'An error occurred during login');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#0A0B14] text-white selection:bg-primary/30 font-sora">
      <SEOTitle title="Login" />
      {/* Left Side: Image & Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <img
          src="/assets/hero-bg-image-1.jpg"
          alt="Medical Professional"
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
              Secure Healthcare Access for Everyone
            </h1>
            <div className="flex gap-2 mt-8">
              <div className="w-8 h-1 bg-[#4262FF] rounded-full"></div>
              <div className="w-8 h-1 bg-white/30 rounded-full"></div>
              <div className="w-8 h-1 bg-white/30 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side: Login Form */}
      <div className="flex-1 flex flex-col justify-center px-12 py-12">
        <div className="max-w-md w-full mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-white tracking-tight">Log in</h2>
            <Link to="/" className="text-white/60 hover:text-white transition-colors text-sm">
              Back →
            </Link>
          </div>

          <p className="text-white/60 mb-8 font-medium">
            Don't have an account? <Link to="/signup" className="text-[#4262FF] hover:underline">Sign up</Link>
          </p>

          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-4 rounded-xl mb-6 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="relative">
              <input
                type="text" required placeholder="Email or Phone Number"
                autoComplete="off"
                className="w-full bg-[#1A1B2E] border border-white/10 rounded-xl px-4 py-4 pl-12 focus:outline-none focus:border-[#4262FF] transition-all text-white placeholder:text-gray-500"
                value={formData.identifier} onChange={(e) => setFormData({ ...formData, identifier: e.target.value })}
              />
              <PhoneIcon className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
            </div>

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"} required placeholder="Password"
                autoComplete="current-password"
                className="w-full bg-[#1A1B2E] border border-white/10 rounded-xl px-4 py-4 focus:outline-none focus:border-[#4262FF] transition-all text-white placeholder:text-gray-500"
                value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
              <button
                type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
              >
                {showPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
              </button>
            </div>

            <div className="relative">
              <select
                className="w-full bg-[#1A1B2E] border border-white/10 rounded-xl px-4 py-4 focus:outline-none focus:border-[#4262FF] transition-all text-white appearance-none"
                value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              >
                <option value="patient">Login as Patient</option>
                <option value="provider">Login as Hospital / Provider</option>
                <option value="researcher">Login as Researcher</option>
                <option value="insurer">Login as Insurer</option>
              </select>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox" id="remember" className="accent-[#4262FF] w-4 h-4 cursor-pointer"
                  checked={formData.remember} onChange={(e) => setFormData({ ...formData, remember: e.target.checked })}
                />
                <label htmlFor="remember" className="text-sm text-white/60 select-none cursor-pointer">Remember me</label>
              </div>
              <Link to="/forgot-password" title="Coming soon" className="text-sm text-white/40 hover:text-[#4262FF] transition-colors">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit" disabled={loading}
              className="w-full bg-[#4262FF] py-4 rounded-xl font-bold hover:bg-[#3250E6] transition-all flex items-center justify-center gap-2 text-white shadow-lg shadow-blue-500/20"
            >
              {loading ? <ArrowPathIcon className="w-5 h-5 animate-spin" /> : 'Log In'}
            </button>

            <div className="relative py-8 flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10"></div>
              </div>
              <span className="relative z-10 px-4 bg-[#0A0B14] text-xs text-white/40 uppercase tracking-widest">
                Or log in with
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => {
                  setLoading(true);
                  setTimeout(() => navigate('/dashboard'), 1500);
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
                  setTimeout(() => navigate('/dashboard'), 1500);
                }}
                className="flex items-center justify-center gap-3 bg-transparent border border-white/10 py-3 rounded-xl hover:bg-white/5 transition-all text-white group"
              >
                <img src="/assets/apple-logo.png" alt="Apple" className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span className="font-medium text-sm">Apple</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
