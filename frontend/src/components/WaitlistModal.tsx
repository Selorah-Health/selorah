import { useEffect, useRef, useState } from 'react';
import {
  ArrowRightIcon,
  CheckIcon,
  EnvelopeIcon,
  ShareIcon,
  UserIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { createClient } from '../lib/supabase/client';

export type WaitlistRole = 'patient' | 'doctor' | 'hospital' | 'other';

interface WaitlistModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialRole?: WaitlistRole;
  source?: string;
}

const ROLES: { id: WaitlistRole; label: string; hint: string }[] = [
  { id: 'patient', label: 'Patient', hint: 'Own my records' },
  { id: 'doctor', label: 'Doctor', hint: 'Treat with context' },
  { id: 'hospital', label: 'Hospital', hint: 'Faster intake' },
  { id: 'other', label: 'Other', hint: 'Partner or ally' },
];

const FRUSTRATIONS = [
  'Lost or incomplete files',
  'Repeating my history every visit',
  'Clinic systems do not talk to each other',
  'Access for family or emergencies',
  'Other',
];

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function WaitlistModal({
  isOpen,
  onClose,
  initialRole = 'patient',
  source = 'unknown',
}: WaitlistModalProps) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<WaitlistRole>(initialRole);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'survey'>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [savingSurvey, setSavingSurvey] = useState(false);
  const [copied, setCopied] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    setStatus('idle');
    setFullName('');
    setEmail('');
    setRole(initialRole);
    setErrorMsg(null);
    setCopied(false);

    const focusTimer = setTimeout(() => nameRef.current?.focus(), 80);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);

    return () => {
      clearTimeout(focusTimer);
      document.body.style.overflow = previousOverflow || 'unset';
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen, initialRole, onClose]);

  if (!isOpen) return null;

  const validate = () => {
    if (fullName.trim().length < 2) {
      return 'Tell us your full name so we can welcome you properly.';
    }
    if (!EMAIL_PATTERN.test(email.trim())) {
      return 'Enter a valid email address.';
    }
    return null;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const validationError = validate();
    if (validationError) {
      setErrorMsg(validationError);
      return;
    }

    setStatus('loading');
    setErrorMsg(null);
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = fullName.trim();

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

      if (
        !supabaseUrl ||
        !supabaseKey ||
        supabaseUrl.includes('placeholder') ||
        supabaseKey === 'placeholder'
      ) {
        throw new Error(
          'Waitlist signup is not configured yet. Please try again later or contact support.'
        );
      }

      const supabase = createClient();
      const row: Record<string, string> = {
        email: cleanEmail,
        full_name: cleanName,
        role,
        source,
      };

      const { error } = await supabase.from('waitlist').insert(row);

      if (error) {
        if (/column .* does not exist/i.test(error.message)) {
          const { error: fallbackError } = await supabase.from('waitlist').insert({
            email: cleanEmail,
            full_name: cleanName,
          });
          if (fallbackError) {
            if (fallbackError.code === '23505' || /duplicate|unique/i.test(fallbackError.message)) {
              throw new Error('already-on-list');
            }
            throw new Error(fallbackError.message || 'Failed to join waitlist');
          }
        } else if (error.code === '23505' || /duplicate|unique/i.test(error.message)) {
          throw new Error('already-on-list');
        } else if (error.code === '42P01' || /does not exist/i.test(error.message)) {
          throw new Error('The waitlist is not available right now. Please try again soon.');
        } else if (
          error.code === '42501' ||
          /row-level security|permission denied/i.test(error.message)
        ) {
          throw new Error('The waitlist is temporarily closed. Please try again soon.');
        } else {
          throw new Error(error.message || 'Failed to join waitlist');
        }
      }

      setStatus('success');
    } catch (error: unknown) {
      let message = error instanceof Error ? error.message : 'Something went wrong. Please try again.';
      if (message === 'already-on-list') {
        setStatus('success');
        return;
      }
      if (/Failed to fetch|NetworkError|Load failed|fetch failed/i.test(message)) {
        message =
          'We could not reach the server. Check your connection and try again in a moment.';
      }
      setErrorMsg(message);
      setStatus('idle');
    }
  };

  const saveFrustration = async (value: string) => {
    setSavingSurvey(true);
    try {
      const supabase = createClient();
      await supabase
        .from('waitlist')
        .update({ frustration: value })
        .eq('email', email.trim().toLowerCase());
    } catch {
      // This is optional and should never block the success state.
    } finally {
      setSavingSurvey(false);
      setStatus('survey');
    }
  };

  const shareWaitlist = async () => {
    const shareData = {
      title: 'Selorah Health',
      text: 'Join me on the Selorah Health waitlist. Own your medical records.',
      url: window.location.origin,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareData.url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2200);
      }
    } catch {
      // Sharing is optional.
    }
  };

  const success = status === 'success' || status === 'survey';

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-[#05081a]/70 p-0 backdrop-blur-md sm:items-center sm:p-5"
      role="dialog"
      aria-modal="true"
      aria-labelledby="waitlist-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="relative max-h-[94dvh] w-full max-w-[440px] overflow-hidden rounded-t-[32px] border border-white/10 bg-[#0B0E1F] text-white shadow-[0_32px_120px_-20px_rgba(0,0,0,0.8)] animate-in slide-in-from-bottom-4 sm:rounded-[32px]">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-28 left-1/2 h-56 w-[130%] -translate-x-1/2 rounded-full bg-[#6183FF] opacity-25 blur-[90px]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent"
        />

        <button
          type="button"
          onClick={onClose}
          aria-label="Close waitlist"
          className="absolute right-3 top-3 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>

        <div className="relative max-h-[94dvh] overflow-y-auto p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:p-8">
          {success ? (
            <div className="pt-3 text-center">
              <div className="relative mx-auto mb-6 flex h-20 w-20 items-center justify-center">
                <span className="absolute inset-0 rounded-full bg-[#5FFAB0]/15" />
                <span className="absolute inset-2 rounded-full border border-[#5FFAB0]/30" />
                <CheckIcon className="relative h-9 w-9 text-[#5FFAB0]" strokeWidth={2.4} />
              </div>

              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#5FFAB0]">
                You are on the list
              </p>
              <h3
                id="waitlist-title"
                className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl"
              >
                Welcome, {fullName.split(' ')[0] || 'friend'}.
              </h3>
              <p className="mx-auto mt-3 max-w-xs text-sm leading-relaxed text-[#9AA0C4]">
                We will email <span className="font-semibold text-white">{email}</span> when early
                access opens in your area.
              </p>

              {status === 'success' && (
                <div className="mt-7 rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-left">
                  <p className="text-sm font-semibold text-white">
                    Optional: what is your biggest frustration with medical records?
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {FRUSTRATIONS.map((frustration) => (
                      <button
                        key={frustration}
                        type="button"
                        onClick={() => saveFrustration(frustration)}
                        disabled={savingSurvey}
                        className="min-h-[38px] rounded-full border border-white/10 px-3 py-2 text-left text-[11px] font-medium text-[#B7BCDA] transition-all hover:border-[#6183FF]/60 hover:bg-[#6183FF]/10 hover:text-white disabled:opacity-50"
                      >
                        {frustration}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => setStatus('survey')}
                    className="mt-3 text-[11px] font-semibold text-[#7E86AF] transition-colors hover:text-white"
                  >
                    Skip for now
                  </button>
                </div>
              )}

              {status === 'survey' && (
                <p className="mt-7 text-sm font-medium text-[#5FFAB0]">
                  Thanks. That helps us decide what to build first.
                </p>
              )}

              <div className="mt-7 grid gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#6183FF] to-[#4D6ED6] text-sm font-bold text-white shadow-lg shadow-[#6183FF]/25 transition-all hover:brightness-110 active:scale-[0.99]"
                >
                  Back to home
                  <ArrowRightIcon className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={shareWaitlist}
                  className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] text-sm font-semibold text-white/80 transition-all hover:bg-white/[0.07]"
                >
                  <ShareIcon className="h-4 w-4" />
                  {copied ? 'Link copied' : 'Invite a friend'}
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div className="pr-12">
                <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#5FFAB0]" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/60">
                    Early access
                  </span>
                </div>
                <h3
                  id="waitlist-title"
                  className="text-2xl font-bold leading-tight tracking-tight sm:text-[1.75rem]"
                >
                  Your records.
                  <br />
                  <span className="text-[#6183FF]">Your rules.</span>
                </h3>
                <p className="mt-2.5 text-sm leading-relaxed text-[#9AA0C4]">
                  Join the early wave and be first when Selorah opens in your city. Access updates
                  only, never spam.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="mt-7 space-y-5" noValidate>
                {errorMsg && (
                  <div
                    role="alert"
                    className="rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-300"
                  >
                    {errorMsg}
                  </div>
                )}

                <div>
                  <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-white/40">
                    I am joining as
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {ROLES.map((option) => {
                      const selected = role === option.id;
                      return (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => setRole(option.id)}
                          aria-pressed={selected}
                          className={`min-h-[54px] rounded-2xl border px-3 py-2 text-left transition-all ${
                            selected
                              ? 'border-[#6183FF] bg-[#6183FF]/15 shadow-[inset_0_0_0_1px_rgba(97,131,255,0.65)]'
                              : 'border-white/10 bg-white/[0.03] hover:border-white/25'
                          }`}
                        >
                          <span className="flex items-center justify-between gap-2">
                            <span className="text-sm font-bold text-white">{option.label}</span>
                            {selected && <CheckIcon className="h-3.5 w-3.5 text-[#8FA8FF]" />}
                          </span>
                          <span className="mt-0.5 block text-[10px] font-medium text-white/40">
                            {option.hint}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold text-white/60">
                    Full name
                  </span>
                  <span className="relative block">
                    <UserIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
                    <input
                      ref={nameRef}
                      type="text"
                      required
                      autoComplete="name"
                      value={fullName}
                      onChange={(event) => {
                        setFullName(event.target.value);
                        setErrorMsg(null);
                      }}
                      placeholder="Your full name"
                      className="min-h-[50px] w-full rounded-2xl border border-white/10 bg-[#080A16] pl-11 pr-4 text-base text-white placeholder:text-white/25 focus:border-[#6183FF] focus:outline-none focus:ring-2 focus:ring-[#6183FF]/20"
                    />
                  </span>
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold text-white/60">
                    Email address
                  </span>
                  <span className="relative block">
                    <EnvelopeIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
                    <input
                      type="email"
                      required
                      autoComplete="email"
                      inputMode="email"
                      value={email}
                      onChange={(event) => {
                        setEmail(event.target.value);
                        setErrorMsg(null);
                      }}
                      placeholder="you@email.com"
                      className="min-h-[50px] w-full rounded-2xl border border-white/10 bg-[#080A16] pl-11 pr-4 text-base text-white placeholder:text-white/25 focus:border-[#6183FF] focus:outline-none focus:ring-2 focus:ring-[#6183FF]/20"
                    />
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="flex min-h-[50px] w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#6183FF] to-[#4D6ED6] text-sm font-bold text-white shadow-lg shadow-[#6183FF]/25 transition-all hover:brightness-110 active:scale-[0.99] disabled:opacity-60"
                >
                  {status === 'loading' ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Joining...
                    </>
                  ) : (
                    <>
                      Join the waitlist
                      <ArrowRightIcon className="h-4 w-4" />
                    </>
                  )}
                </button>

                <p className="text-center text-[11px] leading-relaxed text-white/30">
                  Your data stays yours. We never sell health information.
                </p>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
