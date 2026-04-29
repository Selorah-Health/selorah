import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { EyeIcon, EyeSlashIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
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
    remember: false
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (signInError) throw signInError;
      
      // Successfully logged in, go to dashboard
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#0A0B14] text-white selection:bg-primary/30">
      {/* Left Side: Image & Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <img 
          src="/assets/hero-bg-image-1.jpg" 
          alt="Medical Professional" 
          className="absolute inset-0 w-full h-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0B14] to-transparent"></div>
        <div className="relative z-10 flex flex-col justify-between h-full p-12">
          <div className="flex items-center gap-2">
            <img src="/logo.svg" alt="Selorah Logo" className="w-10 h-10" />
            <span className="text-2xl font-bold tracking-tight text-white">Selorah</span>
          </div>
          <div className="max-w-md">
            <h1 className="text-5xl font-bold leading-tight mb-4 text-white">
              Secure Healthcare Access for Everyone
            </h1>
            <div className="flex gap-2 mt-8">
              <div className="w-8 h-1 bg-white rounded-full"></div>
              <div className="w-8 h-1 bg-white/30 rounded-full"></div>
              <div className="w-8 h-1 bg-white/30 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side: Login Form */}
      <div className="flex-1 flex flex-col justify-center px-6 lg:px-24 py-12">
        <div className="max-w-md w-full mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-white">Log in</h2>
            <Link to="/" className="text-white/60 hover:text-white transition-colors flex items-center gap-2 text-sm lg:hidden">
              Back to website →
            </Link>
            <Link to="/" className="hidden lg:flex text-white/60 hover:text-white transition-colors items-center gap-2 text-sm">
              Back to website →
            </Link>
          </div>
          
          <p className="text-white/60 mb-8">
            Don't have an account? <Link to="/signup" className="text-primary hover:underline">Sign up</Link>
          </p>

          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-4 rounded-xl mb-6 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <input 
                type="email" 
                required
                placeholder="Email" 
                className="w-full bg-[#1A1B2E] border border-white/10 rounded-xl px-4 py-4 focus:outline-none focus:border-primary transition-all text-white placeholder:text-gray-500"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </div>
            
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"} 
                required
                placeholder="Password" 
                className="w-full bg-[#1A1B2E] border border-white/10 rounded-xl px-4 py-4 focus:outline-none focus:border-primary transition-all text-white placeholder:text-gray-500"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
              >
                {showPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <input 
                  type="checkbox" 
                  id="remember" 
                  className="accent-primary w-4 h-4"
                  checked={formData.remember}
                  onChange={(e) => setFormData({...formData, remember: e.target.checked})}
                />
                <label htmlFor="remember" className="text-sm text-white/60 select-none">Remember me</label>
              </div>
              <Link to="/forgot-password" title="Coming soon" className="text-sm text-white/40 hover:text-white transition-colors cursor-not-allowed">
                Forgot password?
              </Link>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-primary py-4 rounded-xl font-bold hover:bg-primary-hover transition-all flex items-center justify-center gap-2 text-white"
            >
              {loading ? (
                <>
                  <ArrowPathIcon className="w-5 h-5 animate-spin" />
                  Logging in...
                </>
              ) : 'Log in'}
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
                className="flex items-center justify-center gap-3 bg-transparent border border-white/10 py-3 rounded-xl hover:bg-white/5 transition-all text-white"
              >
                <img src="/assets/google-logo.png" alt="Google" className="w-5 h-5" />
                <span className="font-medium">Google</span>
              </button>
              <button 
                type="button" 
                className="flex items-center justify-center gap-3 bg-transparent border border-white/10 py-3 rounded-xl hover:bg-white/5 transition-all text-white"
              >
                <img src="/assets/apple-logo.png" alt="Apple" className="w-5 h-5" />
                <span className="font-medium">Apple</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
