import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRightIcon,
  CheckCircleIcon,
  CreditCardIcon,
  IdentificationIcon,
  PhoneIcon,
  ShieldCheckIcon,
  StarIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import { createClient } from '../../lib/supabase/client';
import { isValidNin, readLocalSession, writeLocalSession } from '../../lib/auth/session';
import { readProState, type ProState } from '../../lib/pro';

interface ProfileProps {
  user: any;
  avatarGradient: string;
  isPro?: boolean;
}

export default function Profile({ user, avatarGradient, isPro: isProProp }: ProfileProps) {
  const [phone, setPhone] = useState('');
  const [nin, setNin] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageTone, setMessageTone] = useState<'success' | 'error'>('success');
  const [proState, setProState] = useState<ProState>(() => readProState());
  const navigate = useNavigate();
  const supabase = createClient();

  const isPro = Boolean(isProProp || proState.active);

  const loadProfile = useCallback(async () => {
    const local = readLocalSession();
    if (local?.nin) setNin(local.nin);
    if (local?.phone) setPhone(local.phone);

    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    if (!authUser) return;

    const { data } = await supabase
      .from('patient_profiles')
      .select('phone, nin')
      .eq('user_id', authUser.id)
      .maybeSingle();

    if (data?.phone) setPhone(data.phone);
    if (data?.nin) setNin(data.nin);
  }, [supabase]);

  useEffect(() => {
    loadProfile();
    const refreshPro = () => setProState(readProState());
    window.addEventListener('selorah:pro-updated', refreshPro);
    window.addEventListener('storage', refreshPro);
    return () => {
      window.removeEventListener('selorah:pro-updated', refreshPro);
      window.removeEventListener('storage', refreshPro);
    };
  }, [loadProfile]);

  const saveContactDetails = async () => {
    setMessage(null);

    if (nin && !isValidNin(nin)) {
      setMessageTone('error');
      setMessage('NIN must be exactly 11 digits.');
      return;
    }

    if (phone && phone.replace(/[^\d]/g, '').length < 10) {
      setMessageTone('error');
      setMessage('Enter a valid phone number with at least 10 digits.');
      return;
    }

    setSaving(true);
    try {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (!authUser) {
        setMessageTone('error');
        setMessage('Please log in to save your details.');
        return;
      }

      const { error } = await supabase
        .from('patient_profiles')
        .update({ phone: phone || null, nin: nin || null })
        .eq('user_id', authUser.id);

      if (error) throw error;

      writeLocalSession({ phone, nin });

      try {
        await supabase.auth.updateUser({ data: { phone: phone || null } });
      } catch {
        // Metadata is optional.
      }

      setMessageTone('success');
      setMessage('Contact details saved. You can now log in with your phone or NIN.');
    } catch (err) {
      setMessageTone('error');
      setMessage(err instanceof Error ? err.message : 'Could not save your details.');
    } finally {
      setSaving(false);
    }
  };

  const local = readLocalSession();
  const firstName =
    user?.user_metadata?.first_name || local?.first_name || user?.email?.split('@')[0] || 'Your';
  const lastName = user?.user_metadata?.last_name || local?.last_name || '';
  const email = user?.email || local?.email || 'No email on file';

  return (
    <div className="space-y-6 font-sora">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-[#101217] sm:text-3xl">
          Profile and settings
        </h2>
        <p className="mt-1 text-sm font-medium text-gray-400">
          Manage your identity, login methods, and plan.
        </p>
      </div>

      <section className="rounded-[28px] border border-gray-50 bg-white p-5 shadow-sm sm:p-7">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <div
            className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-full p-[3px] shadow-sm"
            style={{
              backgroundImage: "url('/assets/custom-profile-icon-ring.png')",
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            <div className={`h-full w-full rounded-full ${avatarGradient}`} />
            {isPro && (
              <span className="absolute -bottom-1 -right-1 z-10 rounded-full border-2 border-white bg-[#DCE4FF] px-2 py-0.5 text-[8px] font-black uppercase text-[#6183FF]">
                Pro
              </span>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="truncate text-xl font-bold text-[#101217] sm:text-2xl">
              {[firstName, lastName].filter(Boolean).join(' ')}
            </h3>
            <p className="truncate text-sm font-medium text-gray-400">{email}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full border px-3 py-1 text-[9px] font-black uppercase tracking-[0.12em] ${
                  isPro
                    ? 'border-[#6183FF] bg-[#6183FF] text-white'
                    : 'border-gray-200 bg-white text-gray-400'
                }`}
              >
                {isPro ? 'Pro member' : 'Free account'}
              </span>
              {!isPro && (
                <button
                  type="button"
                  onClick={() => navigate('/dashboard/upgrade')}
                  className="rounded-full bg-[#EEF2FF] px-3 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-[#6183FF] transition-colors hover:bg-[#6183FF]/15"
                >
                  Upgrade
                </button>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate('/dashboard/billing')}
            className="flex min-h-[42px] items-center justify-center gap-1.5 rounded-full border border-gray-200 px-4 text-[11px] font-bold text-gray-500 transition-colors hover:border-[#6183FF]/40 hover:text-[#6183FF]"
          >
            <CreditCardIcon className="h-3.5 w-3.5" />
            Billing
          </button>
        </div>
      </section>

      <section className="rounded-[28px] border border-gray-50 bg-white p-5 shadow-sm sm:p-7">
        <div className="mb-5 flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EEF2FF] text-[#6183FF]">
            <IdentificationIcon className="h-5 w-5" />
          </span>
          <div>
            <h3 className="text-base font-bold text-[#101217]">Login details</h3>
            <p className="mt-0.5 text-[11px] font-medium leading-relaxed text-gray-400">
              Add a phone number or 11-digit NIN so you can log in without email.
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.14em] text-gray-400">
              Phone number
            </span>
            <span className="relative block">
              <PhoneIcon className="pointer-events-none absolute left-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-gray-300" />
              <input
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="0801 234 5678"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                className="min-h-[48px] w-full rounded-xl border border-gray-200 bg-white pl-11 pr-4 text-sm font-semibold text-[#101217] outline-none transition-colors placeholder:font-medium placeholder:text-gray-300 focus:border-[#6183FF]"
              />
            </span>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.14em] text-gray-400">
              National Identification Number
            </span>
            <span className="relative block">
              <IdentificationIcon className="pointer-events-none absolute left-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-gray-300" />
              <input
                type="text"
                inputMode="numeric"
                maxLength={11}
                placeholder="11-digit NIN"
                value={nin}
                onChange={(event) =>
                  setNin(event.target.value.replace(/\D/g, '').slice(0, 11))
                }
                className="min-h-[48px] w-full rounded-xl border border-gray-200 bg-white pl-11 pr-4 text-sm font-semibold text-[#101217] outline-none transition-colors placeholder:font-medium placeholder:text-gray-300 focus:border-[#6183FF]"
              />
            </span>
          </label>
        </div>

        {message && (
          <p
            className={`mt-3 flex items-start gap-1.5 text-[11px] font-semibold leading-relaxed ${
              messageTone === 'success' ? 'text-green-600' : 'text-red-500'
            }`}
          >
            {messageTone === 'success' && <CheckCircleIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" />}
            {message}
          </p>
        )}

        <button
          type="button"
          onClick={saveContactDetails}
          disabled={saving}
          className="mt-5 flex min-h-[46px] items-center justify-center gap-2 rounded-xl bg-[#6183FF] px-5 text-xs font-bold text-white shadow-lg shadow-[#6183FF]/20 transition-colors hover:bg-[#4D6ED6] disabled:opacity-60"
        >
          {saving ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              Saving...
            </>
          ) : (
            'Save login details'
          )}
        </button>
      </section>

      {isPro ? (
        <section className="relative overflow-hidden rounded-[28px] border border-[#6183FF]/15 bg-[#EEF2FF] p-6">
          <div
            aria-hidden
            className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[#6183FF]/20 blur-2xl"
          />
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#6183FF] text-white shadow-lg shadow-[#6183FF]/25">
                <StarIcon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-bold text-[#101217]">Selorah Pro is active</p>
                <p className="mt-1 text-xs font-medium leading-relaxed text-gray-500">
                  {proState.expiresAt
                    ? `Active until ${new Date(proState.expiresAt).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}.`
                    : 'All Pro features are unlocked on this account.'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate('/dashboard/billing')}
              className="flex min-h-[42px] items-center justify-center gap-1.5 rounded-full bg-white px-4 text-[11px] font-bold text-[#6183FF] shadow-sm"
            >
              Manage billing
              <ArrowRightIcon className="h-3.5 w-3.5" />
            </button>
          </div>
        </section>
      ) : (
        <section className="relative overflow-hidden rounded-[28px] bg-[#020924] p-6 text-white">
          <div
            aria-hidden
            className="absolute -right-12 -top-14 h-40 w-40 rounded-full bg-[#6183FF]/30 blur-3xl"
          />
          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-[#5FFAB0]">
                <StarIcon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-bold">Go Pro for ₦5,000 a year</p>
                <p className="mt-1 max-w-sm text-xs font-medium leading-relaxed text-white/50">
                  Up to 10 emergency contacts, priority verification, family sharing, and an
                  ad-free dashboard.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate('/dashboard/upgrade')}
              className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-full bg-[#6183FF] px-5 text-xs font-bold text-white shadow-lg shadow-[#6183FF]/25"
            >
              Unlock Pro
              <ArrowRightIcon className="h-3.5 w-3.5" />
            </button>
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          {
            title: 'Security',
            subtitle: 'Password and sessions',
            icon: ShieldCheckIcon,
            path: '/dashboard/security',
          },
          {
            title: 'Billing',
            subtitle: 'Plan and receipts',
            icon: CreditCardIcon,
            path: '/dashboard/billing',
          },
          {
            title: 'Family',
            subtitle: 'Manage members',
            icon: UserGroupIcon,
            path: '/dashboard/family',
          },
        ].map((item) => (
          <button
            key={item.title}
            type="button"
            onClick={() => navigate(item.path)}
            className="group flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4 text-left transition-all hover:border-[#6183FF]/30 hover:shadow-sm"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F8F9FE] text-gray-400 transition-colors group-hover:text-[#6183FF]">
              <item.icon className="h-5 w-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-bold text-[#101217]">{item.title}</span>
              <span className="mt-0.5 block text-[10px] font-medium text-gray-400">
                {item.subtitle}
              </span>
            </span>
            <ArrowRightIcon className="h-4 w-4 shrink-0 text-gray-300 transition-transform group-hover:translate-x-0.5" />
          </button>
        ))}
      </div>
    </div>
  );
}
