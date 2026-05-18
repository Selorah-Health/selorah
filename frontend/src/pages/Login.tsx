import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { EyeIcon, EyeSlashIcon, ArrowPathIcon, PhoneIcon } from '@heroicons/react/24/outline';
import SEOTitle from '../components/SEOTitle';
import { createClient } from '../lib/supabase/client';

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const supabase = createClient();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (authError) throw authError;

      // Fetch user profile to know their role
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      // Store user info in localStorage as a fallback/cache
      localStorage.setItem('selorah_user', JSON.stringify({
        id: authData.user.id,
        email: authData.user.email,
        first_name: profileData?.first_name || authData.user.user_metadata?.first_name,
        last_name: profileData?.last_name || authData.user.user_metadata?.last_name,
        role: profileData?.role || 'patient',
        is_pro: profileData?.is_pro || false
      }));

      // Redirect based on role
      const role = profileData?.role || 'patient';
      
      if (role === 'provider') {
        navigate('/hospital');
      } else if (role === 'researcher') {
        navigate('/researcher');
      } else if (role === 'insurer') {
        navigate('/insurer');
      } else {
        navigate('/dashboard');
      }

    } catch (err: any) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#0A0B14] text-white selection:bg-primary/30 font-sora">
      <SEOTitle title="Login" />

      {/* Left Side - Keep your existing design */}
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
      <div className="flex-1 flex flex-col justify-center px-4 py-12">
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
                type="email"
                required
                placeholder="Email address"
                className="w-full bg-[#1A1B2E] border border-white/10 rounded-xl px-4 py-4 pl-12 focus:outline-none focus:border-[#4262FF] transition-all text-white placeholder:text-gray-500"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
              <PhoneIcon className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
            </div>

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder="Password"
                className="w-full bg-[#1A1B2E] border border-white/10 rounded-xl px-4 py-4 focus:outline-none focus:border-[#4262FF] transition-all text-white placeholder:text-gray-500"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
              >
                {showPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#4262FF] py-4 rounded-xl font-bold hover:bg-[#3250E6] transition-all flex items-center justify-center gap-2 text-white shadow-lg shadow-blue-500/20 disabled:opacity-50"
            >
              {loading ? <ArrowPathIcon className="w-5 h-5 animate-spin" /> : 'Log In'}
            </button>

            {/* Social Logins (Optional for now) */}
            <div className="relative py-8 flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10"></div>
              </div>
              <span className="relative z-10 px-4 bg-[#0A0B14] text-xs text-white/40 uppercase tracking-widest">
                Or log in with
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button type="button" className="flex items-center justify-center gap-3 bg-transparent border border-white/10 py-3 rounded-xl hover:bg-white/5 transition-all text-white">
                <img src="/assets/google-logo.png" alt="Google" className="w-5 h-5" />
                <span className="font-medium text-sm">Google</span>
              </button>
              <button type="button" className="flex items-center justify-center gap-3 bg-transparent border border-white/10 py-3 rounded-xl hover:bg-white/5 transition-all text-white">
                <img src="/assets/apple-logo.png" alt="Apple" className="w-5 h-5" />
                <span className="font-medium text-sm">Apple</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}