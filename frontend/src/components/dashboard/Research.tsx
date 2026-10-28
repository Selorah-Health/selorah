import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowRightIcon,
  BeakerIcon,
  ChartBarIcon,
  CheckBadgeIcon,
  CheckCircleIcon,
  ClockIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  LockClosedIcon,
  SparklesIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { useToast } from '../../contexts/ToastContext';
import { createClient } from '../../lib/supabase/client';
import {
  formatNaira,
  normalizeOptions,
  pointsToNaira,
  type Survey,
  type SurveyQuestion,
  type SurveyResponse,
} from '../../lib/surveys';

const OPT_IN_KEY = 'selorah_research_opt_in';

type AnswerValue = string | string[];

type Identity = {
  name: string;
  email: string;
};

function initialsOf(name: string, email: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (email[0] || 'S').toUpperCase();
}

function questionTypeLabel(type: SurveyQuestion['question_type']) {
  if (type === 'single_choice') return 'Choose one';
  if (type === 'multi_choice') return 'Choose all that apply';
  if (type === 'scale') return 'Rate from 1 to 5';
  return 'Short answer';
}

export default function Research() {
  const { success, info, error: toastError } = useToast();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [savingOptIn, setSavingOptIn] = useState(false);
  const [optedIn, setOptedIn] = useState(() => {
    try {
      return localStorage.getItem(OPT_IN_KEY) === '1';
    } catch {
      return false;
    }
  });

  const [identity, setIdentity] = useState<Identity>({ name: 'Research participant', email: '' });
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [responses, setResponses] = useState<SurveyResponse[]>([]);

  const [activeSurvey, setActiveSurvey] = useState<Survey | null>(null);
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const loadResearch = useCallback(async () => {
    setLoading(true);
    setLoadError(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoadError('Sign in to see open surveys and your research balance.');
        return;
      }

      const metaName = [user.user_metadata?.first_name, user.user_metadata?.last_name]
        .filter(Boolean)
        .join(' ')
        .trim();

      const [{ data: profile }, { data: surveyRows, error: surveyError }, { data: responseRows }] =
        await Promise.all([
          supabase
            .from('patient_profiles')
            .select('full_name')
            .eq('user_id', user.id)
            .maybeSingle(),
          supabase
            .from('surveys')
            .select(
              'id, researcher_id, title, summary, description, category, points, estimated_minutes, is_active, closes_at, created_at'
            )
            .eq('is_active', true)
            .order('created_at', { ascending: false }),
          supabase
            .from('survey_responses')
            .select('id, survey_id, points_awarded, reward_naira, created_at')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false }),
        ]);

      if (surveyError) throw surveyError;

      const name = profile?.full_name || metaName || user.email?.split('@')[0] || 'Research participant';
      setIdentity({ name, email: user.email || '' });

      const rows = (surveyRows || []) as Survey[];
      const ids = rows.map((row) => row.id);

      let questions: SurveyQuestion[] = [];
      if (ids.length > 0) {
        const { data: questionRows, error: questionError } = await supabase
          .from('survey_questions')
          .select('id, survey_id, position, prompt, question_type, options, required')
          .in('survey_id', ids)
          .order('position', { ascending: true });

        if (questionError) throw questionError;

        questions = ((questionRows || []) as SurveyQuestion[]).map((question) => ({
          ...question,
          options: normalizeOptions(question.options),
        }));
      }

      const grouped = new Map<string, SurveyQuestion[]>();
      for (const question of questions) {
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
      setResponses((responseRows || []) as SurveyResponse[]);

      const storedOptIn = user.user_metadata?.research_opt_in;
      if (typeof storedOptIn === 'boolean') {
        setOptedIn(storedOptIn);
        localStorage.setItem(OPT_IN_KEY, storedOptIn ? '1' : '0');
      }
    } catch (error) {
      console.error('Failed to load research surveys:', error);
      setLoadError(
        error instanceof Error ? error.message : 'Surveys could not be loaded right now.'
      );
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    void loadResearch();
  }, [loadResearch]);

  const completedIds = useMemo(
    () => new Set(responses.map((response) => response.survey_id)),
    [responses]
  );

  const totalPoints = useMemo(
    () => responses.reduce((sum, row) => sum + Number(row.points_awarded || 0), 0),
    [responses]
  );

  const totalNaira = useMemo(
    () => responses.reduce((sum, row) => sum + Number(row.reward_naira || 0), 0),
    [responses]
  );

  const openSurveys = surveys.filter((survey) => !completedIds.has(survey.id));
  const completedSurveys = surveys.filter((survey) => completedIds.has(survey.id));

  const toggleOptIn = async () => {
    const next = !optedIn;
    const previous = optedIn;
    setOptedIn(next);
    setSavingOptIn(true);

    try {
      localStorage.setItem(OPT_IN_KEY, next ? '1' : '0');
      const { error } = await supabase.auth.updateUser({
        data: { research_opt_in: next },
      });
      if (error) throw error;

      if (next) {
        success(
          'You are on the research list. New surveys that match your profile will appear here.',
          'Research matching on'
        );
      } else {
        info('Research matching is off. Open surveys are still listed for you.');
      }
    } catch (error) {
      setOptedIn(previous);
      toastError(
        error instanceof Error ? error.message : 'Could not save your research preference.',
        'Preference not saved'
      );
    } finally {
      setSavingOptIn(false);
    }
  };

  const openSurvey = (survey: Survey) => {
    setActiveSurvey(survey);
    setAnswers({});
    setConsent(false);
    setFormError(null);
  };

  const closeSurvey = () => {
    if (submitting) return;
    setActiveSurvey(null);
  };

  const setAnswer = (questionId: string, value: AnswerValue) => {
    setAnswers((previous) => ({ ...previous, [questionId]: value }));
    setFormError(null);
  };

  const toggleMultiAnswer = (questionId: string, option: string) => {
    const current = answers[questionId];
    const list = Array.isArray(current) ? current : [];
    const next = list.includes(option)
      ? list.filter((item) => item !== option)
      : [...list, option];
    setAnswer(questionId, next);
  };

  const submitSurvey = async () => {
    if (!activeSurvey) return;
    setFormError(null);

    if (!consent) {
      setFormError('Tick the consent box before submitting your answers.');
      return;
    }

    const questions = activeSurvey.questions || [];
    for (const question of questions) {
      if (!question.required) continue;
      const value = answers[question.id];
      const empty =
        value === undefined ||
        value === '' ||
        (Array.isArray(value) && value.length === 0);
      if (empty) {
        setFormError('Answer every required question before submitting.');
        return;
      }
    }

    setSubmitting(true);

    try {
      const { data, error } = await supabase.rpc('submit_survey_response', {
        p_survey_id: activeSurvey.id,
        p_answers: answers,
      });

      if (error) throw error;

      const result = data as {
        ok?: boolean;
        message?: string;
        response_id?: string;
        points?: number;
        reward_naira?: number;
      } | null;

      if (!result?.ok || !result.response_id) {
        setFormError(result?.message || 'Your answers were not saved. Please try again.');
        return;
      }

      const awarded = Number(result.points || activeSurvey.points);
      const reward = Number(result.reward_naira || pointsToNaira(awarded));

      setResponses((previous) => [
        {
          id: result.response_id as string,
          survey_id: activeSurvey.id,
          points_awarded: awarded,
          reward_naira: reward,
          created_at: new Date().toISOString(),
        },
        ...previous,
      ]);

      success(
        `${awarded} points added. That is ${formatNaira(reward)} in your research balance.`,
        'Survey complete'
      );
      setActiveSurvey(null);
      setAnswers({});
      setConsent(false);
    } catch (error) {
      console.error('Survey submission failed:', error);
      setFormError(
        error instanceof Error ? error.message : 'Your answers were not saved. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 font-sora">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[#101217] sm:text-3xl">
            Clinical research
          </h2>
          <p className="mt-1 text-sm font-medium text-gray-400">
            Answer approved surveys on your terms. Every point is worth ₦2.
          </p>
        </div>
        <button
          type="button"
          onClick={toggleOptIn}
          disabled={savingOptIn}
          aria-pressed={optedIn}
          className={`inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full px-5 text-xs font-bold transition-all disabled:opacity-60 ${
            optedIn
              ? 'bg-[#EAFBF2] text-[#15955C]'
              : 'bg-[#6183FF] text-white shadow-lg shadow-[#6183FF]/20 hover:bg-[#4D6ED6]'
          }`}
        >
          {optedIn ? (
            <>
              <CheckCircleIcon className="h-4 w-4" />
              Research matching on
            </>
          ) : (
            <>
              <SparklesIcon className="h-4 w-4" />
              {savingOptIn ? 'Saving...' : 'Enable research matching'}
            </>
          )}
        </button>
      </div>

      <section className="flex flex-col gap-4 rounded-[24px] border border-gray-100 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#6183FF] to-[#14F1D9] text-sm font-black text-white">
            {initialsOf(identity.name, identity.email)}
          </div>
          <div className="min-w-0">
            <p className="text-[9px] font-black uppercase tracking-[0.16em] text-gray-400">
              Research identity
            </p>
            <p className="truncate text-sm font-bold text-[#101217]">{identity.name}</p>
            <p className="truncate text-[11px] font-medium text-gray-400">
              {identity.email || 'Signed in account'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:min-w-[260px]">
          <div className="rounded-xl bg-[#F8F9FE] px-4 py-2.5">
            <p className="text-[9px] font-black uppercase tracking-[0.12em] text-gray-400">
              Points
            </p>
            <p className="mt-0.5 text-lg font-black text-[#101217]">{totalPoints}</p>
          </div>
          <div className="rounded-xl bg-[#EAFBF2] px-4 py-2.5">
            <p className="text-[9px] font-black uppercase tracking-[0.12em] text-[#15955C]">
              Value
            </p>
            <p className="mt-0.5 text-lg font-black text-[#15955C]">{formatNaira(totalNaira)}</p>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          {
            label: 'Open surveys',
            value: String(openSurveys.length).padStart(2, '0'),
            icon: BeakerIcon,
            color: 'text-[#6183FF]',
            bg: 'bg-[#EEF2FF]',
          },
          {
            label: 'Completed',
            value: String(completedSurveys.length).padStart(2, '0'),
            icon: ChartBarIcon,
            color: 'text-purple-500',
            bg: 'bg-purple-50',
          },
          {
            label: 'Research earnings',
            value: formatNaira(totalNaira),
            icon: CurrencyDollarIcon,
            color: 'text-green-600',
            bg: 'bg-green-50',
          },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-[24px] border border-gray-50 bg-white p-5 shadow-sm"
          >
            <div
              className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl ${card.bg}`}
            >
              <card.icon className={`h-5 w-5 ${card.color}`} />
            </div>
            <p className="text-[9px] font-black uppercase tracking-[0.16em] text-gray-400">
              {card.label}
            </p>
            <p className="mt-1 text-2xl font-bold tracking-tight text-[#101217]">{card.value}</p>
          </div>
        ))}
      </div>

      <section className="rounded-[28px] border border-gray-50 bg-white p-5 shadow-sm sm:p-7">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 className="text-lg font-bold tracking-tight text-[#101217]">Open surveys</h3>
            <p className="mt-1 text-xs font-medium text-gray-400">
              Each survey shows the reward and what it asks before you start.
            </p>
          </div>
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-[#F8F9FE] px-3 py-1.5 text-[10px] font-bold text-gray-500">
            <CurrencyDollarIcon className="h-3.5 w-3.5 text-[#15955C]" />₦2 per point
          </span>
        </div>

        {loading ? (
          <div className="mt-6 space-y-3">
            {[0, 1, 2].map((item) => (
              <div key={item} className="h-28 animate-pulse rounded-2xl bg-[#F8F9FE]" />
            ))}
          </div>
        ) : loadError ? (
          <div className="mt-6 rounded-2xl border border-amber-100 bg-amber-50 px-5 py-6 text-center">
            <p className="text-sm font-bold text-amber-800">Surveys are unavailable</p>
            <p className="mt-1 text-xs font-medium leading-relaxed text-amber-700">{loadError}</p>
            <button
              type="button"
              onClick={() => void loadResearch()}
              className="mt-4 min-h-[40px] rounded-full bg-amber-500 px-4 text-[11px] font-bold text-white"
            >
              Try again
            </button>
          </div>
        ) : surveys.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-gray-200 px-5 py-10 text-center">
            <BeakerIcon className="mx-auto h-8 w-8 text-gray-200" />
            <p className="mt-3 text-sm font-bold text-gray-500">No surveys are open yet</p>
            <p className="mt-1 text-xs font-medium text-gray-400">
              New approved surveys will appear here as soon as they open.
            </p>
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            {surveys.map((survey) => {
              const completed = completedIds.has(survey.id);
              const response = responses.find((row) => row.survey_id === survey.id);
              const questionCount = survey.questions?.length || 0;

              return (
                <article
                  key={survey.id}
                  className="rounded-[22px] border border-gray-100 bg-white p-4 transition-all hover:border-[#6183FF]/25 hover:shadow-lg hover:shadow-blue-500/5 sm:p-5"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-[#EEF2FF] px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.1em] text-[#6183FF]">
                          {survey.category}
                        </span>
                        {completed ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.1em] text-green-600">
                            <CheckBadgeIcon className="h-3 w-3" />
                            Completed
                          </span>
                        ) : (
                          <span className="rounded-full bg-[#F8F9FE] px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.1em] text-gray-400">
                            Open
                          </span>
                        )}
                      </div>

                      <h4 className="mt-2.5 text-base font-bold leading-snug text-[#101217]">
                        {survey.title}
                      </h4>
                      <p className="mt-1 text-xs font-medium leading-relaxed text-gray-500">
                        {survey.summary}
                      </p>

                      <div className="mt-3 flex flex-wrap items-center gap-3 text-[10px] font-semibold text-gray-400">
                        <span className="inline-flex items-center gap-1">
                          <ClockIcon className="h-3.5 w-3.5" />
                          {survey.estimated_minutes} min
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <DocumentTextIcon className="h-3.5 w-3.5" />
                          {questionCount} questions
                        </span>
                        <span className="inline-flex items-center gap-1 text-[#15955C]">
                          <CurrencyDollarIcon className="h-3.5 w-3.5" />
                          {survey.points} points
                        </span>
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-row items-center gap-3 sm:flex-col sm:items-end">
                      <div className="text-right">
                        <p className="text-lg font-black text-[#101217]">
                          {formatNaira(pointsToNaira(survey.points))}
                        </p>
                        <p className="text-[9px] font-black uppercase tracking-[0.1em] text-gray-400">
                          {completed ? 'Earned' : 'Reward'}
                        </p>
                      </div>
                      {completed ? (
                        <span className="inline-flex min-h-[40px] items-center gap-1.5 rounded-full bg-green-50 px-4 text-[11px] font-bold text-green-600">
                          <CheckCircleIcon className="h-4 w-4" />
                          {response ? formatNaira(Number(response.reward_naira)) : 'Done'}
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => openSurvey(survey)}
                          className="inline-flex min-h-[40px] items-center gap-1.5 rounded-full bg-[#6183FF] px-4 text-[11px] font-bold text-white shadow-lg shadow-[#6183FF]/20 transition-colors hover:bg-[#4D6ED6]"
                        >
                          Start survey
                          <ArrowRightIcon className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <div className="rounded-[24px] border border-gray-100 bg-white p-5">
        <div className="grid gap-3 text-left sm:grid-cols-3">
          {[
            {
              icon: SparklesIcon,
              title: 'Matched',
              body: 'We compare your profile to study criteria privately.',
            },
            {
              icon: ChartBarIcon,
              title: 'Consent',
              body: 'You see what is shared and approve it first.',
            },
            {
              icon: CurrencyDollarIcon,
              title: 'Rewarded',
              body: 'Approved participation adds points to your research balance.',
            },
          ].map((step) => (
            <div key={step.title} className="rounded-2xl bg-[#F8F9FE] p-4">
              <step.icon className="h-4 w-4 text-[#6183FF]" />
              <p className="mt-2 text-xs font-bold text-[#101217]">{step.title}</p>
              <p className="mt-1 text-[11px] font-medium leading-relaxed text-gray-400">
                {step.body}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-4 flex items-center justify-center gap-2 text-[11px] font-semibold text-gray-400">
          <LockClosedIcon className="h-3.5 w-3.5" />
          Your name and contact details are never attached to a survey answer.
        </div>
      </div>

      {activeSurvey && (
        <div
          className="fixed inset-0 z-[120] flex items-end justify-center bg-[#05081A]/80 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="survey-title"
        >
          <div className="max-h-[92dvh] w-full max-w-2xl overflow-y-auto rounded-t-[28px] bg-white shadow-2xl sm:rounded-[28px]">
            <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-gray-100 bg-white/95 px-5 py-4 backdrop-blur sm:px-7 sm:py-5">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-[#EEF2FF] px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.1em] text-[#6183FF]">
                    {activeSurvey.category}
                  </span>
                  <span className="rounded-full bg-green-50 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.1em] text-green-600">
                    {formatNaira(pointsToNaira(activeSurvey.points))} reward
                  </span>
                </div>
                <h2
                  id="survey-title"
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
                onClick={closeSurvey}
                disabled={submitting}
                aria-label="Close survey"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-50 text-gray-400 transition-colors hover:bg-gray-100 disabled:opacity-50"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-5 px-5 py-5 sm:px-7 sm:py-6">
              <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-[#F8F9FE] px-4 py-3 text-[10px] font-semibold text-gray-500">
                <span className="inline-flex items-center gap-1.5">
                  <ClockIcon className="h-3.5 w-3.5 text-[#6183FF]" />
                  About {activeSurvey.estimated_minutes} minutes
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <DocumentTextIcon className="h-3.5 w-3.5 text-[#6183FF]" />
                  {activeSurvey.questions?.length || 0} questions
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CurrencyDollarIcon className="h-3.5 w-3.5 text-[#15955C]" />
                  {activeSurvey.points} points
                </span>
              </div>

              {(activeSurvey.questions || []).map((question, index) => {
                const value = answers[question.id];
                const multiValue = Array.isArray(value) ? value : [];

                return (
                  <div key={question.id}>
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-bold leading-relaxed text-[#101217]">
                        <span className="mr-1.5 text-[#6183FF]">{index + 1}.</span>
                        {question.prompt}
                        {question.required && <span className="ml-1 text-red-400">*</span>}
                      </p>
                      <span className="shrink-0 rounded-full bg-[#F8F9FE] px-2 py-1 text-[8px] font-black uppercase tracking-[0.08em] text-gray-400">
                        {questionTypeLabel(question.question_type)}
                      </span>
                    </div>

                    {question.question_type === 'short_text' ? (
                      <textarea
                        value={typeof value === 'string' ? value : ''}
                        onChange={(event) => setAnswer(question.id, event.target.value)}
                        rows={3}
                        placeholder="Type your answer"
                        className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-xs font-medium leading-relaxed text-[#101217] outline-none transition-colors placeholder:text-gray-300 focus:border-[#6183FF]"
                      />
                    ) : question.question_type === 'scale' ? (
                      <div className="mt-2">
                        <div className="grid grid-cols-5 gap-2">
                          {['1', '2', '3', '4', '5'].map((option) => (
                            <button
                              key={option}
                              type="button"
                              onClick={() => setAnswer(question.id, option)}
                              className={`min-h-[46px] rounded-xl border text-sm font-bold transition-all ${
                                value === option
                                  ? 'border-[#6183FF] bg-[#EEF2FF] text-[#6183FF]'
                                  : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
                              }`}
                            >
                              {option}
                            </button>
                          ))}
                        </div>
                        <div className="mt-1.5 flex justify-between text-[9px] font-semibold uppercase tracking-[0.08em] text-gray-300">
                          <span>Not confident</span>
                          <span>Very confident</span>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {question.options.map((option) => {
                          const selected =
                            question.question_type === 'multi_choice'
                              ? multiValue.includes(option)
                              : value === option;

                          return (
                            <button
                              key={option}
                              type="button"
                              onClick={() =>
                                question.question_type === 'multi_choice'
                                  ? toggleMultiAnswer(question.id, option)
                                  : setAnswer(question.id, option)
                              }
                              className={`min-h-[40px] rounded-full border px-3.5 text-[11px] font-bold transition-all ${
                                selected
                                  ? 'border-[#6183FF] bg-[#EEF2FF] text-[#6183FF]'
                                  : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
                              }`}
                            >
                              {option}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}

              <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-gray-100 bg-[#F8F9FE] px-4 py-3">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(event) => {
                    setConsent(event.target.checked);
                    setFormError(null);
                  }}
                  className="mt-0.5 h-4 w-4 shrink-0 rounded border-gray-300 text-[#6183FF] focus:ring-[#6183FF]"
                />
                <span className="text-[11px] font-medium leading-relaxed text-gray-500">
                  I consent to my answers being used for this survey. I understand that my name
                  and contact details are not included in the dataset.
                </span>
              </label>

              {formError && (
                <p className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-[11px] font-semibold leading-relaxed text-red-600">
                  {formError}
                </p>
              )}
            </div>

            <div className="sticky bottom-0 flex flex-col-reverse gap-2 border-t border-gray-100 bg-white/95 px-5 py-4 backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:px-7">
              <p className="text-[10px] font-semibold text-gray-400">
                Reward on completion: {activeSurvey.points} points (
                {formatNaira(pointsToNaira(activeSurvey.points))})
              </p>
              <button
                type="button"
                onClick={() => void submitSurvey()}
                disabled={submitting || !consent}
                className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-xl bg-[#6183FF] px-6 text-sm font-bold text-white shadow-lg shadow-[#6183FF]/20 transition-colors hover:bg-[#4D6ED6] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Submitting...
                  </>
                ) : (
                  <>
                    Submit answers
                    <ArrowRightIcon className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
