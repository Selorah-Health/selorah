import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import {
  ArrowLeftIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  EnvelopeIcon,
  EyeIcon,
  EyeSlashIcon,
  IdentificationIcon,
  LockClosedIcon,
  PhoneIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import SEOTitle from '../components/SEOTitle';
import ThemeToggle from '../components/ThemeToggle';
import { createClient } from '../lib/supabase/client';
import {
  homeForRole,
  isValidNin,
  normalizeRole,
  resolvePortalAccess,
  writeLocalSession,
} from '../lib/auth/session';

type LoginMethod = 'email' | 'phone' | 'nin';
type PortalMode = 'patient' | 'staff';

const METHOD_TABS: { id: LoginMethod; label: string; icon: typeof EnvelopeIcon }[] = [
  { id: 'email', label: 'Email', icon: EnvelopeIcon },
  { id: 'phone', label: 'Phone', icon: PhoneIcon },
  { id: 'nin', label: 'NIN', icon: IdentificationIcon },
];

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [method, setMethod] = useState<LoginMethod>('email');
  const [portalMode, setPortalMode] = useState<PortalMode>('patient');
  const [formData, setFormData] = useState({ identifier: '', password: '', orgId: '' });
  const navigate = useNavigate();
  const location = useLocation();
  const supabase = createClient();

  const fromPath = (location.state as { from?: string } | null)?.from;

  const resolveEmailForAuth = async (identifier: string, loginMethod: LoginMethod) => {
    if (loginMethod === 'email') return identifier.trim();

    const value = identifier.trim();

    // Preferred path: a security-definer function resolves phone or NIN
    // without exposing the auth table to the browser.
    try {
      const { data, error: rpcError } = await supabase.rpc('resolve_login_email', {
        identifier: value,
      });
      if (!rpcError && data) {
        const row = Array.isArray(data) ? data[0] : data;
        const email =
          typeof row === 'string'
            ? row
            : row && typeof row === 'object'
              ? (row as { email?: string }).email
              : '';
        if (email && email.includes('@')) return email;
      }
    } catch {
      // Function may not be deployed yet. Fall through to a direct lookup.
    }

    const column = loginMethod === 'phone' ? 'phone' : 'nin';
    const { data: profile, error: profileError } = await supabase
      .from('patient_profiles')
      .select('user_id')
      .eq(column, value)
      .maybeSingle();

    if (profileError) throw profileError;
    if (!profile?.user_id) {
      throw new Error(
        loginMethod === 'phone'
          ? 'No account is linked to that phone number.'
          : 'No account is linked to that NIN.'
      );
    }

    const { data: row } = await supabase
      .from('users')
      .select('email')
      .eq('id', profile.user_id)
      .maybeSingle();

    if (!row?.email) {
      throw new Error('This account has no email linked yet. Log in with email once, then retry.');
    }

    return row.email as string;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
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

      if (portalMode === 'patient' && method === 'nin' && !isValidNin(formData.identifier)) {
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

      const [{ data: userRow }, { data: patientRow }, { data: hospitalRow }] = await Promise.all([
        supabase.from('users').select('*').eq('id', authData.user.id).maybeSingle(),
        supabase.from('patient_profiles').select('*').eq('user_id', authData.user.id).maybeSingle(),
        supabase
          .from('hospital_profiles')
          .select('*')
          .eq('user_id', authData.user.id)
          .maybeSingle(),
      ]);

      const role = normalizeRole(userRow?.role || 'patient');
      const profileData = {
        ...userRow,
        ...patientRow,
        first_name: patientRow?.full_name?.split(' ')?.[0],
        last_name: patientRow?.full_name?.split(' ')?.slice(1).join(' '),
        phone_number: patientRow?.phone,
        nin: patientRow?.nin,
        org_id: hospitalRow?.org_id,
        is_pro:
          patientRow?.tier === 'pro' ||
          patientRow?.is_pro === true ||
          authData.user.user_metadata?.is_pro === true,
      };

      if (portalMode === 'staff') {
        if (!['provider', 'researcher', 'insurer'].includes(role)) {
          throw new Error(
            'This account is not registered as hospital, researcher, or insurer staff.'
          );
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
        nin: (profileData as { nin?: string })?.nin,
        first_name: profileData?.first_name || authData.user.user_metadata?.first_name,
        last_name: profileData?.last_name || authData.user.user_metadata?.last_name,
        role,
        org_id: (profileData as { org_id?: string })?.org_id || formData.orgId.trim() || undefined,
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

  const identifierPlaceholder =
    method === 'email'
      ? 'you@example.com'
      : method === 'phone'
        ? '0801 234 5678'
        : '11-digit NIN';

  const inputClass =
    'min-h-[50px] w-full rounded-2xl border border-gray-200 bg-white px-4 text-sm font-semibold text-[#101217] outline-none transition-colors placeholder:font-medium placeholder:text-gray-300 focus:border-[#6183FF]';

  return (
    <div className="min-h-screen bg-white font-sora text-[#101217] lg:grid lg:grid-cols-[1.05fr_1fr]">
      <SEOTitle title="Log in" />

      <aside className="relative hidden overflow-hidden bg-[#020924] lg:flex lg:flex-col lg:justify-between lg:p-12">
        <img
          src="/assets/hero-bg-image-1.jpg"
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-35"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#020924] via-[#020924]/70 to-[#020924]/30" />
        <div
          aria-hidden
          className="absolute -right-24 top-1/3 h-72 w-72 rounded-full bg-[#6183FF]/25 blur-3xl"
        />

        <Link to="/" className="relative z-10 flex items-center gap-3">
          <img src="/logo.svg" alt="Selorah" className="h-10 w-10 object-contain" />
          <span className="text-xl font-bold tracking-tight text-white">Selorah Health</span>
        </Link>

        <div className="relative z-10 max-w-md">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-[11px] font-semibold text-white/70">
            <span className="h-1.5 w-1.5 rounded-full bg-[#5FFAB0]" />
            Patient-owned health records
          </div>
          <h1 className="text-4xl font-bold leading-[1.1] tracking-tight text-white xl:text-5xl">
            Your health story, everywhere you go.
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-white/55">
            One login for your records, your shares, and your emergency profile. Email, phone, or
            NIN.
          </p>

          <div className="mt-8 space-y-3">
            {[
              { icon: ShieldCheckIcon, text: 'Every access logged and revocable' },
              { icon: LockClosedIcon, text: 'Records encrypted at rest and in transit' },
              { icon: CheckCircleIcon, text: 'No data sold, ever' },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/10 text-[#8FA8FF]">
                  <item.icon className="h-4 w-4" />
                </span>
                <span className="text-xs font-semibold text-white/65">{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-[11px] font-medium text-white/30">
          Copyright (c) 2026, Selorah Health Limited.
        </p>
      </aside>

      <main className="flex min-h-screen flex-col justify-center px-5 py-10 sm:px-8 lg:min-h-0 lg:px-12">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-8 flex items-center justify-between lg:hidden">
            <Link to="/" className="flex items-center gap-2.5">
              <img src="/logo.svg" alt="Selorah" className="h-9 w-9 object-contain" />
              <span className="text-lg font-bold tracking-tight">Selorah Health</span>
            </Link>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Link
                to="/"
                className="flex items-center gap-1.5 text-xs font-bold text-gray-400 hover:text-[#101217]"
              >
                <ArrowLeftIcon className="h-3.5 w-3.5" />
                Home
              </Link>
            </div>
          </div>

          <div className="hidden items-center justify-between lg:flex">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#6183FF]">
              Welcome back
            </p>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Link
                to="/"
                className="flex items-center gap-1.5 text-xs font-bold text-gray-400 hover:text-[#101217]"
              >
                <ArrowLeftIcon className="h-3.5 w-3.5" />
                Back to site
              </Link>
            </div>
          </div>

          <h1 className="mt-3 text-3xl font-bold tracking-tight text-[#101217] sm:text-4xl">
            Log in to Selorah
          </h1>
          <p className="mt-2 text-sm font-medium leading-relaxed text-gray-500">
            Don&apos;t have an account?{' '}
            <Link to="/signup" className="font-bold text-[#6183FF] hover:underline">
              Create one
            </Link>
          </p>

          <div className="mt-7 flex rounded-2xl bg-gray-50 p-1">
            <button
              type="button"
              onClick={() => setPortalMode('patient')}
              className={`min-h-[42px] flex-1 rounded-xl text-xs font-bold transition-all ${
                portalMode === 'patient'
                  ? 'bg-white text-[#101217] shadow-sm'
                  : 'text-gray-400 hover:text-gray-600'
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
              className={`min-h-[42px] flex-1 rounded-xl text-xs font-bold transition-all ${
                portalMode === 'staff'
                  ? 'bg-white text-[#101217] shadow-sm'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              Hospital / Research / Insurer
            </button>
          </div>

          {portalMode === 'patient' && (
            <div className="mt-5 grid grid-cols-3 gap-2">
              {METHOD_TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = method === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      setMethod(tab.id);
                      setFormData((current) => ({ ...current, identifier: '' }));
                      setError(null);
                    }}
                    className={`flex min-h-[62px] flex-col items-center justify-center gap-1 rounded-2xl border text-[11px] font-bold transition-all ${
                      isActive
                        ? 'border-[#6183FF] bg-[#EEF2FF] text-[#6183FF]'
                        : 'border-gray-200 bg-white text-gray-400 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="h-4.5 w-4.5" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          )}

          {error && (
            <div
              role="alert"
              className="mt-5 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-xs font-semibold leading-relaxed text-red-600"
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            {portalMode === 'staff' && (
              <label className="block">
                <span className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.14em] text-gray-400">
                  Organization ID
                </span>
                <input
                  type="text"
                  required
                  placeholder="ORG-XXXXXXXXXX"
                  className={inputClass}
                  value={formData.orgId}
                  onChange={(event) =>
                    setFormData({ ...formData, orgId: event.target.value.toUpperCase() })
                  }
                />
                <span className="mt-1.5 block px-1 text-[10px] font-medium text-gray-400">
                  Issued when your organization joined Selorah. Ask your admin if unsure.
                </span>
              </label>
            )}

            <label className="block">
              <span className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.14em] text-gray-400">
                {portalMode === 'staff'
                  ? 'Work email'
                  : method === 'email'
                    ? 'Email address'
                    : method === 'phone'
                      ? 'Phone number'
                      : 'National Identification Number'}
              </span>
              <span className="relative block">
                <span className="pointer-events-none absolute left-4 top-1/2 flex -translate-y-1/2 text-gray-300">
                  {method === 'email' || portalMode === 'staff' ? (
                    <EnvelopeIcon className="h-4.5 w-4.5" />
                  ) : method === 'phone' ? (
                    <PhoneIcon className="h-4.5 w-4.5" />
                  ) : (
                    <IdentificationIcon className="h-4.5 w-4.5" />
                  )}
                </span>
                <input
                  type={
                    method === 'email' || portalMode === 'staff'
                      ? 'email'
                      : method === 'phone'
                        ? 'tel'
                        : 'text'
                  }
                  required
                  inputMode={method === 'nin' ? 'numeric' : undefined}
                  maxLength={method === 'nin' ? 11 : undefined}
                  autoComplete={
                    method === 'email' || portalMode === 'staff'
                      ? 'email'
                      : method === 'phone'
                        ? 'tel'
                        : 'off'
                  }
                  placeholder={portalMode === 'staff' ? 'you@hospital.org' : identifierPlaceholder}
                  className={`${inputClass} pl-11`}
                  value={formData.identifier}
                  onChange={(event) =>
                    setFormData({
                      ...formData,
                      identifier:
                        method === 'nin'
                          ? event.target.value.replace(/\D/g, '').slice(0, 11)
                          : event.target.value,
                    })
                  }
                />
              </span>
              {method === 'nin' && portalMode === 'patient' && (
                <span className="mt-1.5 block px-1 text-[10px] font-medium text-gray-400">
                  Use the 11-digit NIN saved on your Selorah profile.
                </span>
              )}
            </label>

            <label className="block">
              <span className="mb-1.5 flex items-center justify-between text-[10px] font-black uppercase tracking-[0.14em] text-gray-400">
                Password
                <Link to="/forgot-password" className="normal-case tracking-normal text-[#6183FF]">
                  Forgot?
                </Link>
              </span>
              <span className="relative block">
                <span className="pointer-events-none absolute left-4 top-1/2 flex -translate-y-1/2 text-gray-300">
                  <LockClosedIcon className="h-4.5 w-4.5" />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  className={`${inputClass} pl-11 pr-12`}
                  value={formData.password}
                  onChange={(event) => setFormData({ ...formData, password: event.target.value })}
                />
                <button
                  type="button"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-gray-300 transition-colors hover:bg-gray-50 hover:text-gray-500"
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-4.5 w-4.5" />
                  ) : (
                    <EyeIcon className="h-4.5 w-4.5" />
                  )}
                </button>
              </span>
            </label>

            <button
              type="submit"
              disabled={loading}
              className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-[#6183FF] px-5 text-sm font-bold text-white shadow-lg shadow-[#6183FF]/25 transition-all hover:bg-[#4D6ED6] active:scale-[0.99] disabled:opacity-60"
            >
              {loading ? (
                <>
                  <ArrowPathIcon className="h-4 w-4 animate-spin" />
                  Signing you in...
                </>
              ) : (
                'Log in'
              )}
            </button>
          </form>

          <div className="mt-6 flex items-center justify-center gap-2 text-[10px] font-semibold text-gray-400">
            <ShieldCheckIcon className="h-3.5 w-3.5 text-[#5FFAB0]" />
            Protected by encrypted sessions
          </div>
        </div>
      </main>
    </div>
  );
}
