import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowRightIcon,
  CheckCircleIcon,
  ChevronRightIcon,
  FireIcon,
  SparklesIcon,
  TrophyIcon,
} from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import { createClient } from '../lib/supabase/client';
import { fetchMedicalRecords } from '../lib/records';
import {
  awardTaskPoints,
  fetchPointEvents,
  levelFor,
  POINTS_EVENT,
  TASKS,
  type PointEvent,
} from '../lib/points';
import { useToast } from '../contexts/ToastContext';

type Criteria = Record<string, boolean>;

export default function Rewards() {
  const supabase = createClient();
  const navigate = useNavigate();
  const { success, error: toastError, info } = useToast();
  const [events, setEvents] = useState<PointEvent[]>([]);
  const [total, setTotal] = useState(0);
  const [criteria, setCriteria] = useState<Criteria>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [pointData, records] = await Promise.all([
        fetchPointEvents(supabase),
        fetchMedicalRecords(supabase),
      ]);

      setEvents(pointData.events);
      setTotal(pointData.total);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const [{ data: profile }, { count: surveyCount }] = await Promise.all([
        supabase
          .from('patient_profiles')
          .select(
            'id, date_of_birth, blood_group, genotype, allergies, phone, emergency_contacts, permanent_qr_token, family_members'
          )
          .eq('user_id', user.id)
          .maybeSingle(),
        supabase
          .from('survey_responses')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id),
      ]);

      let hasVault = false;
      if (profile?.id) {
        const { data: vault } = await supabase
          .from('emergency_vaults')
          .select('patient_id')
          .eq('patient_id', profile.id)
          .maybeSingle();
        hasVault = Boolean(vault);
      }

      const contacts = Array.isArray(profile?.emergency_contacts)
        ? profile.emergency_contacts.length
        : 0;
      const family = Array.isArray(profile?.family_members) ? profile.family_members.length : 0;
      const allergies = Array.isArray(profile?.allergies) ? profile.allergies.length : 0;

      setCriteria({
        'profile-complete': Boolean(
          profile?.date_of_birth &&
            profile?.blood_group &&
            profile?.genotype &&
            profile?.phone &&
            allergies > 0
        ),
        'first-record': records.length >= 1,
        'three-records': records.length >= 3,
        'five-records': records.length >= 5,
        'emergency-contact': contacts > 0,
        'emergency-card': Boolean(profile?.permanent_qr_token),
        'resilience-vault': hasVault,
        'first-survey': (surveyCount || 0) > 0,
        'family-member': family > 0,
      });
    } catch (err) {
      toastError(err instanceof Error ? err.message : 'Rewards could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, [supabase, toastError]);

  useEffect(() => {
    void load();
    const refresh = () => void load();
    window.addEventListener(POINTS_EVENT, refresh);
    return () => window.removeEventListener(POINTS_EVENT, refresh);
  }, [load]);

  const claimed = useMemo(
    () => new Set(events.map((event) => event.reference)),
    [events]
  );
  const level = levelFor(total);

  const claim = async (taskId: string) => {
    const task = TASKS.find((item) => item.id === taskId);
    if (!task) return;

    if (!criteria[task.id]) {
      info(task.description);
      return;
    }

    setBusy(task.id);
    try {
      const awarded = await awardTaskPoints(supabase, task);
      if (awarded) {
        success(`+${task.points} health points. Keep building your history.`);
        await load();
      } else {
        info('You already claimed this reward.');
      }
    } catch (err) {
      toastError(err instanceof Error ? err.message : 'Points could not be awarded.');
    } finally {
      setBusy(null);
    }
  };

  if (loading) {
    return <div className="h-64 animate-pulse rounded-[28px] bg-white" />;
  }

  return (
    <div className="space-y-6 font-sora">
      <div>
        <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#6183FF]">
          Health rewards
        </p>
        <h2 className="mt-1 text-2xl font-bold tracking-tight text-[#101217] sm:text-3xl">
          Build your health story
        </h2>
        <p className="mt-1 max-w-2xl text-sm font-medium leading-relaxed text-gray-400">
          Every record, contact, and check-in makes your emergency card stronger and unlocks more
          research you can choose to join. You are always in control of what is shared.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-[24px] border border-transparent bg-[#6183FF] p-5 text-white shadow-lg shadow-[#6183FF]/20 sm:col-span-2">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.16em] text-white/60">
                Your level
              </p>
              <p className="mt-1 text-3xl font-bold tracking-tight">{level.current.name}</p>
              <p className="mt-1 text-xs font-medium text-white/60">
                {total} health points
                {level.next ? ` - ${level.next.min - total} to ${level.next.name}` : ' - top level'}
              </p>
            </div>
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15">
              <TrophyIcon className="h-6 w-6" />
            </span>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/20">
            <div
              className="h-full rounded-full bg-white transition-all"
              style={{ width: `${level.progress}%` }}
            />
          </div>
        </div>

        <div className="rounded-[24px] border border-gray-50 bg-white p-5 shadow-sm">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EAFBF2] text-[#15955C]">
            <FireIcon className="h-5 w-5" />
          </span>
          <p className="mt-4 text-[9px] font-black uppercase tracking-[0.16em] text-gray-400">
            Rewards claimed
          </p>
          <p className="mt-1 text-2xl font-bold text-[#101217]">{events.length}</p>
          <p className="mt-1 text-[11px] font-medium text-gray-400">
            Survey points pay N20 each in Earnings.
          </p>
          <button
            type="button"
            onClick={() => navigate('/dashboard/earnings')}
            className="mt-3 flex items-center gap-1 text-[11px] font-bold text-[#6183FF] hover:underline"
          >
            Open earnings
            <ChevronRightIcon className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="rounded-[28px] border border-gray-50 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-[#101217]">Tasks you can complete</h3>
            <p className="text-[11px] font-medium text-gray-400">
              Claim each task once. Progress is checked against your real data.
            </p>
          </div>
          <span className="rounded-full bg-[#EEF2FF] px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.1em] text-[#6183FF]">
            {TASKS.length} tasks
          </span>
        </div>

        <div className="mt-4 space-y-2.5">
          {TASKS.map((task) => {
            const isClaimed = claimed.has(`task:${task.id}`);
            const isReady = criteria[task.id];
            return (
              <div
                key={task.id}
                className={`flex flex-col gap-3 rounded-2xl border p-4 transition-colors sm:flex-row sm:items-center ${
                  isClaimed
                    ? 'border-gray-100 bg-[#F8F9FE]'
                    : isReady
                      ? 'border-[#6183FF]/25 bg-[#EEF2FF]/50'
                      : 'border-gray-100 bg-white'
                }`}
              >
                <span
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                    isClaimed
                      ? 'bg-[#EAFBF2] text-[#15955C]'
                      : isReady
                        ? 'bg-[#6183FF] text-white'
                        : 'bg-[#F8F9FE] text-gray-400'
                  }`}
                >
                  {isClaimed ? (
                    <CheckCircleIcon className="h-5 w-5" />
                  ) : (
                    <SparklesIcon className="h-5 w-5" />
                  )}
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-bold text-[#101217]">{task.title}</p>
                    <span className="rounded-full bg-white px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.08em] text-[#6183FF]">
                      +{task.points} pts
                    </span>
                  </div>
                  <p className="mt-0.5 text-[11px] font-medium leading-relaxed text-gray-400">
                    {task.description}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  {task.href && !isClaimed && (
                    <button
                      type="button"
                      onClick={() => navigate(task.href!)}
                      className="min-h-[38px] rounded-full border border-gray-200 bg-white px-3 text-[10px] font-bold text-gray-500 transition-colors hover:border-[#6183FF]/40 hover:text-[#6183FF]"
                    >
                      {task.actionLabel || 'Open'}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => claim(task.id)}
                    disabled={isClaimed || !isReady || busy === task.id}
                    className={`min-h-[38px] rounded-full px-3.5 text-[10px] font-black uppercase tracking-[0.06em] transition-colors ${
                      isClaimed
                        ? 'bg-transparent text-[#15955C]'
                        : isReady
                          ? 'bg-[#6183FF] text-white'
                          : 'bg-gray-100 text-gray-400'
                    } disabled:cursor-default`}
                  >
                    {isClaimed ? 'Claimed' : busy === task.id ? 'Saving' : isReady ? 'Claim' : 'Not yet'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <button
        type="button"
        onClick={() => navigate('/dashboard/research')}
        className="flex w-full items-center justify-between gap-3 rounded-[24px] border border-gray-50 bg-white p-5 text-left shadow-sm transition-colors hover:border-[#6183FF]/25"
      >
        <div>
          <p className="text-sm font-bold text-[#101217]">Earn N20 per survey point</p>
          <p className="mt-0.5 text-[11px] font-medium text-gray-400">
            Opt in to a study, answer 15 questions, and get paid instantly.
          </p>
        </div>
        <ArrowRightIcon className="h-5 w-5 shrink-0 text-[#6183FF]" />
      </button>
    </div>
  );
}
