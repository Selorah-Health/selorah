import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowPathIcon,
  CheckCircleIcon,
  EnvelopeIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import SEOTitle from '../components/SEOTitle';
import { createClient } from '../lib/supabase/client';
import { resolvePostAuthDestination } from '../lib/auth/postAuth';

function readUrlError() {
  if (typeof window === 'undefined') return '';
  const query = new URLSearchParams(window.location.search);
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  return (
    query.get('error_description') ||
    query.get('error') ||
    hash.get('error_description') ||
    hash.get('error') ||
    ''
  );
}

export default function AuthCallback() {
  const supabase = createClient();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const [email, setEmail] = useState('');
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let finished = false;
    let timer: number | undefined;

    const urlError = readUrlError();
    if (urlError) {
      setError(decodeURIComponent(urlError.replace(/\+/g, ' ')));
      return;
    }

    const finish = async () => {
      if (finished || cancelled) return;
      finished = true;

      try {
        const result = await resolvePostAuthDestination(supabase);
        if (cancelled) return;

        if (result.needsEmailConfirmation) {
          setEmail(result.session?.user.email || '');
          setNeedsConfirmation(true);
          return;
        }

        if (!result.session) {
          setError('We could not find a sign in session. Please log in again.');
          return;
        }

        navigate(result.destination, { replace: true });
      } catch (err) {
        if (cancelled) return;
        setError(
          err instanceof Error
            ? err.message
            : 'We could not complete the sign in. Please try again.'
        );
      }
    };

    const check = async () => {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (cancelled) return;
      if (sessionError) {
        setError(sessionError.message);
        return;
      }
      if (session) await finish();
    };

    void check();

    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (cancelled || !session) return;
      if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED') {
        void finish();
      }
    });

    timer = window.setTimeout(() => {
      if (cancelled || finished) return;
      finished = true;
      setError('We could not complete the sign in. Please try again.');
    }, 10000);

    return () => {
      cancelled = true;
      if (timer) window.clearTimeout(timer);
      data.subscription.unsubscribe();
    };
  }, [navigate, supabase]);

  const resend = async () => {
    if (!email) return;
    setResending(true);
    setResent(false);
    try {
      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });
      if (resendError) throw resendError;
      setResent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The confirmation email could not be sent.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F8F9FE] px-4 py-10 font-sora text-[#101217]">
      <SEOTitle title="Completing sign in" />
      <div className="w-full max-w-md rounded-[28px] border border-white/70 bg-white/90 p-6 text-center shadow-[0_30px_80px_-30px_rgba(5,8,26,0.35)] backdrop-blur-2xl sm:p-8">
        <Link to="/" className="inline-flex items-center gap-2.5">
          <img src="/logo.svg" alt="Selorah" className="h-9 w-9 object-contain" />
          <span className="text-lg font-bold tracking-tight">Selorah Health</span>
        </Link>

        {error ? (
          <>
            <span className="mx-auto mt-7 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-500">
              <ExclamationTriangleIcon className="h-7 w-7" />
            </span>
            <h1 className="mt-4 text-xl font-bold tracking-tight">Sign in could not finish</h1>
            <p className="mt-2 text-sm font-medium leading-relaxed text-gray-500">{error}</p>
            <Link
              to="/login"
              className="mt-6 flex min-h-[50px] w-full items-center justify-center rounded-2xl bg-primary px-5 text-sm font-bold text-white shadow-lg shadow-primary/25 transition-colors hover:bg-primary-hover"
            >
              Back to login
            </Link>
          </>
        ) : needsConfirmation ? (
          <>
            <span className="mx-auto mt-7 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <EnvelopeIcon className="h-7 w-7" />
            </span>
            <h1 className="mt-4 text-xl font-bold tracking-tight">Confirm your email</h1>
            <p className="mt-2 text-sm font-medium leading-relaxed text-gray-500">
              Open the confirmation link we sent to{' '}
              <span className="font-bold text-[#101217]">{email || 'your inbox'}</span>. After you
              confirm, you will continue to onboarding.
            </p>
            <button
              type="button"
              onClick={() => void resend()}
              disabled={resending || !email}
              className="mt-6 flex min-h-[50px] w-full items-center justify-center gap-2 rounded-2xl bg-primary px-5 text-sm font-bold text-white shadow-lg shadow-primary/25 transition-colors hover:bg-primary-hover disabled:opacity-60"
            >
              {resending ? <ArrowPathIcon className="h-4 w-4 animate-spin" /> : null}
              {resent ? 'Confirmation sent again' : resending ? 'Sending...' : 'Resend confirmation email'}
            </button>
            {resent && (
              <p className="mt-3 flex items-center justify-center gap-1.5 text-xs font-semibold text-[#15955C]">
                <CheckCircleIcon className="h-4 w-4" />
                Check your inbox and spam folder.
              </p>
            )}
            <Link
              to="/login"
              className="mt-4 inline-flex min-h-[44px] items-center justify-center text-xs font-bold text-gray-400 transition-colors hover:text-primary"
            >
              Back to login
            </Link>
          </>
        ) : (
          <>
            <span className="mx-auto mt-7 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <ArrowPathIcon className="h-7 w-7 animate-spin" />
            </span>
            <h1 className="mt-4 text-xl font-bold tracking-tight">Completing sign in</h1>
            <p className="mt-2 text-sm font-medium leading-relaxed text-gray-500">
              Checking your account and taking you to the right place.
            </p>
          </>
        )}

        <p className="mt-6 text-[10px] font-semibold text-gray-400">
          Protected by encrypted sessions
        </p>
      </div>
    </div>
  );
}
