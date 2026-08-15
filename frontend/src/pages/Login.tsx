import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useState } from 'react';
import {
  EyeIcon,
  EyeSlashIcon,
  ArrowPathIcon,
  EnvelopeIcon,
  PhoneIcon,
  IdentificationIcon,
} from '@heroicons/react/24/outline';
import SEOTitle from '../components/SEOTitle';
import { createClient } from '../lib/supabase/client';
import {
  writeLocalSession,
  homeForRole,
  isValidNin,
  normalizeRole,
  resolvePortalAccess,
} from '../lib/auth/session';

type LoginMethod = 'email' | 'phone' | 'nin';
type PortalMode = 'patient' | 'staff';

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [method, setMethod] = useState<LoginMethod>('email');
  const [portalMode, setPortalMode] = useState<PortalMode>('patient');
  const navigate = useNavigate();
  const location = useLocation();
  const supabase = createClient();

  const [formData, setFormData] = useState({
    identifier: '',
    password: '',
    orgId: '',
  });

  const fromPath = (location.state as { from?: string } | null)?.from;

  const resolveEmailForAuth = async (identifier: string, loginMethod: LoginMethod) => {
    if (loginMethod === 'email') return identifier.trim();

    if (loginMethod === 'phone') {
      const { data: pp, error: qErr } = await supabase
        .from('patient_profiles')
        .select('user_id, phone')
        .eq('phone', identifier.trim())
        .maybeSingle();
      if (qErr) throw qErr;
      if (!pp?.user_id) throw new Error('No account found for this phone number.');
      const { data: u } = await supabase.from('users').select('email').eq('id', pp.user_id).maybeSingle();
      if (!u?.email) throw new Error('Account found but no email is linked. Sign in with email once.');
      return u.email;
    }

    // NIN
    const { data: pp, error: qErr } = await supabase
      .from('patient_profiles')
      .select('user_id, nin')
      .eq('nin', identifier.trim())
      .maybeSingle();
    if (qErr) throw qErr;
    if (!pp?.user_id) throw new Error('No account found for this NIN.');
    const { data: u } = await supabase.from('users').select('email').eq('id', pp.user_id).maybeSingle();
    if (!u?.email) throw new Error('Account found but no email is linked. Sign in with email once.');
    return u.email;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const url = import.meta.env.VITE_SUPABASE_URL;
      const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
      if (!url || !key || String(url).includes('placeholder')) {
        throw new Error(
          'Authentication is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'
        );
      }

      if (method === 'nin' && !isValidNin(formData.identifier)) {
        throw new Error('NIN must be exactly 11 digits.');
      }

      if (portalMode === 'staff' && !formData.orgId.trim()) {
        throw new Error('Organization ID is required for staff login.');
      }

      let email = formData.identifier.trim();
      if (portalMode === 'patient' && method !== 'email') {
        email = await resolveEmailForAuth(formData.identifier, method);
      }

      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password: formData.password,
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Login failed. Please try again.');

      const { data: userRow } = await supabase
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .maybeSingle();

      const { data: patientRow } = await supabase
        .from('patient_profiles')
        .select('*')
        .eq('user_id', authData.user.id)
        .maybeSingle();

      const { data: hospitalRow } = await supabase
        .from('hospital_profiles')
        .select('*')
        .eq('user_id', authData.user.id)
        .maybeSingle();

      const role = normalizeRole(userRow?.role || 'patient');
      const profileData = {
        ...userRow,
        ...patientRow,
        first_name: patientRow?.full_name?.split(' ')?.[0],
        last_name: patientRow?.full_name?.split(' ')?.slice(1).join(' '),
        phone_number: patientRow?.phone,
        nin: patientRow?.nin,
        org_id: hospitalRow?.org_id,
        is_pro: patientRow?.tier === 'pro',
      };

      if (portalMode === 'staff') {
        if (!['provider', 'researcher', 'insurer'].includes(role)) {
          throw new Error('This account is not registered as hospital, researcher, or insurer staff.');
        }
        const profileOrg = hospitalRow?.org_id;
        if (profileOrg && formData.orgId.trim() && profileOrg !== formData.orgId.trim()) {
          throw new Error('Organization ID does not match this account.');
        }
        if (!profileOrg && formData.orgId.trim() && hospitalRow) {
          await supabase
            .from('hospital_profiles')
            .update({ org_id: formData.orgId.trim() })
            .eq('user_id', authData.user.id);
        }
      }

      writeLocalSession({
        id: authData.user.id,
        email: authData.user.email,
        phone: profileData?.phone_number,
        nin: (profileData as any)?.nin,
        first_name: profileData?.first_name || authData.user.user_metadata?.first_name,
        last_name: profileData?.last_name || authData.user.user_metadata?.last_name,
        role,
        org_id: (profileData as any)?.org_id || formData.orgId.trim() || undefined,
        is_pro: profileData?.is_pro || false,
      });

      if (fromPath) {
        const access = resolvePortalAccess(role, fromPath);
        if (access.allowed) {
          navigate(fromPath);
          return;
        }
      }

      navigate(homeForRole(role));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Invalid credentials.';
      if (message.includes('Failed to fetch') || message.includes('NetworkError')) {
        setError('Unable to reach the authentication server. Check your connection.');
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  const methodTabs: { id: LoginMethod; label: string; icon: typeof EnvelopeIcon }[] = [
    { id: 'email', label: 'Email', icon: EnvelopeIcon },
    { id: 'phone', label: 'Phone', icon: PhoneIcon },
    { id: 'nin', label: 'NIN', icon: IdentificationIcon },
  ];

  const identifierPlaceholder =
    method === 'email'
      ? 'Email address'
      : method === 'phone'
        ? 'WhatsApp / phone number'
        : '11-digit NIN';

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#0A0B14] text-white font-sora">
      <SEOTitle title="Login" />

      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <img
          src="/assets/hero-bg-image-1.jpg"
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0B14] to-transparent" />
        <div className="relative z-10 flex flex-col justify-between h-full p-12">
          <div className="flex items-center gap-3">
            <img src="/logo.svg" alt="Selorah" className="w-12 h-12 object-contain" />
            <span className="text-2xl font-bold tracking-tight">Selorah Health</span>
          </div>
          <div className="max-w-md">
            <h1 className="text-4xl xl:text-5xl font-bold leading-tight mb-4">
              Your health story, everywhere you go.
            </h1>
            <p className="text-white/60 text-sm">
              Patients sign in with email, phone, or NIN. Providers use their organization ID.
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 py-8 sm:py-12 min-h-screen lg:min-h-0">
        <div className="max-w-md w-full mx-auto">
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <img src="/logo.svg" alt="Selorah" className="w-9 h-9 object-contain" />
            <span className="text-lg font-bold">Selorah Health</span>
          </div>

          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Log in</h2>
            <Link to="/" className="text-white/60 hover:text-white text-sm">
              Back →
            </Link>
          </div>

          <div className="flex p-1 bg-white/5 rounded-xl mb-6">
            <button
              type="button"
              onClick={() => setPortalMode('patient')}
              className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${
                portalMode === 'patient' ? 'bg-[#4262FF] text-white' : 'text-white/50 hover:text-white'
              }`}
            >
              Patient
            </button>
            <button
              type="button"
              onClick={() => {
                setPortalMode('staff');
                setMethod('email');
              }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${
                portalMode === 'staff' ? 'bg-[#4262FF] text-white' : 'text-white/50 hover:text-white'
              }`}
            >
              Hospital / Research / Insurer
            </button>
          </div>

          <p className="text-white/60 mb-6 text-sm">
            Don&apos;t have an account?{' '}
            <Link to="/signup" className="text-[#4262FF] hover:underline">
              Sign up
            </Link>
          </p>

          {error && (
            <div role="alert" className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-xl mb-6 text-sm break-words">
              {error}
            </div>
          )}

          {portalMode === 'patient' && (
            <div className="grid grid-cols-3 gap-2 mb-6">
              {methodTabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setMethod(tab.id);
                    setFormData((f) => ({ ...f, identifier: '' }));
                  }}
                  className={`flex flex-col items-center gap-1 py-3 rounded-xl border text-xs font-bold transition-all ${
                    method === tab.id
                      ? 'border-[#4262FF] bg-[#4262FF]/15 text-white'
                      : 'border-white/10 text-white/50 hover:border-white/30'
                  }`}
                >
                  <tab.icon className="w-5 h-5" />
                  {tab.label}
                </button>
              ))}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {portalMode === 'staff' && (
              <div>
                <input
                  type="text"
                  required
                  placeholder="Organization ID"
                  className="w-full bg-[#1A1B2E] border border-white/10 rounded-xl px-4 py-3.5 focus:outline-none focus:border-[#4262FF] text-white placeholder:text-gray-500 text-base"
                  value={formData.orgId}
                  onChange={(e) => setFormData({ ...formData, orgId: e.target.value })}
                />
                <p className="text-[11px] text-white/40 mt-1.5 px-1">
                  Issued when your organization registered on Selorah.
                </p>
              </div>
            )}

            <div className="relative">
              <input
                type={method === 'email' || portalMode === 'staff' ? 'email' : method === 'phone' ? 'tel' : 'text'}
                required
                inputMode={method === 'nin' ? 'numeric' : undefined}
                maxLength={method === 'nin' ? 11 : undefined}
                autoComplete={method === 'email' || portalMode === 'staff' ? 'email' : method === 'phone' ? 'tel' : 'off'}
                placeholder={portalMode === 'staff' ? 'Work email' : identifierPlaceholder}
                className="w-full bg-[#1A1B2E] border border-white/10 rounded-xl px-4 py-3.5 pl-12 focus:outline-none focus:border-[#4262FF] text-white placeholder:text-gray-500 text-base"
                value={formData.identifier}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    identifier:
                      method === 'nin' ? e.target.value.replace(/\D/g, '').slice(0, 11) : e.target.value,
                  })
                }
              />
              {method === 'email' || portalMode === 'staff' ? (
                <EnvelopeIcon className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
              ) : method === 'phone' ? (
                <PhoneIcon className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
              ) : (
                <IdentificationIcon className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
              )}
            </div>

            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                placeholder="Password"
                className="w-full bg-[#1A1B2E] border border-white/10 rounded-xl px-4 py-3.5 pr-12 focus:outline-none focus:border-[#4262FF] text-white placeholder:text-gray-500 text-base"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
              <button
                type="button"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white p-1"
              >
                {showPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#4262FF] py-3.5 rounded-xl font-bold hover:bg-[#3250E6] transition-all flex items-center justify-center gap-2 text-white shadow-lg shadow-blue-500/20 disabled:opacity-50 min-h-[48px] text-base"
            >
              {loading ? <ArrowPathIcon className="w-4 h-4 animate-spin shrink-0" /> : 'Log In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
