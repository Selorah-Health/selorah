import { useState, useEffect } from 'react';
import { createClient } from '../lib/supabase/client';

export type WaitlistRole = 'patient' | 'doctor' | 'hospital' | 'other';

interface WaitlistModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Pre-select role when opened from a section CTA */
  initialRole?: WaitlistRole;
  /** Track where the signup came from */
  source?: string;
}

const ROLES: { id: WaitlistRole; label: string }[] = [
  { id: 'patient', label: 'Patient' },
  { id: 'doctor', label: 'Doctor' },
  { id: 'hospital', label: 'Hospital' },
  { id: 'other', label: 'Other' },
];

const FRUSTRATIONS = [
  'Lost or incomplete files',
  'Repeating my history every visit',
  "Clinic systems don't talk to each other",
  'Access for family / emergencies',
  'Other',
];

export default function WaitlistModal({
  isOpen,
  onClose,
  initialRole = 'patient',
  source = 'unknown',
}: WaitlistModalProps) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<WaitlistRole>(initialRole);
  const [showName, setShowName] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'survey'>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [frustration, setFrustration] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setStatus('idle');
      setFullName('');
      setEmail('');
      setRole(initialRole);
      setShowName(false);
      setErrorMsg(null);
      setFrustration(null);
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, initialRole]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setStatus('loading');
    setErrorMsg(null);

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
          'Supabase env vars are missing in this build. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY, then redeploy.'
        );
      }

      const supabase = createClient();
      const row: Record<string, string> = {
        email: email.trim().toLowerCase(),
        full_name: fullName.trim() || email.trim().split('@')[0],
        role,
        source,
      };

      const { error } = await supabase.from('waitlist').insert(row);

      if (error) {
        // Retry without optional columns if schema not migrated yet
        if (/column .* does not exist/i.test(error.message)) {
          const { error: e2 } = await supabase.from('waitlist').insert({
            email: row.email,
            full_name: row.full_name,
          });
          if (e2) {
            if (e2.code === '23505' || /duplicate|unique/i.test(e2.message)) {
              throw new Error('This email is already on the waitlist.');
            }
            throw new Error(e2.message || 'Failed to join waitlist');
          }
        } else if (error.code === '23505' || /duplicate|unique/i.test(error.message)) {
          throw new Error('This email is already on the waitlist.');
        } else if (error.code === '42P01' || /does not exist/i.test(error.message)) {
          throw new Error('Waitlist table is missing. Run the waitlist SQL in Supabase.');
        } else if (
          error.code === '42501' ||
          /row-level security|permission denied/i.test(error.message)
        ) {
          throw new Error('Blocked by database security. Add an INSERT policy for anon on waitlist.');
        } else {
          throw new Error(error.message || 'Failed to join waitlist');
        }
      }

      setStatus('success');
    } catch (err: unknown) {
      let message =
        err instanceof Error ? err.message : 'An error occurred. Please try again.';
      if (/Failed to fetch|NetworkError|Load failed|fetch failed/i.test(message)) {
        message =
          'Could not reach Supabase. Check VITE_SUPABASE_URL, that the project is active, and redeploy after setting env vars.';
      }
      setErrorMsg(message);
      setStatus('idle');
    }
  };

  const saveFrustration = async (value: string) => {
    setFrustration(value);
    try {
      const supabase = createClient();
      await supabase
        .from('waitlist')
        .update({ frustration: value })
        .eq('email', email.trim().toLowerCase());
    } catch {
      // non-blocking
    }
    setStatus('survey');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative bg-[#111224] border border-[#6183FF]/20 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-[#6183FF] opacity-10 blur-3xl rounded-full pointer-events-none" />

        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#A0A4C8] hover:text-white transition-colors p-2 min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="Close"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {status === 'success' || status === 'survey' ? (
          <div className="text-center py-4 sm:py-6">
            <div className="w-16 h-16 bg-[#5DFFAD]/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="#5DFFAD" className="w-8 h-8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-white mb-3 tracking-tight">You are in!</h3>
            <p className="text-[#A0A4C8] text-base sm:text-lg leading-relaxed mb-6">
              We&apos;ll email you when early access opens
              {fullName ? (
                <>
                  , <span className="text-white font-medium">{fullName}</span>
                </>
              ) : null}
              .
            </p>

            {status === 'success' && (
              <div className="text-left bg-white/5 border border-white/10 rounded-2xl p-4 mb-6">
                <p className="text-sm font-semibold text-white mb-3">
                  Optional — what&apos;s your biggest frustration with medical records?
                </p>
                <div className="flex flex-col gap-2">
                  {FRUSTRATIONS.map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => saveFrustration(f)}
                      className="text-left text-sm px-3 py-2.5 rounded-xl border border-white/10 text-[#A0A4C8] hover:border-[#6183FF]/50 hover:text-white hover:bg-white/5 transition-all min-h-[44px]"
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {status === 'survey' && (
              <p className="text-[#5DFFAD] text-sm mb-6">Thanks — that helps us prioritise what to build.</p>
            )}

            <button
              onClick={onClose}
              className="w-full bg-[#6183FF] text-white font-medium py-3.5 rounded-full hover:bg-[#4D6ED6] transition-colors min-h-[48px]"
            >
              Back to Home
            </button>
          </div>
        ) : (
          <div>
            <h3 className="text-2xl font-bold text-white mb-2 tracking-tight">Join the early wave</h3>
            <p className="text-[#A0A4C8] mb-6 text-sm sm:text-base">
              Be first when Selorah opens in your city. No spam — only access updates.
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              {errorMsg && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm">
                  {errorMsg}
                </div>
              )}

              <div>
                <p className="block text-sm font-medium text-[#A0A4C8] mb-2">I&apos;m joining as</p>
                <div className="grid grid-cols-2 gap-2">
                  {ROLES.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setRole(r.id)}
                      className={`py-2.5 px-3 rounded-xl text-sm font-semibold border transition-all min-h-[44px] ${
                        role === r.id
                          ? 'border-[#6183FF] bg-[#6183FF]/20 text-white'
                          : 'border-white/10 text-[#A0A4C8] hover:border-white/30'
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-[#A0A4C8] mb-1.5">
                  Email address
                </label>
                <input
                  type="email"
                  id="email"
                  required
                  autoComplete="email"
                  inputMode="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@email.com"
                  className="w-full bg-[#0A0B14] border border-[#6183FF]/20 rounded-xl px-4 py-3.5 text-white text-base placeholder-[#6B6F8E] focus:outline-none focus:border-[#6183FF] focus:ring-1 focus:ring-[#6183FF] transition-all min-h-[48px]"
                />
              </div>

              {showName ? (
                <div>
                  <label htmlFor="fullName" className="block text-sm font-medium text-[#A0A4C8] mb-1.5">
                    Full name <span className="text-white/40">(optional)</span>
                  </label>
                  <input
                    type="text"
                    id="fullName"
                    autoComplete="name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Your name"
                    className="w-full bg-[#0A0B14] border border-[#6183FF]/20 rounded-xl px-4 py-3.5 text-white text-base placeholder-[#6B6F8E] focus:outline-none focus:border-[#6183FF] min-h-[48px]"
                  />
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowName(true)}
                  className="text-sm text-[#6183FF] hover:underline"
                >
                  + Add your name (optional)
                </button>
              )}

              <button
                type="submit"
                disabled={status === 'loading'}
                className="w-full bg-[#6183FF] text-white font-semibold py-3.5 rounded-xl hover:bg-[#4D6ED6] transition-colors flex items-center justify-center gap-2 min-h-[48px] disabled:opacity-60"
              >
                {status === 'loading' ? (
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  'Join waitlist'
                )}
              </button>

              <p className="text-[11px] sm:text-xs text-center text-[#6B6F8E] leading-relaxed">
                Your data stays yours. We never sell health information. Unsubscribe anytime.
              </p>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
