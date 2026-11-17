import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowPathIcon,
  BanknotesIcon,
  CheckCircleIcon,
  ClipboardDocumentIcon,
  ClockIcon,
  LockClosedIcon,
  PencilSquareIcon,
  ShareIcon,
  TrophyIcon,
  UserPlusIcon,
} from '@heroicons/react/24/outline';
import { createClient } from '../../lib/supabase/client';
import { useToast } from '../../contexts/ToastContext';
import { confirmDialog } from '../../lib/dialogs';
import {
  fetchEarnings,
  formatNaira,
  MIN_WITHDRAWAL,
  REFERRAL_REWARD_REFEREE,
  REFERRAL_REWARD_REFERRER,
  type EarningsSummary,
} from '../../lib/earnings';
import {
  claimPendingReferral,
  fetchMyReferrals,
  fetchReferralProfile,
  referralLink,
  setReferralCode,
  suggestUsername,
  type ReferralProfile,
  type ReferralRow,
} from '../../lib/referrals';

const STATUS_LABEL: Record<string, string> = {
  pending: 'Waiting for 3 tasks',
  qualified: 'Qualified',
  rewarded: 'Rewarded',
  cancelled: 'Cancelled',
};

function statusTone(status: string) {
  if (status === 'rewarded') return 'bg-[#EAFBF2] text-[#15955C]';
  if (status === 'qualified') return 'bg-[#EEF3FF] text-primary';
  if (status === 'cancelled') return 'bg-red-50 text-red-500';
  return 'bg-[#FFF7E8] text-[#B7791F]';
}

function formatDate(value: string | null) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function Referrals() {
  const supabase = createClient();
  const { success, error: toastError, info } = useToast();
  const [profile, setProfile] = useState<ReferralProfile | null>(null);
  const [referrals, setReferrals] = useState<ReferralRow[]>([]);
  const [earnings, setEarnings] = useState<EarningsSummary | null>(null);
  const [usernameInput, setUsernameInput] = useState('');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [claimMessage, setClaimMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      await claimPendingReferral(supabase);

      const [nextProfile, nextReferrals, nextEarnings] = await Promise.all([
        fetchReferralProfile(supabase),
        fetchMyReferrals(supabase).catch(() => [] as ReferralRow[]),
        fetchEarnings(supabase).catch(() => null),
      ]);

      setProfile(nextProfile);
      setReferrals(nextReferrals);
      setEarnings(nextEarnings);
      setUsernameInput(nextProfile?.username || suggestUsername(nextProfile?.firstName || '', nextProfile?.fullName || ''));
      setEditing(!nextProfile?.username);
    } catch (err) {
      setClaimMessage(err instanceof Error ? err.message : 'Referral details could not load.');
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const referralEarnings = useMemo(
    () => (earnings?.earnings || []).filter((row) => row.source === 'referral'),
    [earnings]
  );

  const earnedFromReferrals = useMemo(
    () => referralEarnings.reduce((total, row) => total + Number(row.amount_local || 0), 0),
    [referralEarnings]
  );

  const counts = useMemo(() => {
    const pending = referrals.filter((row) => row.status === 'pending').length;
    const unlocked = referrals.filter((row) => row.status === 'rewarded').length;
    return { pending, unlocked };
  }, [referrals]);

  const username = profile?.username || '';
  const link = username ? referralLink(username) : '';
  const available = earnings?.available || 0;
  const canWithdraw = available >= MIN_WITHDRAWAL;

  const handleCopy = async () => {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      success('Send it to a friend. You both earn after 3 tasks.', 'Referral link copied');
    } catch {
      info(link, 'Copy the link manually');
    }
  };

  const handleShare = async () => {
    if (!link) return;
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title: 'Join Selorah Health',
          text: 'Own your health records with Selorah. Use my username when you sign up.',
          url: link,
        });
        return;
      } catch {
        // The person cancelled the share sheet. Fall back to copy.
      }
    }
    await handleCopy();
  };

  const handleSaveUsername = async () => {
    const next = usernameInput.trim().toLowerCase();
    if (!next) {
      toastError('Your username is the code your friends will enter.', 'Choose a username');
      return;
    }

    if (username && next !== username) {
      const confirmed = await confirmDialog({
        title: 'Change your referral code?',
        message:
          'Your username is also your referral code. Links you already shared with the old username will stop working.',
        confirmLabel: 'Change username',
        cancelLabel: 'Keep current',
        tone: 'default',
        icon: 'info',
      });
      if (!confirmed) return;
    }

    setSaving(true);
    try {
      const result = await setReferralCode(supabase, next);
      if (!result.ok) {
        toastError(result.message || 'Try a different username.', 'Username not saved');
        return;
      }
      success(`Your code is @${next}.`, 'Referral code saved');
      setProfile((current) => (current ? { ...current, username: next } : current));
      setEditing(false);
      setClaimMessage(null);
    } catch (err) {
      toastError(err instanceof Error ? err.message : 'Try again.', 'Username not saved');
    } finally {
      setSaving(false);
    }
  };

  const handleClaimRetry = async () => {
    setSaving(true);
    try {
      const result = await claimPendingReferral(supabase);
      if (result?.ok) {
        success('Your referral is now waiting for 3 tasks.', 'Referral linked');
        await load();
      } else if (result?.message) {
        info(result.message, 'Referral not linked');
      } else {
        info("Add a friend's username at signup or use their link.", 'No pending referral');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <section className="overflow-hidden rounded-[28px] border border-gray-100 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-xl">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-primary">
              Referrals
            </p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-[#101217] sm:text-3xl">
              Share your username. Earn together.
            </h2>
            <p className="mt-3 text-sm font-medium leading-relaxed text-gray-500">
              Your username is your referral code. A friend enters it when they sign up. When they
              claim 3 tasks in Rewards, you get {formatNaira(REFERRAL_REWARD_REFERRER)} and they get{' '}
              {formatNaira(REFERRAL_REWARD_REFEREE)}.
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-3 rounded-2xl bg-[#F8F9FE] px-4 py-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white">
              <UserPlusIcon className="h-5 w-5" />
            </span>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-gray-400">
                Your code
              </p>
              <p className="text-sm font-bold text-[#101217]">
                {username ? `@${username}` : 'Not set yet'}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-gray-100 bg-[#F8F9FA] p-4 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <label className="block flex-1">
              <span className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.14em] text-gray-400">
                Referral username
              </span>
              <div className="relative">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-300">
                  @
                </span>
                <input
                  type="text"
                  value={usernameInput}
                  disabled={!editing || saving}
                  onChange={(event) =>
                    setUsernameInput(
                      event.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '')
                    )
                  }
                  placeholder="your-username"
                  maxLength={20}
                  className="min-h-[46px] w-full rounded-xl border border-gray-200 bg-white pl-8 pr-4 text-sm font-semibold text-[#101217] outline-none transition-colors placeholder:font-medium placeholder:text-gray-300 focus:border-primary disabled:bg-white disabled:text-gray-500"
                />
              </div>
              <span className="mt-1.5 block px-1 text-[10px] font-medium text-gray-400">
                3 to 20 lowercase letters, numbers, hyphens, or underscores.
              </span>
            </label>

            {editing ? (
              <button
                type="button"
                onClick={() => void handleSaveUsername()}
                disabled={saving}
                className="flex min-h-[46px] items-center justify-center gap-2 rounded-xl bg-primary px-5 text-xs font-bold text-white transition-colors hover:bg-primary-hover disabled:opacity-60"
              >
                {saving ? (
                  <ArrowPathIcon className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircleIcon className="h-4 w-4" />
                )}
                Save username
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="flex min-h-[46px] items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-5 text-xs font-bold text-[#101217] transition-colors hover:bg-gray-50"
              >
                <PencilSquareIcon className="h-4 w-4" />
                Edit username
              </button>
            )}
          </div>

          {claimMessage && (
            <div className="mt-3 rounded-xl border border-amber-100 bg-amber-50 px-3.5 py-2.5 text-[11px] font-semibold text-amber-700">
              {claimMessage}
            </div>
          )}

          {username && (
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <div className="flex min-h-[46px] flex-1 items-center overflow-hidden rounded-xl border border-gray-200 bg-white px-3.5">
                <span className="truncate text-xs font-semibold text-gray-500">{link}</span>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => void handleCopy()}
                  className="flex min-h-[46px] flex-1 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 text-xs font-bold text-[#101217] transition-colors hover:bg-gray-50 sm:flex-none"
                >
                  <ClipboardDocumentIcon className="h-4 w-4" />
                  Copy
                </button>
                <button
                  type="button"
                  onClick={() => void handleShare()}
                  className="flex min-h-[46px] flex-1 items-center justify-center gap-2 rounded-xl bg-[#101217] px-4 text-xs font-bold text-white transition-colors hover:bg-[#020924] sm:flex-none"
                >
                  <ShareIcon className="h-4 w-4" />
                  Share
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: 'Invited',
            value: String(referrals.length),
            detail: 'Friends who used your code',
            icon: UserPlusIcon,
            tone: 'bg-[#EEF3FF] text-primary',
          },
          {
            label: 'Waiting',
            value: String(counts.pending),
            detail: 'Need 3 tasks to unlock',
            icon: ClockIcon,
            tone: 'bg-[#FFF7E8] text-[#B7791F]',
          },
          {
            label: 'Unlocked',
            value: String(counts.unlocked),
            detail: 'Rewards paid out',
            icon: TrophyIcon,
            tone: 'bg-[#EAFBF2] text-[#15955C]',
          },
          {
            label: 'Referral earnings',
            value: formatNaira(earnedFromReferrals),
            detail: 'From referrals',
            icon: BanknotesIcon,
            tone: 'bg-[#F3F0FF] text-[#6D4AFF]',
          },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="rounded-[22px] border border-gray-100 bg-white p-4 shadow-sm"
            >
              <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${card.tone}`}>
                <Icon className="h-4.5 w-4.5" />
              </span>
              <p className="mt-3 text-[10px] font-black uppercase tracking-[0.14em] text-gray-400">
                {card.label}
              </p>
              <p className="mt-1 text-2xl font-bold tracking-tight text-[#101217]">{card.value}</p>
              <p className="mt-1 text-[11px] font-medium text-gray-400">{card.detail}</p>
            </div>
          );
        })}
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="rounded-[24px] border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-[#101217]">Your referrals</h3>
              <p className="mt-1 text-xs font-medium text-gray-400">
                Rewards unlock when a friend claims 3 tasks.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void handleClaimRetry()}
              disabled={saving}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-100 text-gray-400 transition-colors hover:bg-gray-50 hover:text-[#101217] disabled:opacity-50"
              aria-label="Check for a pending referral"
            >
              <ArrowPathIcon className={`h-4 w-4 ${saving ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="mt-4 space-y-2.5">
            {loading ? (
              <div className="flex items-center gap-2 rounded-xl bg-[#F8F9FA] px-4 py-6 text-xs font-semibold text-gray-400">
                <ArrowPathIcon className="h-4 w-4 animate-spin" />
                Loading referrals...
              </div>
            ) : referrals.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-200 bg-[#F8F9FA] px-4 py-8 text-center">
                <UserPlusIcon className="mx-auto h-8 w-8 text-gray-300" />
                <p className="mt-2 text-sm font-bold text-[#101217]">No referrals yet</p>
                <p className="mx-auto mt-1 max-w-xs text-xs font-medium leading-relaxed text-gray-400">
                  Share your username or link. Your first referral will appear here.
                </p>
              </div>
            ) : (
              referrals.map((row) => (
                <div
                  key={row.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 bg-[#FCFDFE] px-3.5 py-3"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                      {(row.referee_name || 'A').slice(0, 1).toUpperCase()}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold text-[#101217]">
                        {row.referee_name || 'A friend'}
                      </p>
                      <p className="truncate text-[10px] font-medium text-gray-400">
                        {row.referee_username ? `@${row.referee_username}` : 'Selorah member'}
                        {row.created_at ? ` · ${formatDate(row.created_at)}` : ''}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.1em] ${statusTone(
                      row.status
                    )}`}
                  >
                    {STATUS_LABEL[row.status] || row.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="rounded-[24px] border border-gray-100 bg-[#020924] p-5 text-white shadow-sm sm:p-6">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#8FA8FF]">
            How it works
          </p>
          <h3 className="mt-2 text-lg font-bold leading-snug">Three steps, then both get paid.</h3>

          <div className="mt-5 space-y-4">
            {[
              {
                title: 'Share your username',
                body: 'Send your code or referral link to a friend.',
              },
              {
                title: 'They join and finish 3 tasks',
                body: 'Tasks are in the Rewards tab. Any 3 claimed tasks count.',
              },
              {
                title: 'You get N1,000. They get N800.',
                body: 'Both rewards land in Earnings as available cash.',
              },
            ].map((step, index) => (
              <div key={step.title} className="flex gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/10 text-[11px] font-bold text-white">
                  {index + 1}
                </span>
                <div>
                  <p className="text-sm font-bold text-white">{step.title}</p>
                  <p className="mt-0.5 text-[11px] font-medium leading-relaxed text-white/55">
                    {step.body}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 rounded-xl border border-white/10 bg-white/5 p-3.5">
            <div className="flex items-center gap-2 text-[11px] font-semibold text-white/70">
              <LockClosedIcon className="h-4 w-4 text-[#5FFAB0]" />
              Withdraw from {formatNaira(MIN_WITHDRAWAL)}
            </div>
            <p className="mt-1.5 text-[10px] font-medium leading-relaxed text-white/40">
              Referral cash sits in Earnings. You can request a withdrawal once your available
              balance reaches {formatNaira(MIN_WITHDRAWAL)}.
            </p>
            {!canWithdraw && (
              <p className="mt-2 text-[10px] font-semibold text-[#FFD98A]">
                {formatNaira(Math.max(0, MIN_WITHDRAWAL - available))} more to reach the minimum.
              </p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
