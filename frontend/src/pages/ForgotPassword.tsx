import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  EnvelopeIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';
import SEOTitle from '../components/SEOTitle';
import ThemeToggle from '../components/ThemeToggle';
import { createClient } from '../lib/supabase/client';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();
      const redirectTo = `${window.location.origin}/reset-password`;
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo,
      });

      if (resetError) {
        if (resetError.message.toLowerCase().includes('rate limit')) {
          throw new Error('Too many requests. Wait a moment, then try again.');
        }
        throw resetError;
      }

      // Supabase does not reveal whether the address exists. Keep the same
      // message either way so this page cannot be used to enumerate accounts.
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'We could not send the reset link.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] font-sora text-[#101217]">
      <SEOTitle title="Reset your password" />
      <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-5 py-10 sm:px-8">
        <div className="mb-8 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <img src="/logo.svg" alt="Selorah" className="h-9 w-9 object-contain" />
            <span className="text-lg font-bold tracking-tight">Selorah Health</span>
          </Link>
          <ThemeToggle />
        </div>

        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-[0_24px_60px_-48px_rgba(2,9,36,0.45)] sm:p-8">
          {sent ? (
            <div data-state="sent" className="text-center">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#EAF8F1] text-[#0F9F6E]">
                <CheckCircleIcon className="h-6 w-6" strokeWidth={1.8} />
              </span>
              <h1 className="mt-4 text-2xl font-bold tracking-tight">Check your inbox</h1>
              <p className="mt-2 text-sm leading-relaxed text-gray-500">
                If an account exists for <span className="font-semibold text-[#101217]">{email}</span>,
                we sent a link to reset your password. The link expires after a short time.
              </p>
              <p className="mt-3 text-xs leading-relaxed text-gray-400">
                Do not see it? Check your spam folder, then request another link.
              </p>
              <button
                type="button"
                onClick={() => setSent(false)}
                className="mt-5 inline-flex min-h-[44px] items-center justify-center rounded-xl border border-[#E5E7EB] px-4 py-2 text-sm font-semibold text-[#4B5563] transition-colors hover:border-[#D5DCE8] hover:text-primary"
              >
                Use a different email
              </button>
            </div>
          ) : (
            <div data-state={loading ? 'sending' : 'idle'}>
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-400 transition-colors hover:text-[#101217]"
              >
                <ArrowLeftIcon className="h-3.5 w-3.5" />
                Back to login
              </Link>
              <h1 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">
                Forgot your password?
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-gray-500">
                Enter the email on your Selorah account. We will send a link you can use to choose a
                new password.
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
                    Email address
                  </span>
                  <span className="relative block">
                    <span className="pointer-events-none absolute left-4 top-1/2 flex -translate-y-1/2 text-gray-300">
                      <EnvelopeIcon className="h-4.5 w-4.5" />
                    </span>
                    <input
                      type="email"
                      required
                      autoComplete="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      className="min-h-[50px] w-full rounded-2xl border border-gray-200 bg-white pl-11 pr-4 text-sm font-semibold text-[#101217] outline-none transition-colors placeholder:font-medium placeholder:text-gray-300 focus:border-primary"
                    />
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex min-h-[50px] w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? 'Sending link...' : 'Send reset link'}
                </button>
              </form>
            </div>
          )}
        </div>

        <p className="mt-6 text-center text-xs font-medium text-gray-400">
          Remembered it?{' '}
          <Link to="/login" className="font-bold text-primary hover:underline">
            Log in
          </Link>
        </p>
      </main>
    </div>
  );
}
