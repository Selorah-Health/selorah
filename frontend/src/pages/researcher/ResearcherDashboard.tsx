import { useCallback, useEffect, useMemo, useState } from 'react';
import { Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import {
  BanknotesIcon,
  BeakerIcon,
  ChartBarIcon,
  CheckBadgeIcon,
  CircleStackIcon,
  ClockIcon,
  Cog6ToothIcon,
  CreditCardIcon,
  CurrencyDollarIcon,
  DocumentChartBarIcon,
  DocumentTextIcon,
  PlusIcon,
  ShieldCheckIcon,
  UsersIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { createClient } from '../../lib/supabase/client';
import { writeLocalSession } from '../../lib/auth/session';
import { useToast } from '../../contexts/ToastContext';
import PortalSidebar from '../../components/PortalSidebar';
import SEOTitle from '../../components/SEOTitle';
import NewStudyModal from '../../components/NewStudyModal';
import {
  formatNaira,
  normalizeOptions,
  pointsToNaira,
  type Survey,
  type SurveyQuestion,
  type SurveyStats,
} from '../../lib/surveys';

type Identity = {
  name: string;
  email: string;
  initials: string;
  institution: string;
  irb: string;
  orgId: string;
  isPro: boolean;
  verified: boolean;
};

function initialsOf(name: string, email: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (email[0] || 'R').toUpperCase();
}

function splitName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return {
    first: parts[0] || '',
    last: parts.slice(1).join(' '),
  };
}

export default function ResearcherDashboard() {
  const [user, setUser] = useState<any>(null);
  const [identity, setIdentity] = useState<Identity>({
    name: 'Researcher',
    email: '',
    initials: 'R',
    institution: 'Independent researcher',
    irb: '',
    orgId: '',
    isPro: false,
    verified: false,
  });
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [stats, setStats] = useState<Record<string, SurveyStats>>({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeSurvey, setActiveSurvey] = useState<Survey | null>(null);
  const [isNewSurveyOpen, setIsNewSurveyOpen] = useState(false);
  const [dbStats, setDbStats] = useState({ patients: 0, records: 0 });
  const [loadingStats, setLoadingStats] = useState(true);
  const [settings, setSettings] = useState({
    full_name: '',
    institution: '',
    irb_number: '',
  });
  const [savingSettings, setSavingSettings] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const supabase = createClient();
  const { success, error: toastError } = useToast();

  const loadPortal = useCallback(async () => {
    setLoading(true);
    setLoadError(null);

    try {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (!authUser) {
        navigate('/login', { replace: true });
        return;
      }

      const [userRes, researcherRes, surveyRes, statsRes] = await Promise.all([
        supabase
          .from('users')
          .select('role, email, verification_status')
          .eq('id', authUser.id)
          .maybeSingle(),
        supabase
          .from('researcher_profiles')
          .select('full_name, institution, irb_number, org_id')
          .eq('user_id', authUser.id)
          .maybeSingle(),
        supabase
          .from('surveys')
          .select('*')
          .eq('researcher_id', authUser.id)
          .order('created_at', { ascending: false }),
        supabase.rpc('survey_stats'),
      ]);

      if (surveyRes.error) throw surveyRes.error;

      const researcher = researcherRes.data;
      const meta = authUser.user_metadata || {};
      const displayName =
        researcher?.full_name ||
        [meta.first_name, meta.last_name].filter(Boolean).join(' ') ||
        authUser.email?.split('@')[0] ||
        'Researcher';
      const institution = researcher?.institution || meta.organization_name || 'Independent researcher';
      const isPro =
        meta.is_pro === true ||
        Boolean(meta.pro_expires_at && new Date(meta.pro_expires_at).getTime() > Date.now());
      const verified = userRes.data?.verification_status === 'verified';
      const nameParts = splitName(displayName);

      setIdentity({
        name: displayName,
        email: authUser.email || '',
        initials: initialsOf(displayName, authUser.email || ''),
        institution,
        irb: researcher?.irb_number || '',
        orgId: researcher?.org_id || '',
        isPro,
        verified,
      });

      setUser({
        email: authUser.email,
        user_metadata: {
          first_name: nameParts.first,
          last_name: nameParts.last,
          organization_name: institution,
          is_pro: isPro,
        },
      });

      writeLocalSession({
        id: authUser.id,
        email: authUser.email,
        first_name: nameParts.first,
        last_name: nameParts.last,
        role: 'researcher',
        org_id: researcher?.org_id || undefined,
        is_pro: isPro,
      });

      setSettings({
        full_name: displayName,
        institution,
        irb_number: researcher?.irb_number || '',
      });

      const rows = (surveyRes.data || []) as Survey[];
      const ids = rows.map((row) => row.id);

      let questionRows: SurveyQuestion[] = [];
      if (ids.length > 0) {
        const { data } = await supabase
          .from('survey_questions')
          .select('id, survey_id, position, prompt, question_type, options, required')
          .in('survey_id', ids)
          .order('position', { ascending: true });

        questionRows = ((data || []) as SurveyQuestion[]).map((question) => ({
          ...question,
          options: normalizeOptions(question.options),
        }));
      }

      const grouped = new Map<string, SurveyQuestion[]>();
      for (const question of questionRows) {
        const list = grouped.get(question.survey_id) || [];
        list.push(question);
        grouped.set(question.survey_id, list);
      }

      setSurveys(
        rows.map((row) => ({
          ...row,
          questions: grouped.get(row.id) || [],
        }))
      );

      const statMap: Record<string, SurveyStats> = {};
      for (const row of (statsRes.data || []) as SurveyStats[]) {
        statMap[row.survey_id] = {
          survey_id: row.survey_id,
          responses: Number(row.responses || 0),
          points_awarded: Number(row.points_awarded || 0),
          reward_naira: Number(row.reward_naira || 0),
        };
      }
      setStats(statMap);
    } catch (error) {
      console.error('Researcher portal failed to load:', error);
      setLoadError(
        error instanceof Error ? error.message : 'The researcher portal could not be loaded.'
      );
    } finally {
      setLoading(false);
    }
  }, [navigate, supabase]);

  const loadGlobalStats = useCallback(async () => {
    setLoadingStats(true);
    try {
      const [{ count: patientCount }, { count: recordCount }] = await Promise.all([
        supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'patient'),
        supabase.from('medical_records').select('*', { count: 'exact', head: true }),
      ]);

      setDbStats({
        patients: patientCount || 0,
        records: recordCount || 0,
      });
    } catch (error) {
      console.error('Failed to fetch portal counts:', error);
    } finally {
      setLoadingStats(false);
    }
  }, [supabase]);

  useEffect(() => {
    void loadPortal();
    void loadGlobalStats();
  }, [loadGlobalStats, loadPortal]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('selorah_user');
    navigate('/login');
  };

  const menuItems = [
    { name: 'Surveys', icon: BeakerIcon, path: '/researcher' },
    { name: 'Data Cohorts', icon: DocumentChartBarIcon, path: '/researcher/cohorts' },
    { name: 'Funding & Checkout', icon: CreditCardIcon, path: '/researcher/checkout' },
    { name: 'Settings', icon: Cog6ToothIcon, path: '/researcher/settings' },
  ];

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/researcher') return 'Research surveys';
    if (path.startsWith('/researcher/cohorts')) return 'Data Cohorts';
    if (path.startsWith('/researcher/checkout')) return 'Funding & Checkout';
    if (path.startsWith('/researcher/settings')) return 'Settings';
    return 'Researcher Portal';
  };

  const totals = useMemo(() => {
    const rows = Object.values(stats);
    return {
      responses: rows.reduce((sum, row) => sum + Number(row.responses || 0), 0),
      points: rows.reduce((sum, row) => sum + Number(row.points_awarded || 0), 0),
      rewards: rows.reduce((sum, row) => sum + Number(row.reward_naira || 0), 0),
      open: surveys.filter((survey) => survey.is_active).length,
    };
  }, [stats, surveys]);

  const handleSurveyCreated = (survey: Survey) => {
    setSurveys((previous) => [survey, ...previous]);
    setStats((previous) => ({
      ...previous,
      [survey.id]: {
        survey_id: survey.id,
        responses: 0,
        points_awarded: 0,
        reward_naira: 0,
      },
    }));
    setIsNewSurveyOpen(false);
    success('Survey published. It is now open for participants.', 'Survey created');
  };

  const toggleSurvey = async (survey: Survey) => {
    const next = !survey.is_active;
    const { error } = await supabase
      .from('surveys')
      .update({ is_active: next, updated_at: new Date().toISOString() })
      .eq('id', survey.id);

    if (error) {
      toastError(error.message, 'Survey not updated');
      return;
    }

    setSurveys((previous) =>
      previous.map((row) => (row.id === survey.id ? { ...row, is_active: next } : row))
    );
    setActiveSurvey((previous) =>
      previous && previous.id === survey.id ? { ...previous, is_active: next } : previous
    );
    success(next ? 'The survey is open for responses.' : 'The survey is paused.', 'Survey updated');
  };

  const saveSettings = async () => {
    if (!settings.full_name.trim() || !settings.institution.trim()) {
      toastError('Add your full name and institution.', 'Profile not saved');
      return;
    }

    setSavingSettings(true);

    try {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (!authUser) throw new Error('Sign in again to update your profile.');

      const { error } = await supabase.from('researcher_profiles').upsert(
        {
          user_id: authUser.id,
          full_name: settings.full_name.trim(),
          institution: settings.institution.trim(),
          irb_number: settings.irb_number.trim() || null,
        },
        { onConflict: 'user_id' }
      );

      if (error) throw error;

      const nameParts = splitName(settings.full_name.trim());
      setIdentity((previous) => ({
        ...previous,
        name: settings.full_name.trim(),
        initials: initialsOf(settings.full_name.trim(), previous.email),
        institution: settings.institution.trim(),
        irb: settings.irb_number.trim(),
      }));
      setUser((previous: any) => ({
        ...previous,
        user_metadata: {
          ...previous?.user_metadata,
          first_name: nameParts.first,
          last_name: nameParts.last,
          organization_name: settings.institution.trim(),
        },
      }));
      writeLocalSession({
        first_name: nameParts.first,
        last_name: nameParts.last,
        org_id: identity.orgId || undefined,
      });

      success('Researcher identity updated.', 'Saved');
    } catch (error) {
      toastError(
        error instanceof Error ? error.message : 'The profile could not be saved.',
        'Profile not saved'
      );
    } finally {
      setSavingSettings(false);
    }
  };

  const surveyDetailStats = activeSurvey ? stats[activeSurvey.id] : undefined;

  return (
    <div className="flex h-screen overflow-hidden bg-[#F8F9FE] font-sora selection:bg-primary/30">
      <SEOTitle title={`${getPageTitle()} | Researcher Portal`} />

      <PortalSidebar
        role="researcher"
        roleTag="Researcher"
        menuItems={menuItems}
        user={user}
        sidebarBg="bg-[#050038]"
        logoutBg="bg-[#1A1B2E]"
        avatarGradient="bg-gradient-to-tr from-[#050038] to-[#6183FF]"
        roleDescription={identity.verified ? 'Verified researcher' : 'Researcher'}
      />

      <main className="flex flex-1 flex-col overflow-hidden">
        <header className="z-10 flex h-[70px] shrink-0 items-center justify-between px-4 md:px-8 lg:px-12">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold tracking-tight text-[#101217]">{getPageTitle()}</h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsNewSurveyOpen(true)}
              className="flex items-center gap-2 rounded-full bg-[#050038] px-5 py-2.5 text-sm font-bold text-white shadow-lg transition-all hover:bg-black"
            >
              <PlusIcon className="h-4 w-4" />
              New survey
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 pb-24 pt-4 md:p-8 md:pb-8 lg:p-12 lg:pb-12">
          <Routes>
            <Route
              index
              element={
                <div className="mx-auto max-w-6xl space-y-6">
                  <section className="relative overflow-hidden rounded-[28px] border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
                    <div
                      aria-hidden
                      className="absolute -right-16 -top-20 h-48 w-48 rounded-full bg-[#6183FF]/10 blur-3xl"
                    />
                    <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                      <div className="flex min-w-0 items-center gap-4">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#050038] to-[#6183FF] text-lg font-black text-white">
                          {identity.initials}
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h2 className="truncate text-xl font-bold tracking-tight text-[#101217]">
                              {identity.name}
                            </h2>
                            {identity.isPro && (
                              <span className="rounded-full bg-[#6183FF] px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.1em] text-white">
                                Pro
                              </span>
                            )}
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.1em] ${
                                identity.verified
                                  ? 'bg-green-50 text-green-600'
                                  : 'bg-amber-50 text-amber-600'
                              }`}
                            >
                              <CheckBadgeIcon className="h-3 w-3" />
                              {identity.verified ? 'Verified' : 'Pending'}
                            </span>
                          </div>
                          <p className="truncate text-xs font-medium text-gray-400">
                            {identity.email || 'Signed in account'}
                          </p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F8F9FE] px-2.5 py-1 text-[10px] font-semibold text-gray-500">
                              <ShieldCheckIcon className="h-3.5 w-3.5 text-[#6183FF]" />
                              {identity.institution}
                            </span>
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F8F9FE] px-2.5 py-1 text-[10px] font-semibold text-gray-500">
                              <BeakerIcon className="h-3.5 w-3.5 text-[#6183FF]" />
                              Researcher
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-2 lg:min-w-[300px]">
                        <div className="rounded-xl bg-[#F8F9FE] px-4 py-2.5">
                          <p className="text-[9px] font-black uppercase tracking-[0.12em] text-gray-400">
                            IRB record
                          </p>
                          <p className="mt-0.5 truncate text-xs font-bold text-[#101217]">
                            {identity.irb || 'Not provided'}
                          </p>
                        </div>
                        <div className="rounded-xl bg-[#EEF2FF] px-4 py-2.5">
                          <p className="text-[9px] font-black uppercase tracking-[0.12em] text-[#6183FF]">
                            Open surveys
                          </p>
                          <p className="mt-0.5 text-lg font-black text-[#6183FF]">{totals.open}</p>
                        </div>
                      </div>
                    </div>
                  </section>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {[
                      {
                        label: 'Surveys',
                        value: String(surveys.length).padStart(2, '0'),
                        icon: BeakerIcon,
                      },
                      {
                        label: 'Responses',
                        value: String(totals.responses).padStart(2, '0'),
                        icon: UsersIcon,
                      },
                      {
                        label: 'Points awarded',
                        value: String(totals.points),
                        icon: ChartBarIcon,
                      },
                      {
                        label: 'Rewards paid',
                        value: formatNaira(totals.rewards),
                        icon: CurrencyDollarIcon,
                      },
                    ].map((card) => (
                      <div
                        key={card.label}
                        className="rounded-[24px] border border-gray-100 bg-white p-5 shadow-sm"
                      >
                        <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-[#EEF2FF] text-[#6183FF]">
                          <card.icon className="h-5 w-5" />
                        </div>
                        <p className="text-[9px] font-black uppercase tracking-[0.16em] text-gray-400">
                          {card.label}
                        </p>
                        <p className="mt-1 text-2xl font-bold tracking-tight text-[#101217]">
                          {card.value}
                        </p>
                      </div>
                    ))}
                  </div>

                  {loadError && (
                    <div className="rounded-2xl border border-amber-100 bg-amber-50 px-5 py-4">
                      <p className="text-sm font-bold text-amber-800">Portal data did not load</p>
                      <p className="mt-1 text-xs font-medium leading-relaxed text-amber-700">
                        {loadError}
                      </p>
                      <button
                        type="button"
                        onClick={() => void loadPortal()}
                        className="mt-3 min-h-[38px] rounded-full bg-amber-500 px-4 text-[11px] font-bold text-white"
                      >
                        Try again
                      </button>
                    </div>
                  )}

                  <section>
                    <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                      <div>
                        <h2 className="text-lg font-bold tracking-tight text-[#101217]">
                          Your surveys
                        </h2>
                        <p className="mt-1 text-xs font-medium text-gray-400">
                          Every response is anonymous. You only see aggregate counts.
                        </p>
                      </div>
                      <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-[10px] font-bold text-gray-500 shadow-sm">
                        <CurrencyDollarIcon className="h-3.5 w-3.5 text-[#15955C]" />1 point per
                        question
                      </span>
                    </div>

                    {loading ? (
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {[0, 1, 2].map((item) => (
                          <div
                            key={item}
                            className="h-64 animate-pulse rounded-[26px] bg-white"
                          />
                        ))}
                      </div>
                    ) : surveys.length === 0 ? (
                      <div className="rounded-[26px] border border-dashed border-gray-200 bg-white px-6 py-14 text-center">
                        <BeakerIcon className="mx-auto h-9 w-9 text-gray-200" />
                        <p className="mt-3 text-sm font-bold text-[#101217]">No surveys yet</p>
                        <p className="mx-auto mt-1 max-w-sm text-xs font-medium leading-relaxed text-gray-400">
                          Create a survey to collect consented answers. Participants see the
                          reward and every question before they start.
                        </p>
                        <button
                          type="button"
                          onClick={() => setIsNewSurveyOpen(true)}
                          className="mt-5 inline-flex min-h-[42px] items-center gap-2 rounded-full bg-[#6183FF] px-5 text-xs font-bold text-white shadow-lg shadow-[#6183FF]/20"
                        >
                          <PlusIcon className="h-4 w-4" />
                          Create a survey
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {surveys.map((survey) => {
                          const stat = stats[survey.id];
                          const responses = Number(stat?.responses || 0);
                          return (
                            <article
                              key={survey.id}
                              className="flex flex-col rounded-[26px] border border-gray-100 bg-white p-5 shadow-sm transition-colors hover:border-[#6183FF]/25"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span
                                  className={`rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.1em] ${
                                    survey.is_active
                                      ? 'bg-green-100 text-green-700'
                                      : 'bg-yellow-100 text-yellow-700'
                                  }`}
                                >
                                  {survey.is_active ? 'Open' : 'Paused'}
                                </span>
                                <span className="truncate text-[10px] font-semibold text-gray-400">
                                  {survey.category}
                                </span>
                              </div>

                              <h3 className="mt-3 text-base font-bold leading-snug text-[#101217]">
                                {survey.title}
                              </h3>
                              <p className="mt-1 line-clamp-2 text-xs font-medium leading-relaxed text-gray-500">
                                {survey.summary}
                              </p>

                              <div className="mt-3 flex flex-wrap gap-1.5">
                                <span className="inline-flex items-center gap-1 rounded-full bg-[#F8F9FE] px-2.5 py-1 text-[10px] font-semibold text-gray-500">
                                  <UsersIcon className="h-3.5 w-3.5" />
                                  {responses} responses
                                </span>
                                <span className="inline-flex items-center gap-1 rounded-full bg-[#F8F9FE] px-2.5 py-1 text-[10px] font-semibold text-gray-500">
                                  <DocumentTextIcon className="h-3.5 w-3.5" />
                                  {survey.questions?.length || 0} questions
                                </span>
                                <span className="inline-flex items-center gap-1 rounded-full bg-[#F8F9FE] px-2.5 py-1 text-[10px] font-semibold text-gray-500">
                                  <ClockIcon className="h-3.5 w-3.5" />
                                  {survey.estimated_minutes} min
                                </span>
                              </div>

                              <div className="mt-auto flex items-end justify-between gap-3 border-t border-gray-50 pt-4">
                                <div>
                                  <p className="text-lg font-black text-[#101217]">
                                    {formatNaira(pointsToNaira(survey.points))}
                                  </p>
                                  <p className="text-[9px] font-black uppercase tracking-[0.1em] text-gray-400">
                                    Reward per response
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setActiveSurvey(survey)}
                                  className="min-h-[38px] rounded-full bg-[#EEF2FF] px-4 text-[11px] font-bold text-[#6183FF] transition-colors hover:bg-[#6183FF] hover:text-white"
                                >
                                  Manage
                                </button>
                              </div>
                            </article>
                          );
                        })}
                      </div>
                    )}
                  </section>
                </div>
              }
            />

            <Route
              path="cohorts"
              element={
                <div className="mx-auto max-w-5xl space-y-8">
                  <div className="relative overflow-hidden rounded-[32px] bg-[#050038] p-8 text-white shadow-2xl md:p-12">
                    <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#6183FF]/20 blur-3xl" />
                    <div className="relative z-10 grid grid-cols-1 items-center gap-8 md:grid-cols-2">
                      <div>
                        <h2 className="mb-4 text-3xl font-black tracking-tight">
                          Global Data Cohort
                        </h2>
                        <p className="max-w-md text-sm leading-relaxed text-white/70">
                          Counts below come from live Selorah data. Patient identity is never
                          included in a cohort or an export.
                        </p>
                      </div>
                      <div className="flex gap-4 md:justify-end">
                        <div className="min-w-[140px] rounded-3xl border border-white/10 bg-white/10 p-6 text-center backdrop-blur-md">
                          <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-white/50">
                            Patients
                          </p>
                          <h3 className="text-4xl font-black text-white">
                            {loadingStats ? '...' : dbStats.patients.toLocaleString()}
                          </h3>
                        </div>
                        <div className="min-w-[140px] rounded-3xl border border-white/10 bg-white/10 p-6 text-center backdrop-blur-md">
                          <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-white/50">
                            Records
                          </p>
                          <h3 className="text-4xl font-black text-[#14F1D9]">
                            {loadingStats ? '...' : dbStats.records.toLocaleString()}
                          </h3>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    <div className="rounded-[32px] border border-gray-100 bg-white p-8 shadow-sm md:col-span-2">
                      <h3 className="text-lg font-bold text-[#101217]">Approved data access</h3>
                      <p className="mt-2 text-sm font-medium leading-relaxed text-gray-500">
                        Cohort exports require an approved data request that states the research
                        question, the fields needed, and how the data will be stored. Send the
                        request from your verified researcher email.
                      </p>

                      <div className="mt-6 space-y-3">
                        {[
                          {
                            title: 'Verified patient profiles',
                            body: 'Age range, sex, blood group, genotype, and verification state.',
                          },
                          {
                            title: 'Clinical records',
                            body: 'Record type, facility, and document metadata without identity.',
                          },
                          {
                            title: 'Survey aggregates',
                            body: 'Response counts, points awarded, and reward totals for your surveys.',
                          },
                        ].map((item) => (
                          <div
                            key={item.title}
                            className="flex items-start gap-3 rounded-2xl bg-[#F8F9FE] p-4"
                          >
                            <ShieldCheckIcon className="mt-0.5 h-5 w-5 shrink-0 text-[#6183FF]" />
                            <div>
                              <p className="text-xs font-bold text-[#101217]">{item.title}</p>
                              <p className="mt-0.5 text-[11px] font-medium leading-relaxed text-gray-500">
                                {item.body}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-col justify-between rounded-[32px] border border-blue-100 bg-[#EEF2FF] p-8">
                      <div>
                        <h3 className="mb-2 text-[10px] font-black uppercase tracking-widest text-blue-500">
                          Live patient count
                        </h3>
                        <h2 className="text-4xl font-black text-[#050038]">
                          {loadingStats ? '...' : dbStats.patients.toLocaleString()}
                        </h2>
                        <p className="mt-2 text-xs font-medium text-blue-600">
                          Patients registered on Selorah.
                        </p>
                      </div>
                      <a
                        href="mailto:research@selorah.health?subject=Data%20cohort%20request"
                        className="mt-6 inline-flex min-h-[44px] items-center justify-center rounded-xl bg-[#6183FF] px-5 text-sm font-bold text-white shadow-lg shadow-blue-500/20"
                      >
                        Request a cohort
                      </a>
                    </div>
                  </div>
                </div>
              }
            />

            <Route
              path="checkout"
              element={
                <div className="mx-auto max-w-4xl space-y-8">
                  <div className="mb-10 text-center">
                    <h2 className="mb-4 text-3xl font-black tracking-tight text-[#101217]">
                      Funding & Data Access
                    </h2>
                    <p className="mx-auto max-w-lg text-sm text-gray-500">
                      Purchase access credits to support approved cohort work. A share of every
                      payment goes back to participants as research rewards.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                    <div className="relative overflow-hidden rounded-[32px] border border-gray-100 bg-white p-8 shadow-sm">
                      <div className="mb-8 flex items-start justify-between">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-50 text-gray-400">
                          <CircleStackIcon className="h-6 w-6" />
                        </div>
                        <span className="rounded-full bg-gray-100 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-gray-500">
                          Pay as you go
                        </span>
                      </div>
                      <h3 className="mb-2 text-2xl font-black text-[#101217]">Standard Access</h3>
                      <div className="mb-6 flex items-baseline gap-1">
                        <span className="text-4xl font-black text-[#6183FF]">$2.50</span>
                        <span className="text-xs font-bold uppercase tracking-widest text-gray-400">
                          / record
                        </span>
                      </div>
                      <ul className="mb-8 space-y-3">
                        {['Anonymized basic profiles', 'Verified lab results', 'Standard CSV export'].map(
                          (item) => (
                            <li
                              key={item}
                              className="flex items-center gap-3 text-sm font-medium text-gray-600"
                            >
                              <ShieldCheckIcon className="h-5 w-5 text-green-500" />
                              {item}
                            </li>
                          )
                        )}
                      </ul>
                      <a
                        href="mailto:research@selorah.health?subject=Standard%20data%20access"
                        className="flex min-h-[46px] w-full items-center justify-center rounded-2xl bg-gray-50 text-sm font-bold text-[#101217] transition-colors hover:bg-gray-100"
                      >
                        Select plan
                      </a>
                    </div>

                    <div className="relative overflow-hidden rounded-[32px] bg-[#050038] p-8 shadow-2xl">
                      <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#6183FF]/20 blur-3xl" />
                      <div className="relative z-10">
                        <div className="mb-8 flex items-start justify-between">
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#6183FF]/20 bg-[#6183FF]/20 text-[#6183FF] backdrop-blur-sm">
                            <BanknotesIcon className="h-6 w-6" />
                          </div>
                          <span className="rounded-full bg-[#6183FF] px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white shadow-lg shadow-blue-500/20">
                            Institutional
                          </span>
                        </div>
                        <h3 className="mb-2 text-2xl font-black text-white">Enterprise API</h3>
                        <div className="mb-6 flex items-baseline gap-1">
                          <span className="text-4xl font-black text-[#14F1D9]">$4,999</span>
                          <span className="text-xs font-bold uppercase tracking-widest text-white/50">
                            / month
                          </span>
                        </div>
                        <ul className="mb-8 space-y-3">
                          {[
                            'Real-time streaming API',
                            'Advanced longitudinal tracking',
                            'Dedicated support and SLA',
                          ].map((item) => (
                            <li
                              key={item}
                              className="flex items-center gap-3 text-sm font-medium text-white/80"
                            >
                              <ShieldCheckIcon className="h-5 w-5 text-[#14F1D9]" />
                              {item}
                            </li>
                          ))}
                        </ul>
                        <a
                          href="mailto:research@selorah.health?subject=Enterprise%20API"
                          className="flex min-h-[46px] w-full items-center justify-center rounded-2xl bg-[#6183FF] text-sm font-bold text-white shadow-lg shadow-blue-500/20 transition-opacity hover:opacity-90"
                        >
                          Contact sales
                        </a>
                      </div>
                    </div>
                  </div>

                  <p className="text-center text-[11px] font-medium text-gray-400">
                    Payments are arranged with the Selorah research team so the data request and
                    licence can be reviewed first.
                  </p>
                </div>
              }
            />

            <Route
              path="settings"
              element={
                <div className="mx-auto max-w-3xl">
                  <div className="rounded-[32px] border border-gray-100 bg-white p-8 shadow-sm md:p-12">
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#050038] to-[#6183FF] text-sm font-black text-white">
                        {identity.initials}
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-[#101217]">Researcher identity</h2>
                        <p className="mt-1 text-xs font-medium text-gray-400">
                          This is the name and institution participants see on your surveys.
                        </p>
                      </div>
                    </div>

                    <div className="mt-8 space-y-6">
                      <label className="block">
                        <span className="mb-2 block text-[10px] font-black uppercase tracking-widest text-gray-400">
                          Full name
                        </span>
                        <input
                          type="text"
                          value={settings.full_name}
                          onChange={(event) =>
                            setSettings({ ...settings, full_name: event.target.value })
                          }
                          className="w-full rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm font-medium outline-none transition-all focus:border-[#6183FF]"
                        />
                      </label>

                      <label className="block">
                        <span className="mb-2 block text-[10px] font-black uppercase tracking-widest text-gray-400">
                          Institution or university
                        </span>
                        <input
                          type="text"
                          value={settings.institution}
                          onChange={(event) =>
                            setSettings({ ...settings, institution: event.target.value })
                          }
                          className="w-full rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm font-medium outline-none transition-all focus:border-[#6183FF]"
                        />
                      </label>

                      <label className="block">
                        <span className="mb-2 block text-[10px] font-black uppercase tracking-widest text-gray-400">
                          IRB approval ID (optional)
                        </span>
                        <input
                          type="text"
                          value={settings.irb_number}
                          onChange={(event) =>
                            setSettings({ ...settings, irb_number: event.target.value })
                          }
                          placeholder="Add the reference if your institution issued one"
                          className="w-full rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 font-mono text-sm font-medium outline-none transition-all focus:border-[#6183FF]"
                        />
                      </label>

                      <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-[#F8F9FE] px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.1em] ${
                            identity.verified
                              ? 'bg-green-50 text-green-600'
                              : 'bg-amber-50 text-amber-600'
                          }`}
                        >
                          <CheckBadgeIcon className="h-3 w-3" />
                          {identity.verified ? 'Verified account' : 'Verification pending'}
                        </span>
                        <span className="text-[10px] font-medium text-gray-400">
                          {identity.email}
                        </span>
                      </div>

                      <div className="border-t border-gray-50 pt-6">
                        <button
                          type="button"
                          onClick={() => void saveSettings()}
                          disabled={savingSettings}
                          className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[#050038] px-8 text-sm font-bold text-white shadow-lg transition-colors hover:bg-black disabled:opacity-60"
                        >
                          {savingSettings ? (
                            <>
                              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                              Saving...
                            </>
                          ) : (
                            'Update identity'
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              }
            />

            <Route
              path="*"
              element={
                <div className="py-20 text-center text-gray-500">This page is not available.</div>
              }
            />
          </Routes>
        </div>
      </main>

      <NewStudyModal
        isOpen={isNewSurveyOpen}
        onClose={() => setIsNewSurveyOpen(false)}
        onCreated={handleSurveyCreated}
      />

      {activeSurvey && (
        <div
          className="fixed inset-0 z-[120] flex items-end justify-center bg-[#05081A]/80 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="manage-survey-title"
        >
          <div className="max-h-[92dvh] w-full max-w-2xl overflow-y-auto rounded-t-[28px] bg-white shadow-2xl sm:rounded-[28px]">
            <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-gray-100 bg-white/95 px-5 py-4 backdrop-blur sm:px-7 sm:py-5">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-[#EEF2FF] px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.1em] text-[#6183FF]">
                    {activeSurvey.category}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.1em] ${
                      activeSurvey.is_active
                        ? 'bg-green-50 text-green-600'
                        : 'bg-yellow-50 text-yellow-600'
                    }`}
                  >
                    {activeSurvey.is_active ? 'Open' : 'Paused'}
                  </span>
                </div>
                <h2
                  id="manage-survey-title"
                  className="mt-2 text-lg font-black leading-snug tracking-tight text-[#0A0B14] sm:text-xl"
                >
                  {activeSurvey.title}
                </h2>
                <p className="mt-1 text-xs font-medium leading-relaxed text-gray-500">
                  {activeSurvey.summary}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveSurvey(null)}
                aria-label="Close"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-50 text-gray-400 transition-colors hover:bg-gray-100"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-5 px-5 py-5 sm:px-7 sm:py-6">
              <div className="grid grid-cols-3 gap-2">
                {[
                  {
                    label: 'Responses',
                    value: String(Number(surveyDetailStats?.responses || 0)),
                  },
                  {
                    label: 'Points awarded',
                    value: String(Number(surveyDetailStats?.points_awarded || 0)),
                  },
                  {
                    label: 'Rewards paid',
                    value: formatNaira(Number(surveyDetailStats?.reward_naira || 0)),
                  },
                ].map((item) => (
                  <div key={item.label} className="rounded-xl bg-[#F8F9FE] px-3 py-3">
                    <p className="text-[9px] font-black uppercase tracking-[0.1em] text-gray-400">
                      {item.label}
                    </p>
                    <p className="mt-1 truncate text-lg font-black text-[#101217]">{item.value}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-2xl border border-gray-100 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.12em] text-gray-400">
                    Reward per response
                  </p>
                  <p className="text-sm font-black text-[#101217]">
                    {activeSurvey.points} points ({formatNaira(pointsToNaira(activeSurvey.points))})
                  </p>
                </div>
                <div className="mt-2 flex items-center justify-between gap-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.12em] text-gray-400">
                    Estimated time
                  </p>
                  <p className="text-sm font-bold text-[#101217]">
                    {activeSurvey.estimated_minutes} minutes
                  </p>
                </div>
              </div>

              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.12em] text-gray-400">
                  Questions
                </p>
                <div className="mt-2 space-y-2">
                  {(activeSurvey.questions || []).map((question, index) => (
                    <div
                      key={question.id}
                      className="rounded-xl border border-gray-100 bg-[#FCFDFF] px-4 py-3"
                    >
                      <p className="text-xs font-bold leading-relaxed text-[#101217]">
                        {index + 1}. {question.prompt}
                      </p>
                      <p className="mt-1 text-[10px] font-semibold text-gray-400">
                        {question.question_type === 'single_choice'
                          ? 'Single choice'
                          : question.question_type === 'multi_choice'
                            ? 'Multiple choice'
                            : question.question_type === 'scale'
                              ? 'Rating scale 1 to 5'
                              : 'Short answer'}
                        {question.required ? ' - required' : ' - optional'}
                      </p>
                      {question.options.length > 0 && (
                        <p className="mt-1 text-[10px] font-medium text-gray-400">
                          {question.options.join(' / ')}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <p className="flex items-start gap-2 rounded-xl bg-[#F8F9FE] px-4 py-3 text-[10px] font-medium leading-relaxed text-gray-500">
                <ShieldCheckIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#6183FF]" />
                Answers are stored without the participant name or contact details. You can see
                counts and reward totals only.
              </p>
            </div>

            <div className="sticky bottom-0 flex flex-col-reverse gap-2 border-t border-gray-100 bg-white/95 px-5 py-4 backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:px-7">
              <button
                type="button"
                onClick={() => setActiveSurvey(null)}
                className="min-h-[44px] rounded-xl border border-gray-200 px-5 text-xs font-bold text-gray-600 transition-colors hover:bg-gray-50"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => void toggleSurvey(activeSurvey)}
                className={`inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl px-6 text-sm font-bold text-white transition-colors ${
                  activeSurvey.is_active
                    ? 'bg-[#101217] hover:bg-black'
                    : 'bg-[#6183FF] hover:bg-[#4D6ED6]'
                }`}
              >
                {activeSurvey.is_active ? 'Pause survey' : 'Reopen survey'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
