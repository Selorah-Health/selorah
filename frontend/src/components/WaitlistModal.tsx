import { useEffect, useRef, useState } from 'react';
import {
  ArrowRightIcon,
  BuildingOffice2Icon,
  CheckIcon,
  EnvelopeIcon,
  PhoneIcon,
  ShareIcon,
  UserIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { createClient } from '../lib/supabase/client';
import {
  normalizeWaitlistRole,
  WAITLIST_ROLES,
  type WaitlistRole,
} from '../lib/waitlist';

export type { WaitlistRole } from '../lib/waitlist';

interface WaitlistModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialRole?: WaitlistRole;
  source?: string;
}

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
  const [role, setRole] = useState<WaitlistRole>(() => normalizeWaitlistRole(initialRole));
  const [contactName, setContactName] = useState('');
  const [organization, setOrganization] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'survey' | 'already'>(
    'idle',
  );
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
    setRole(normalizeWaitlistRole(initialRole));
    setContactName('');
    setOrganization('');
    setSpecialty('');
    setCity('');
    setPhone('');
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
      return role === 'hospital'
        ? 'Enter your hospital or clinic name.'
        : 'Tell us your full name so we can welcome you properly.';
    }
    if (!EMAIL_PATTERN.test(email.trim())) {
      return 'Enter a valid email address.';
    }
    if (role === 'hospital' && contactName.trim().length < 2) {
      return 'Add the name of the person we should contact at the hospital.';
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
      const details: Record<string, string> = {};

      if (role === 'hospital') {
        details.contact_name = contactName.trim();
        if (city.trim()) details.city = city.trim();
        if (phone.trim()) details.phone = phone.trim();
      }

      if (role === 'doctor') {
        if (organization.trim()) details.organization = organization.trim();
        if (specialty.trim()) details.specialty = specialty.trim();
      }

      const { data: rpcData, error: rpcError } = await supabase.rpc('join_waitlist', {
        p_email: cleanEmail,
        p_full_name: cleanName,
        p_role: role,
        p_source: source,
        p_details: details,
      });

      if (!rpcError && rpcData) {
        const payload = rpcData as { already_on_list?: boolean };
        setStatus(payload.already_on_list ? 'already' : 'success');
        return;
      }

      const baseRow: Record<string, unknown> = {
        email: cleanEmail,
        full_name: cleanName,
        role,
        source,
      };
      if (Object.keys(details).length > 0) baseRow.details = details;

      const attempts: Record<string, unknown>[] = [
        baseRow,
        { email: cleanEmail, full_name: cleanName, role, source },
        { email: cleanEmail, full_name: cleanName, role },
        { email: cleanEmail, full_name: cleanName },
      ];

      let lastError: { message?: string; code?: string } | null = rpcError;

      for (const attempt of attempts) {
        const { error } = await supabase.from('waitlist').insert(attempt);
        if (!error) {
          setStatus('success');
          return;
        }

        lastError = error;

        if (error.code === '23505' || /duplicate|unique/i.test(error.message)) {
          setStatus('already');
          return;
        }

        if (/column .* does not exist/i.test(error.message)) continue;
        break;
      }

      const message = lastError?.message || 'Failed to join waitlist';
      if (lastError?.code === '42P01' || /does not exist/i.test(message)) {
        throw new Error('The waitlist is not available right now. Please try again soon.');
      }
      if (lastError?.code === '42501' || /row-level security|permission denied/i.test(message)) {
        throw new Error('The waitlist is temporarily closed. Please try again soon.');
      }
      throw new Error(message);
    } catch (error: unknown) {
      let message = error instanceof Error ? error.message : 'Something went wrong. Please try again.';
      if (message === 'already-on-list') {
        setStatus('already');
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
      text: 'I joined the Selorah Health waitlist. It gives patients ownership of their medical records. Join me:',
      url: window.location.origin,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
        setCopied(true);
        setTimeout(() => setCopied(false), 2200);
      }
    } catch {
      // Sharing is optional.
    }
  };

  const success = status === 'success' || status === 'survey' || status === 'already';
  const firstName = fullName.trim().split(' ')[0] || 'friend';
  const isHospital = role === 'hospital';

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
          className="pointer-events-none absolute -top-28 left-1/2 h-56 w-[130%] -translate-x-1/2 rounded-full bg-primary opacity-25 blur-[90px]"
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
                {status === 'already' ? 'Already on the list' : 'You are on the list'}
              </p>
              <h3
                id="waitlist-title"
                className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl"
              >
                {status === 'already'
                  ? `You are already on the list, ${firstName}.`
                  : isHospital
                    ? 'We have your hospital request.'
                    : `Welcome, ${firstName}.`}
              </h3>
              <p className="mx-auto mt-3 max-w-xs text-sm leading-relaxed text-[#9AA0C4]">
                {status === 'already' ? (
                  <>
                    We already have{' '}
                    <span className="font-semibold text-white">{email}</span> saved. We will email
                    you when early access opens in your area.
                  </>
                ) : (
                  <>
                    We will email <span className="font-semibold text-white">{email}</span> when
                    early access opens in your area.
                  </>
                )}
              </p>

              <div className="mt-7 rounded-2xl border border-[#5FFAB0]/20 bg-[#5FFAB0]/10 p-4 text-left">
                <p className="text-sm font-semibold text-white">Know someone who needs this?</p>
                <p className="mt-1 text-xs leading-relaxed text-[#B7BCDA]">
                  Invite a friend to join you on the waitlist. The more people who ask for portable
                  records, the faster we can bring Selorah to your city.
                </p>
              </div>

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
                        className="min-h-[38px] rounded-full border border-white/10 px-3 py-2 text-left text-[11px] font-medium text-[#B7BCDA] transition-all hover:border-primary/60 hover:bg-primary/10 hover:text-white disabled:opacity-50"
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
                  onClick={shareWaitlist}
                  className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-primary to-primary-hover text-sm font-bold text-white shadow-lg shadow-primary/25 transition-all hover:brightness-110 active:scale-[0.99]"
                >
                  <ShareIcon className="h-4 w-4" />
                  {copied ? 'Invite link copied' : 'Invite a friend'}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] text-sm font-semibold text-white/80 transition-all hover:bg-white/[0.07]"
                >
                  Back to home
                  <ArrowRightIcon className="h-4 w-4" />
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
                  <span className="text-primary">Your rules.</span>
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
                  <div className="grid grid-cols-3 gap-2">
                    {WAITLIST_ROLES.map((option) => {
                      const selected = role === option.id;
                      return (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => {
                            setRole(option.id);
                            setErrorMsg(null);
                          }}
                          aria-pressed={selected}
                          className={`min-h-[58px] rounded-2xl border px-2 py-2 text-left transition-all ${
                            selected
                              ? 'border-primary bg-primary/15 shadow-[inset_0_0_0_1px_rgba(97,131,255,0.65)]'
                              : 'border-white/10 bg-white/[0.03] hover:border-white/25'
                          }`}
                        >
                          <span className="flex items-center justify-between gap-1">
                            <span className="text-[12px] font-bold text-white">{option.label}</span>
                            {selected && <CheckIcon className="h-3 w-3 shrink-0 text-primary" />}
                          </span>
                          <span className="mt-0.5 block text-[9px] font-medium leading-tight text-white/40">
                            {option.hint}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold text-white/60">
                    {isHospital ? 'Hospital or clinic name' : 'Full name'}
                  </span>
                  <span className="relative block">
                    {isHospital ? (
                      <BuildingOffice2Icon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
                    ) : (
                      <UserIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
                    )}
                    <input
                      ref={nameRef}
                      type="text"
                      required
                      autoComplete={isHospital ? 'organization' : 'name'}
                      value={fullName}
                      onChange={(event) => {
                        setFullName(event.target.value);
                        setErrorMsg(null);
                      }}
                      placeholder={isHospital ? 'St. Mary Hospital' : 'Your full name'}
                      className="min-h-[50px] w-full rounded-2xl border border-white/10 bg-[#080A16] pl-11 pr-4 text-base text-white placeholder:text-white/25 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
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
                      className="min-h-[50px] w-full rounded-2xl border border-white/10 bg-[#080A16] pl-11 pr-4 text-base text-white placeholder:text-white/25 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </span>
                </label>

                {isHospital && (
                  <>
                    <label className="block">
                      <span className="mb-1.5 block text-xs font-semibold text-white/60">
                        Contact person
                      </span>
                      <span className="relative block">
                        <UserIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
                        <input
                          type="text"
                          required
                          autoComplete="name"
                          value={contactName}
                          onChange={(event) => {
                            setContactName(event.target.value);
                            setErrorMsg(null);
                          }}
                          placeholder="Who should we speak to?"
                          className="min-h-[50px] w-full rounded-2xl border border-white/10 bg-[#080A16] pl-11 pr-4 text-base text-white placeholder:text-white/25 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                      </span>
                    </label>

                    <div className="grid grid-cols-2 gap-3">
                      <label className="block">
                        <span className="mb-1.5 block text-xs font-semibold text-white/60">
                          City
                        </span>
                        <input
                          type="text"
                          autoComplete="address-level2"
                          value={city}
                          onChange={(event) => setCity(event.target.value)}
                          placeholder="Lagos"
                          className="min-h-[50px] w-full rounded-2xl border border-white/10 bg-[#080A16] px-4 text-base text-white placeholder:text-white/25 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                      </label>
                      <label className="block">
                        <span className="mb-1.5 block text-xs font-semibold text-white/60">
                          Phone
                        </span>
                        <span className="relative block">
                          <PhoneIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
                          <input
                            type="tel"
                            autoComplete="tel"
                            value={phone}
                            onChange={(event) => setPhone(event.target.value)}
                            placeholder="+234"
                            className="min-h-[50px] w-full rounded-2xl border border-white/10 bg-[#080A16] pl-11 pr-4 text-base text-white placeholder:text-white/25 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                          />
                        </span>
                      </label>
                    </div>
                  </>
                )}

                {role === 'doctor' && (
                  <div className="grid grid-cols-2 gap-3">
                    <label className="block">
                      <span className="mb-1.5 block text-xs font-semibold text-white/60">
                        Hospital or clinic
                      </span>
                      <input
                        type="text"
                        autoComplete="organization"
                        value={organization}
                        onChange={(event) => setOrganization(event.target.value)}
                        placeholder="Where you practise"
                        className="min-h-[50px] w-full rounded-2xl border border-white/10 bg-[#080A16] px-4 text-base text-white placeholder:text-white/25 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </label>
                    <label className="block">
                      <span className="mb-1.5 block text-xs font-semibold text-white/60">
                        Specialty
                      </span>
                      <input
                        type="text"
                        value={specialty}
                        onChange={(event) => setSpecialty(event.target.value)}
                        placeholder="Cardiology"
                        className="min-h-[50px] w-full rounded-2xl border border-white/10 bg-[#080A16] px-4 text-base text-white placeholder:text-white/25 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </label>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="flex min-h-[50px] w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-primary to-primary-hover text-sm font-bold text-white shadow-lg shadow-primary/25 transition-all hover:brightness-110 active:scale-[0.99] disabled:opacity-60"
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
