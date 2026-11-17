import { useEffect, useState } from 'react';
import {
  CheckCircleIcon,
  ClockIcon,
  ExclamationCircleIcon,
  IdentificationIcon,
  PencilSquareIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import { createClient } from '../lib/supabase/client';
import { useToast } from '../contexts/ToastContext';
import { isValidNin, writeLocalSession } from '../lib/auth/session';

type KycState =
  | { status: 'loading' }
  | { status: 'editing'; nin: string; message?: string }
  | { status: 'verifying'; nin: string }
  | { status: 'verified'; nin: string; message: string }
  | { status: 'pending'; nin: string; message: string }
  | { status: 'error'; nin: string; message: string };

function maskNin(nin: string) {
  if (nin.length < 4) return nin;
  return `${'•'.repeat(Math.max(0, nin.length - 4))}${nin.slice(-4)}`;
}

export default function Kyc() {
  const supabase = createClient();
  const { success, error: toastError } = useToast();
  const [state, setState] = useState<KycState>({ status: 'loading' });
  const [ninInput, setNinInput] = useState('');

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!active) return;

        if (!user) {
          setState({ status: 'error', nin: '', message: 'Sign in again to manage your KYC details.' });
          return;
        }

        const [{ data: profile }, metadata] = await Promise.all([
          supabase.from('patient_profiles').select('nin').eq('user_id', user.id).maybeSingle(),
          Promise.resolve(user.user_metadata || {}),
        ]);

        if (!active) return;

        const nin = String(profile?.nin || metadata.nin || '').trim();
        const verified = metadata.nin_verified === true;

        if (!nin) {
          setState({ status: 'editing', nin: '' });
          setNinInput('');
          return;
        }

        if (verified) {
          setState({
            status: 'verified',
            nin,
            message: 'Your NIN is verified. Clinicians can use it to find you when you share access.',
          });
        } else {
          setState({
            status: 'pending',
            nin,
            message: 'Your NIN is saved and waiting for review. You can verify it again at any time.',
          });
        }
        setNinInput(nin);
      } catch {
        if (active) {
          setState({
            status: 'error',
            nin: '',
            message: 'We could not load your KYC details. Refresh the page and try again.',
          });
        }
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, [supabase]);

  const saveNin = async (nin: string, verified: boolean) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error('Sign in again to save your NIN.');

    const { data: existing, error: lookupError } = await supabase
      .from('patient_profiles')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (lookupError) throw lookupError;

    if (existing) {
      const { error } = await supabase
        .from('patient_profiles')
        .update({ nin })
        .eq('user_id', user.id);
      if (error) throw error;
    } else {
      const { error } = await supabase.from('patient_profiles').insert({ user_id: user.id, nin });
      if (error) throw error;
    }

    await supabase.auth.updateUser({ data: { nin, nin_verified: verified } });
    writeLocalSession({ nin });
  };

  const verifyNin = async () => {
    const nin = ninInput.trim();

    if (!isValidNin(nin)) {
      setState({ status: 'error', nin, message: 'Enter all 11 digits of your NIN.' });
      return;
    }

    setState({ status: 'verifying', nin });

    try {
      const { data, error } = await supabase.functions.invoke('verify-nin', {
        body: { nin },
      });

      if (error) throw error;

      const result = data as { ok?: boolean; configured?: boolean; message?: string } | null;

      if (!result?.ok) {
        const message =
          result?.configured === false
            ? 'NIN lookup is not configured right now. You can save your NIN for review instead.'
            : result?.message || 'We could not verify this NIN. Check the number and try again.';
        setState({ status: 'error', nin, message });
        return;
      }

      await saveNin(nin, true);
      setState({
        status: 'verified',
        nin,
        message: 'Your NIN is verified. Clinicians can use it to find you when you share access.',
      });
      success('Your NIN is verified.', 'KYC updated');
    } catch (error) {
      setState({
        status: 'error',
        nin,
        message:
          error instanceof Error
            ? error.message
            : 'NIN lookup is unavailable. You can save your NIN for review instead.',
      });
    }
  };

  const saveForReview = async () => {
    const nin = ninInput.trim();

    if (!isValidNin(nin)) {
      setState({ status: 'error', nin, message: 'Enter all 11 digits of your NIN.' });
      return;
    }

    try {
      await saveNin(nin, false);
      setState({
        status: 'pending',
        nin,
        message: 'Your NIN is saved and waiting for review. You can verify it again at any time.',
      });
      success('Your NIN is saved for review.', 'KYC updated');
    } catch (error) {
      toastError(
        error instanceof Error ? error.message : 'We could not save your NIN.',
        'KYC not saved'
      );
    }
  };

  const startEditing = () => {
    const nin = 'nin' in state ? state.nin : '';
    setNinInput(nin);
    setState({ status: 'editing', nin });
  };

  const currentNin = 'nin' in state ? state.nin : '';
  const isBusy = state.status === 'verifying';
  const showForm = state.status === 'editing' || state.status === 'verifying' || state.status === 'error';

  return (
    <div className="space-y-5" data-state={state.status}>
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-primary">KYC</p>
        <h1 className="mt-2 text-2xl font-black tracking-tight text-[#101217]">
          Identity verification
        </h1>
        <p className="mt-2 max-w-2xl text-sm font-medium leading-relaxed text-[#6B7280]">
          Your NIN is optional during onboarding. Add it here when you are ready. It helps
          clinicians find your record and confirms that the profile belongs to you.
        </p>
      </div>

      <section className="overflow-hidden rounded-[28px] border border-gray-100 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-gray-100 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <IdentificationIcon className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-base font-black tracking-tight text-[#101217]">
                National Identification Number
              </h2>
              <p className="mt-1 text-xs font-medium leading-relaxed text-gray-500">
                {state.status === 'loading' && 'Checking your saved details...'}
                {state.status === 'editing' && 'No NIN saved yet.'}
                {state.status === 'verifying' && 'Checking your NIN with the identity service...'}
                {state.status === 'verified' && 'Verified on your patient profile.'}
                {state.status === 'pending' && 'Saved and waiting for review.'}
                {state.status === 'error' && 'We could not finish the check.'}
              </p>
            </div>
          </div>

          <span
            className={`inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] ${
              state.status === 'verified'
                ? 'bg-green-50 text-green-700'
                : state.status === 'pending'
                  ? 'bg-amber-50 text-amber-700'
                  : state.status === 'error'
                    ? 'bg-red-50 text-red-600'
                    : 'bg-gray-100 text-gray-500'
            }`}
          >
            {state.status === 'verified' && <ShieldCheckIcon className="h-3.5 w-3.5" />}
            {state.status === 'pending' && <ClockIcon className="h-3.5 w-3.5" />}
            {state.status === 'error' && <ExclamationCircleIcon className="h-3.5 w-3.5" />}
            {state.status === 'loading'
              ? 'Loading'
              : state.status === 'verified'
                ? 'Verified'
                : state.status === 'pending'
                  ? 'Pending review'
                  : state.status === 'error'
                    ? 'Needs attention'
                    : 'Not set'}
          </span>
        </div>

        <div className="p-5 sm:p-6">
          {state.status === 'loading' && (
            <div className="flex items-center gap-3 text-sm font-semibold text-gray-500">
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              Loading your KYC details
            </div>
          )}

          {!showForm && currentNin && (
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-gray-400">
                  Saved NIN
                </p>
                <p className="mt-1 font-mono text-lg font-bold tracking-[0.18em] text-[#101217]">
                  {maskNin(currentNin)}
                </p>
                {'message' in state && (
                  <p className="mt-2 max-w-xl text-xs font-medium leading-relaxed text-gray-500">
                    {state.message}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={startEditing}
                className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full border border-gray-200 bg-white px-4 text-xs font-bold text-[#101217] transition-colors hover:border-primary/40 hover:text-primary"
              >
                <PencilSquareIcon className="h-4 w-4" />
                Update NIN
              </button>
            </div>
          )}

          {showForm && (
            <div className="max-w-xl space-y-4">
              <label className="block">
                <span className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.14em] text-gray-400">
                  11-digit NIN
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={11}
                  value={ninInput}
                  onChange={(event) => setNinInput(event.target.value.replace(/\D/g, '').slice(0, 11))}
                  placeholder="Enter your NIN"
                  disabled={isBusy}
                  className="min-h-[48px] w-full rounded-xl border border-gray-200 bg-white px-4 font-mono text-sm font-semibold tracking-[0.12em] text-[#101217] outline-none transition-colors placeholder:font-sans placeholder:tracking-normal placeholder:text-gray-300 focus:border-primary disabled:opacity-60"
                />
              </label>

              {'message' in state && state.status === 'error' && (
                <p className="flex items-start gap-2 rounded-xl bg-red-50 px-3 py-2.5 text-[11px] font-semibold leading-relaxed text-red-600">
                  <ExclamationCircleIcon className="mt-0.5 h-4 w-4 shrink-0" />
                  {state.message}
                </p>
              )}

              <div className="flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={() => void verifyNin()}
                  disabled={isBusy || ninInput.length !== 11}
                  className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-full bg-primary px-5 text-xs font-bold text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isBusy ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Verifying
                    </>
                  ) : (
                    <>
                      <ShieldCheckIcon className="h-4 w-4" />
                      Verify NIN
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => void saveForReview()}
                  disabled={isBusy || ninInput.length !== 11}
                  className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-full border border-gray-200 bg-white px-5 text-xs font-bold text-[#101217] transition-colors hover:border-primary/40 hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ClockIcon className="h-4 w-4" />
                  Save for review
                </button>
              </div>

              <p className="text-[10px] font-medium leading-relaxed text-gray-400">
                Your NIN is stored on your patient profile and used for identity checks. It is never
                shown on a shared record.
              </p>
            </div>
          )}

          {state.status === 'verified' && (
            <p className="mt-4 flex items-start gap-2 rounded-xl bg-green-50 px-3 py-2.5 text-[11px] font-semibold leading-relaxed text-green-700">
              <CheckCircleIcon className="mt-0.5 h-4 w-4 shrink-0" />
              {state.message}
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
