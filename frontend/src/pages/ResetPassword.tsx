import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  EyeIcon,
  EyeSlashIcon,
  LockClosedIcon,
} from '@heroicons/react/24/outline';
import SEOTitle from '../components/SEOTitle';
import ThemeToggle from '../components/ThemeToggle';
import { clearLocalSession } from '../lib/auth/session';
import { createClient } from '../lib/supabase/client';

type ResetState = 'checking' | 'ready' | 'invalid' | 'saving' | 'success';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<ResetState>('checking');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    let settled = false;

    const settle = (next: ResetState) => {
      if (settled) return;
      settled = true;
      setStatus(next);
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && session)) {
        settle('ready');
      }
    });

    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) settle('ready');
    });

    const timer = window.setTimeout(() => settle('invalid'), 2500);

    return () => {
      window.clearTimeout(timer);
      subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError('Use at least 8 characters for your new password.');
      return;
    }

    if (password !== confirm) {
      setError('The two passwords do not match.');
      return;
    }

    setStatus('saving');

    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({ password });

      if (updateError) {
        if (updateError.message.toLowerCase().includes('session')) {
          setStatus('invalid');
          return;
        }
        throw updateError;
      }

      await supabase.auth.signOut();
      clearLocalSession();
      setStatus('success');
    } catch (err) {
      setStatus('ready');
      setError(err instanceof Error ? err.message : 'We could not update your password.');
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] font-sora text-[#101217]">
      <SEOTitle title="Choose a new password" />
      <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-5 py-10 sm:px-8">
        <div className="mb-8 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <img src="/logo.svg" alt="Selorah" className="h-9 w-9 object-contain" />
            <span className="text-lg font-bold tracking-tight">Selorah Health</span>
          </Link>
          <ThemeToggle />
        </div>

        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-[0_24px_60px_-48px_rgba(2,9,36,0.45)] sm:p-8">
          {status === 'checking' && (
            <div data-state="checking" className="py-8 text-center">
              <span className="mx-auto block h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              <p className="mt-4 text-sm font-semibold text-gray-500">Checking your reset link...</p>
            </div>
          )}

          {status === 'invalid' && (
            <div data-state="invalid" className="text-center">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#FFF1F0] text-[#D92D20]">
                <ExclamationCircleIcon className="h-6 w-6" strokeWidth={1.8} />
              </span>
              <h1 className="mt-4 text-2xl font-bold tracking-tight">This link is not valid</h1>
              <p className="mt-2 text-sm leading-relaxed text-gray-500">
                The reset link may have expired or already been used. Request a new one and try
                again.
              </p>
              <Link
                to="/forgot-password"
                className="mt-5 inline-flex min-h-[44px] items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-primary-hover"
              >
                Request a new link
              </Link>
            </div>
          )}

          {status === 'success' && (
            <div data-state="success" className="text-center">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#EAF8F1] text-[#0F9F6E]">
                <CheckCircleIcon className="h-6 w-6" strokeWidth={1.8} />
              </span>
              <h1 className="mt-4 text-2xl font-bold tracking-tight">Password updated</h1>
              <p className="mt-2 text-sm leading-relaxed text-gray-500">
                Your password has been changed. Log in with the new password to continue.
              </p>
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="mt-5 inline-flex min-h-[44px] items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-primary-hover"
              >
                Go to login
              </button>
            </div>
          )}

          {(status === 'ready' || status === 'saving') && (
            <div data-state={status}>
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-400 transition-colors hover:text-[#101217]"
              >
                <ArrowLeftIcon className="h-3.5 w-3.5" />
                Back to login
              </Link>
              <h1 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">
                Choose a new password
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-gray-500">
                Use at least 8 characters. A longer password with a mix of words is easier to
                remember and harder to guess.
              </p>

              {error && (
                <div
                  role="alert"
                  className="mt-5 flex gap-2.5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-xs font-semibold leading-relaxed text-red-600"
                >
                  <ExclamationCircleIcon className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2} />
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <label className="block">
                  <span className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.14em] text-gray-400">
                    New password
                  </span>
                  <span className="relative block">
                    <span className="pointer-events-none absolute left-4 top-1/2 flex -translate-y-1/2 text-gray-300">
                      <LockClosedIcon className="h-4.5 w-4.5" />
                    </span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={8}
                      autoComplete="new-password"
                      placeholder="At least 8 characters"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      className="min-h-[50px] w-full rounded-2xl border border-gray-200 bg-white pl-11 pr-12 text-sm font-semibold text-[#101217] outline-none transition-colors placeholder:font-medium placeholder:text-gray-300 focus:border-primary"
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

                <label className="block">
                  <span className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.14em] text-gray-400">
                    Confirm new password
                  </span>
                  <span className="relative block">
                    <span className="pointer-events-none absolute left-4 top-1/2 flex -translate-y-1/2 text-gray-300">
                      <LockClosedIcon className="h-4.5 w-4.5" />
                    </span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={8}
                      autoComplete="new-password"
                      placeholder="Repeat the new password"
                      value={confirm}
                      onChange={(event) => setConfirm(event.target.value)}
                      className="min-h-[50px] w-full rounded-2xl border border-gray-200 bg-white pl-11 pr-4 text-sm font-semibold text-[#101217] outline-none transition-colors placeholder:font-medium placeholder:text-gray-300 focus:border-primary"
                    />
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={status === 'saving'}
                  className="inline-flex min-h-[50px] w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {status === 'saving' ? 'Updating password...' : 'Update password'}
                </button>
              </form>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
