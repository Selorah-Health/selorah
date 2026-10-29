import { Link } from 'react-router-dom';
import { useState } from 'react';
import {
  ArrowLeftIcon,
  ArrowPathIcon,
  BeakerIcon,
  BuildingOffice2Icon,
  CheckCircleIcon,
  EnvelopeIcon,
  EyeIcon,
  EyeSlashIcon,
  LockClosedIcon,
  PhoneIcon,
  ShieldCheckIcon,
  UserIcon,
} from '@heroicons/react/24/outline';
import SEOTitle from '../components/SEOTitle';
import ThemeToggle from '../components/ThemeToggle';
import { createClient } from '../lib/supabase/client';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ROLE_OPTIONS = [
  { id: 'patient' as const, title: 'Patient', desc: 'Own your health records', icon: UserIcon },
  {
    id: 'hospital' as const,
    title: 'Hospital',
    desc: 'Clinic and provider portal',
    icon: BuildingOffice2Icon,
  },
  {
    id: 'researcher' as const,
    title: 'Researcher',
    desc: 'Studies and cohorts',
    icon: BeakerIcon,
  },
  {
    id: 'insurer' as const,
    title: 'Insurer',
    desc: 'Claims and policies',
    icon: ShieldCheckIcon,
  },
];

export default function Signup() {
  const supabase = createClient();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState(1);
  const [submittedEmail, setSubmittedEmail] = useState('');
  const [formData, setFormData] = useState({
    role: 'patient' as 'patient' | 'hospital' | 'researcher' | 'insurer',
    firstName: '',
    lastName: '',
    orgName: '',
    workEmail: '',
    email: '',
    phone: '',
    password: '',
    agree: false,
  });

  const isOrg =
    formData.role === 'hospital' ||
    formData.role === 'researcher' ||
    formData.role === 'insurer';

  const update = (key: keyof typeof formData, value: string | boolean) =>
    setFormData((current) => ({ ...current, [key]: value }));

  const passwordScore = (() => {
    const value = formData.password;
    let score = 0;
    if (value.length >= 8) score += 1;
    if (value.length >= 12) score += 1;
    if (/[A-Z]/.test(value) && /[a-z]/.test(value)) score += 1;
    if (/\d/.test(value) || /[^A-Za-z0-9]/.test(value)) score += 1;
    return Math.min(score, 4);
  })();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    const signupEmail = isOrg ? formData.workEmail.trim() : formData.email.trim();

    if (!EMAIL_RE.test(signupEmail)) {
      setError(
        isOrg
          ? 'Enter a valid work or organization email address.'
          : 'Enter a valid email address. You can add your phone for phone login next.'
      );
      return;
    }

    if (!isOrg && (!formData.firstName.trim() || !formData.lastName.trim())) {
      setError('First and last name are required.');
      return;
    }

    if (isOrg && !formData.orgName.trim()) {
      setError('Organization name is required.');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    if (!formData.agree) {
      setError('Please accept the terms to continue.');
      return;
    }

    setLoading(true);

    const displayFirst = isOrg ? formData.orgName.trim() : formData.firstName.trim();
    const displayLast = isOrg ? '' : formData.lastName.trim();
    const phone = formData.phone.trim();

    try {
      const url = import.meta.env.VITE_SUPABASE_URL;
      const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
      if (!url || !key || url.includes('placeholder')) {
        throw new Error(
          'Authentication is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'
        );
      }

      const { error: authError } = await supabase.auth.signUp({
        email: signupEmail,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/onboarding`,
          data: {
            first_name: displayFirst,
            last_name: displayLast,
            org_name: isOrg ? formData.orgName.trim() : undefined,
            role: formData.role,
            phone: phone || undefined,
          },
        },
      });

      if (authError) throw authError;

      localStorage.setItem(
        'selorah_user',
        JSON.stringify({
          first_name: displayFirst,
          last_name: displayLast,
          org_name: isOrg ? formData.orgName.trim() : undefined,
          email: signupEmail,
          phone: phone || undefined,
          is_pro: false,
          role: formData.role,
        })
      );

      setSubmittedEmail(signupEmail);
      setStep(2);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong.';
      if (message.includes('Failed to fetch') || message.includes('NetworkError')) {
        setError('Unable to reach the authentication server. Check your connection.');
      } else if (message.toLowerCase().includes('already registered')) {
        setError('An account with this email already exists. Try logging in instead.');
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'min-h-[50px] w-full rounded-2xl border border-gray-200 bg-white px-4 text-sm font-semibold text-[#101217] outline-none transition-colors placeholder:font-medium placeholder:text-gray-300 focus:border-[#6183FF]';

  return (
    <div className="min-h-screen bg-white font-sora text-[#101217] lg:grid lg:grid-cols-[1.05fr_1fr]">
      <SEOTitle title="Create account" />

      <aside className="relative hidden overflow-hidden bg-[#020924] lg:flex lg:flex-col lg:justify-between lg:p-12">
        <img
          src="/assets/hero-bg-image-2.jpg"
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-35"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#020924] via-[#020924]/70 to-[#020924]/30" />
        <div
          aria-hidden
          className="absolute -left-24 bottom-1/4 h-72 w-72 rounded-full bg-[#5FFAB0]/15 blur-3xl"
        />

        <Link to="/" className="relative z-10 flex items-center gap-3">
          <img src="/logo.svg" alt="Selorah" className="h-10 w-10 object-contain" />
          <span className="text-xl font-bold tracking-tight text-white">Selorah Health</span>
        </Link>

        <div className="relative z-10 max-w-md">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-[11px] font-semibold text-white/70">
            <span className="h-1.5 w-1.5 rounded-full bg-[#5FFAB0]" />
            Your records. Your rules.
          </div>
          <h1 className="text-4xl font-bold leading-[1.1] tracking-tight text-white xl:text-5xl">
            Own your health data, everywhere you go.
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-white/55">
            Join patients, hospitals, researchers and insurers building a portable health record
            for Africa.
          </p>

          <div className="mt-8 space-y-3">
            {[
              'Free forever for patients',
              'Share with a time-limited QR code',
              'Revoke access whenever you want',
            ].map((item) => (
              <div key={item} className="flex items-center gap-3">
                <CheckCircleIcon className="h-4 w-4 shrink-0 text-[#5FFAB0]" />
                <span className="text-xs font-semibold text-white/65">{item}</span>
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

          {step === 1 ? (
            <>
              <div className="hidden items-center justify-between lg:flex">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#6183FF]">
                  Get started
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

              <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                Create your account
              </h1>
              <p className="mt-2 text-sm font-medium leading-relaxed text-gray-500">
                Already have one?{' '}
                <Link to="/login" className="font-bold text-[#6183FF] hover:underline">
                  Log in
                </Link>
              </p>

              {error && (
                <div
                  role="alert"
                  className="mt-5 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-xs font-semibold leading-relaxed text-red-600"
                >
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <div>
                  <p className="mb-2 text-[10px] font-black uppercase tracking-[0.14em] text-gray-400">
                    I am signing up as
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {ROLE_OPTIONS.map((role) => {
                      const Icon = role.icon;
                      const selected = formData.role === role.id;
                      return (
                        <button
                          key={role.id}
                          type="button"
                          onClick={() => {
                            update('role', role.id);
                            setError(null);
                          }}
                          className={`flex min-h-[70px] items-start gap-2.5 rounded-2xl border p-3 text-left transition-all ${
                            selected
                              ? 'border-[#6183FF] bg-[#EEF2FF]'
                              : 'border-gray-200 bg-white hover:border-gray-300'
                          }`}
                        >
                          <span
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
                              selected
                                ? 'bg-[#6183FF] text-white'
                                : 'bg-gray-50 text-gray-400'
                            }`}
                          >
                            <Icon className="h-4 w-4" />
                          </span>
                          <span className="min-w-0">
                            <span className="block text-xs font-bold text-[#101217]">
                              {role.title}
                            </span>
                            <span className="mt-0.5 block text-[10px] font-medium leading-snug text-gray-400">
                              {role.desc}
                            </span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {isOrg ? (
                  <>
                    <label className="block">
                      <span className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.14em] text-gray-400">
                        Organization name
                      </span>
                      <input
                        type="text"
                        required
                        autoComplete="organization"
                        placeholder={
                          formData.role === 'hospital'
                            ? 'Hospital or clinic name'
                            : formData.role === 'researcher'
                              ? 'Institution or research org'
                              : 'Insurance company name'
                        }
                        className={inputClass}
                        value={formData.orgName}
                        onChange={(event) => update('orgName', event.target.value)}
                      />
                    </label>

                    <label className="block">
                      <span className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.14em] text-gray-400">
                        Work email
                      </span>
                      <span className="relative block">
                        <EnvelopeIcon className="pointer-events-none absolute left-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-gray-300" />
                        <input
                          type="email"
                          required
                          autoComplete="email"
                          placeholder="you@hospital.org"
                          className={`${inputClass} pl-11`}
                          value={formData.workEmail}
                          onChange={(event) => update('workEmail', event.target.value)}
                        />
                      </span>
                    </label>

                    <p className="rounded-2xl bg-[#F8F9FE] px-4 py-3 text-[11px] font-medium leading-relaxed text-gray-500">
                      An Organization ID is issued after verification. Staff will need it to log in
                      to the provider portal.
                    </p>
                  </>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <label className="block">
                        <span className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.14em] text-gray-400">
                          First name
                        </span>
                        <input
                          type="text"
                          required
                          autoComplete="given-name"
                          placeholder="Ada"
                          className={inputClass}
                          value={formData.firstName}
                          onChange={(event) => update('firstName', event.target.value)}
                        />
                      </label>
                      <label className="block">
                        <span className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.14em] text-gray-400">
                          Last name
                        </span>
                        <input
                          type="text"
                          required
                          autoComplete="family-name"
                          placeholder="Okafor"
                          className={inputClass}
                          value={formData.lastName}
                          onChange={(event) => update('lastName', event.target.value)}
                        />
                      </label>
                    </div>

                    <label className="block">
                      <span className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.14em] text-gray-400">
                        Email address
                      </span>
                      <span className="relative block">
                        <EnvelopeIcon className="pointer-events-none absolute left-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-gray-300" />
                        <input
                          type="email"
                          required
                          autoComplete="email"
                          placeholder="you@example.com"
                          className={`${inputClass} pl-11`}
                          value={formData.email}
                          onChange={(event) => update('email', event.target.value)}
                        />
                      </span>
                    </label>

                    <label className="block">
                      <span className="mb-1.5 flex items-center justify-between text-[10px] font-black uppercase tracking-[0.14em] text-gray-400">
                        Phone number
                        <span className="font-semibold normal-case tracking-normal text-gray-300">
                          Optional
                        </span>
                      </span>
                      <span className="relative block">
                        <PhoneIcon className="pointer-events-none absolute left-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-gray-300" />
                        <input
                          type="tel"
                          autoComplete="tel"
                          placeholder="0801 234 5678"
                          className={`${inputClass} pl-11`}
                          value={formData.phone}
                          onChange={(event) => update('phone', event.target.value)}
                        />
                      </span>
                      <span className="mt-1.5 block px-1 text-[10px] font-medium text-gray-400">
                        Add this to log in with your phone instead of email.
                      </span>
                    </label>
                  </>
                )}

                <label className="block">
                  <span className="mb-1.5 flex items-center justify-between text-[10px] font-black uppercase tracking-[0.14em] text-gray-400">
                    Password
                    <span className="font-semibold normal-case tracking-normal text-gray-300">
                      Min. 8 characters
                    </span>
                  </span>
                  <span className="relative block">
                    <LockClosedIcon className="pointer-events-none absolute left-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-gray-300" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      autoComplete="new-password"
                      placeholder="Create a strong password"
                      className={`${inputClass} pl-11 pr-12`}
                      value={formData.password}
                      onChange={(event) => update('password', event.target.value)}
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
                  {formData.password && (
                    <span className="mt-2 flex gap-1.5" aria-hidden>
                      {[0, 1, 2, 3].map((index) => (
                        <span
                          key={index}
                          className={`h-1 flex-1 rounded-full transition-colors ${
                            index < passwordScore
                              ? passwordScore >= 3
                                ? 'bg-[#5FFAB0]'
                                : 'bg-[#6183FF]'
                              : 'bg-gray-100'
                          }`}
                        />
                      ))}
                    </span>
                  )}
                </label>

                <label className="flex cursor-pointer items-start gap-3 rounded-2xl bg-[#F8F9FE] px-4 py-3">
                  <input
                    type="checkbox"
                    checked={formData.agree}
                    onChange={(event) => update('agree', event.target.checked)}
                    className="mt-0.5 h-4 w-4 shrink-0 rounded border-gray-300 text-[#6183FF] focus:ring-[#6183FF]"
                  />
                  <span className="text-[11px] font-medium leading-relaxed text-gray-500">
                    I agree to the{' '}
                    <Link to="/terms" className="font-bold text-[#6183FF] hover:underline">
                      Terms and Conditions
                    </Link>{' '}
                    and the{' '}
                    <Link to="/privacy" className="font-bold text-[#6183FF] hover:underline">
                      Privacy Policy
                    </Link>
                    .
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={loading || !formData.agree}
                  className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-[#6183FF] px-5 text-sm font-bold text-white shadow-lg shadow-[#6183FF]/25 transition-all hover:bg-[#4D6ED6] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <ArrowPathIcon className="h-4 w-4 animate-spin" />
                      Creating your account...
                    </>
                  ) : (
                    'Create account'
                  )}
                </button>
              </form>

              <p className="mt-5 flex items-center justify-center gap-1.5 text-[10px] font-semibold text-gray-400">
                <ShieldCheckIcon className="h-3.5 w-3.5 text-[#5FFAB0]" />
                Encrypted account. No health data sold.
              </p>
            </>
          ) : (
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#EAFBF2] text-[#15955C]">
                <CheckCircleIcon className="h-8 w-8" />
              </div>
              <h1 className="mt-5 text-2xl font-bold tracking-tight sm:text-3xl">
                Check your email
              </h1>
              <p className="mt-2 text-sm font-medium leading-relaxed text-gray-500">
                We sent a confirmation link to
              </p>
              <p className="mt-1 break-all text-sm font-bold text-[#101217]">{submittedEmail}</p>
              <p className="mx-auto mt-4 max-w-sm text-xs font-medium leading-relaxed text-gray-400">
                Open the email and confirm your address, then log in to finish setting up your
                profile. Check spam if it does not arrive in a minute.
              </p>

              <Link
                to="/login"
                className="mt-7 flex min-h-[52px] w-full items-center justify-center rounded-2xl bg-[#6183FF] px-5 text-sm font-bold text-white shadow-lg shadow-[#6183FF]/25 transition-colors hover:bg-[#4D6ED6]"
              >
                Go to log in
              </Link>

              <button
                type="button"
                onClick={() => setStep(1)}
                className="mt-3 min-h-[44px] w-full rounded-2xl text-xs font-bold text-gray-400 transition-colors hover:text-gray-600"
              >
                Back to the form
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
