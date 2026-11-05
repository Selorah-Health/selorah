import { useState } from 'react';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import { createClient } from '../lib/supabase/client';

type GoogleAuthButtonProps = {
  label?: string;
  next?: string;
};

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
      <path
        fill="#4285F4"
        d="M23.49 12.27c0-.79-.07-1.54-.2-2.27H12v4.51h6.47a5.53 5.53 0 0 1-2.4 3.63v3h3.88c2.27-2.09 3.54-5.17 3.54-8.87Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.07 7.95-2.91l-3.88-3c-1.08.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.95H1.26v3.09A12 12 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.29a7.2 7.2 0 0 1 0-4.58V6.62H1.26a12 12 0 0 0 0 10.76l4.01-3.09Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.76 0 3.34.61 4.58 1.8l3.44-3.44A11.96 11.96 0 0 0 12 0 12 12 0 0 0 1.26 6.62l4.01 3.09C6.22 6.86 8.87 4.75 12 4.75Z"
      />
    </svg>
  );
}

export default function GoogleAuthButton({
  label = 'Continue with Google',
  next = '/auth/callback',
}: GoogleAuthButtonProps) {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const start = async () => {
    setLoading(true);
    setError(null);

    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}${next}`,
          queryParams: { prompt: 'select_account' },
        },
      });
      if (oauthError) throw oauthError;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Google sign in could not start.';
      setError(
        message.toLowerCase().includes('provider is not enabled')
          ? 'Google sign in is not enabled yet. Ask the Selorah admin to enable Google in Supabase.'
          : message
      );
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        type="button"
        onClick={() => void start()}
        disabled={loading}
        className="flex min-h-[50px] w-full items-center justify-center gap-2.5 rounded-2xl border border-gray-200 bg-white px-5 text-sm font-bold text-[#101217] transition-colors hover:border-primary/40 hover:bg-[#F8F9FE] disabled:opacity-60"
      >
        {loading ? <ArrowPathIcon className="h-4 w-4 animate-spin text-primary" /> : <GoogleMark />}
        {loading ? 'Opening Google...' : label}
      </button>
      {error && (
        <p className="mt-2 rounded-xl border border-amber-100 bg-amber-50 px-3 py-2 text-[11px] font-semibold leading-relaxed text-amber-700">
          {error}
        </p>
      )}
    </div>
  );
}
