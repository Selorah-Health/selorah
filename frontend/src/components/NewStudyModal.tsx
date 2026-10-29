import { useEffect, useState } from 'react';
import {
  BeakerIcon,
  ClockIcon,
  DocumentTextIcon,
  PlusIcon,
  TrashIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { createClient } from '../lib/supabase/client';
import {
  pointsToNaira,
  formatNaira,
  type QuestionType,
  type Survey,
  type SurveyQuestion,
} from '../lib/surveys';

interface NewStudyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (survey: Survey) => void;
}

type DraftQuestion = {
  key: string;
  prompt: string;
  type: QuestionType;
  optionsText: string;
  required: boolean;
};

const TYPE_LABELS: Record<QuestionType, string> = {
  single_choice: 'Single choice',
  multi_choice: 'Multiple choice',
  short_text: 'Short answer',
  scale: 'Rating scale (1 to 5)',
};

function newQuestion(): DraftQuestion {
  return {
    key: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    prompt: '',
    type: 'single_choice',
    optionsText: '',
    required: true,
  };
}

function splitOptions(value: string) {
  return value
    .split(/[,;\n]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function NewStudyModal({ isOpen, onClose, onCreated }: NewStudyModalProps) {
  const supabase = createClient();
  const [form, setForm] = useState({
    title: '',
    summary: '',
    category: 'General health',
    minutes: '4',
  });
  const [questions, setQuestions] = useState<DraftQuestion[]>([newQuestion()]);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = 'hidden';
    setForm({ title: '', summary: '', category: 'General health', minutes: '4' });
    setQuestions([newQuestion()]);
    setErrorMsg(null);
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const updateQuestion = (key: string, patch: Partial<DraftQuestion>) => {
    setQuestions((previous) =>
      previous.map((question) => (question.key === key ? { ...question, ...patch } : question))
    );
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMsg(null);

    const title = form.title.trim();
    const summary = form.summary.trim();
    const minutes = Number(form.minutes);

    if (title.length < 4) {
      setErrorMsg('Add a clear survey title.');
      return;
    }
    if (summary.length < 10) {
      setErrorMsg('Add a short summary so participants know what the survey covers.');
      return;
    }
    if (!Number.isFinite(minutes) || minutes < 1 || minutes > 60) {
      setErrorMsg('Estimated time must be between 1 and 60 minutes.');
      return;
    }

    const prepared = questions
      .map((question) => ({
        prompt: question.prompt.trim(),
        type: question.type,
        options:
          question.type === 'scale'
            ? ['1', '2', '3', '4', '5']
            : question.type === 'short_text'
              ? []
              : splitOptions(question.optionsText),
        required: question.required,
      }))
      .filter((question) => question.prompt.length > 0);

    if (prepared.length === 0) {
      setErrorMsg('Add at least one question.');
      return;
    }

    const invalid = prepared.find(
      (question) =>
        (question.type === 'single_choice' || question.type === 'multi_choice') &&
        question.options.length < 2
    );
    if (invalid) {
      setErrorMsg('Choice questions need at least two options, separated by commas.');
      return;
    }

    setSubmitting(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error('Sign in again to create a survey.');

      const { data: survey, error } = await supabase
        .from('surveys')
        .insert({
          researcher_id: user.id,
          title,
          summary,
          description: summary,
          category: form.category.trim() || 'General health',
          points: Math.max(prepared.length, 1),
          estimated_minutes: minutes,
          is_active: true,
        })
        .select('*')
        .single();

      if (error) throw error;

      const { data: questionRows, error: questionError } = await supabase
        .from('survey_questions')
        .insert(
          prepared.map((question, index) => ({
            survey_id: survey.id,
            position: index + 1,
            prompt: question.prompt,
            question_type: question.type,
            options: question.options,
            required: question.required,
          }))
        )
        .select('id, survey_id, position, prompt, question_type, options, required');

      if (questionError) {
        await supabase.from('surveys').delete().eq('id', survey.id);
        throw questionError;
      }

      onCreated({
        ...(survey as Survey),
        points: prepared.length,
        questions: (questionRows || []) as SurveyQuestion[],
      });
      onClose();
    } catch (error) {
      setErrorMsg(
        error instanceof Error ? error.message : 'The survey could not be created. Try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-end justify-center bg-[#050038]/70 p-0 backdrop-blur-md sm:items-center sm:p-4">
      <div className="relative max-h-[94dvh] w-full max-w-2xl overflow-y-auto rounded-t-[32px] border border-white/10 bg-[#0A0B14] p-6 shadow-2xl sm:rounded-[32px] sm:p-8">
        <button
          type="button"
          onClick={onClose}
          disabled={submitting}
          aria-label="Close"
          className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-gray-400 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-50"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3 pr-10">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#6183FF]/30 bg-[#6183FF]/15 text-[#6183FF]">
            <BeakerIcon className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#6183FF]">
              Researcher tools
            </p>
            <h3 className="text-xl font-black tracking-tight text-white">Create a survey</h3>
          </div>
        </div>

        <p className="mt-3 text-xs font-medium leading-relaxed text-gray-400">
          Participants see the reward, the questions, and what is collected before they consent.
          Every point is worth {formatNaira(2)}.
        </p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.14em] text-[#6183FF]">
              Survey title
            </span>
            <input
              value={form.title}
              onChange={(event) => setForm({ ...form, title: event.target.value })}
              placeholder="e.g. Asthma control in young adults"
              className="min-h-[46px] w-full rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-semibold text-white outline-none transition-colors placeholder:text-gray-600 focus:border-[#6183FF]"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.14em] text-[#6183FF]">
              Summary
            </span>
            <textarea
              value={form.summary}
              onChange={(event) => setForm({ ...form, summary: event.target.value })}
              rows={2}
              placeholder="What the survey studies and what participants will be asked."
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium leading-relaxed text-white outline-none transition-colors placeholder:text-gray-600 focus:border-[#6183FF]"
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.14em] text-[#6183FF]">
                Category
              </span>
              <input
                value={form.category}
                onChange={(event) => setForm({ ...form, category: event.target.value })}
                placeholder="Cardiovascular health"
                className="min-h-[46px] w-full rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-semibold text-white outline-none transition-colors placeholder:text-gray-600 focus:border-[#6183FF]"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.14em] text-[#6183FF]">
                Minutes
              </span>
              <div className="relative">
                <ClockIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                <input
                  type="number"
                  min={1}
                  max={60}
                  value={form.minutes}
                  onChange={(event) => setForm({ ...form, minutes: event.target.value })}
                  className="min-h-[46px] w-full rounded-xl border border-white/10 bg-white/5 pl-10 pr-3 text-sm font-semibold text-white outline-none transition-colors focus:border-[#6183FF]"
                />
              </div>
            </label>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-[11px] font-semibold text-gray-400">
            Participant reward: 1 point per question. {questions.length} question
            {questions.length === 1 ? '' : 's'}, worth{' '}
            {formatNaira(pointsToNaira(questions.length))}.
          </div>

          <div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-[10px] font-black uppercase tracking-[0.14em] text-[#6183FF]">
                Questions
              </span>
              <button
                type="button"
                onClick={() => setQuestions((previous) => [...previous, newQuestion()])}
                className="inline-flex min-h-[34px] items-center gap-1.5 rounded-full bg-white/5 px-3 text-[10px] font-bold text-gray-300 transition-colors hover:bg-white/10 hover:text-white"
              >
                <PlusIcon className="h-3.5 w-3.5" />
                Add question
              </button>
            </div>

            <div className="mt-3 space-y-3">
              {questions.map((question, index) => (
                <div
                  key={question.key}
                  className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-[10px] font-black uppercase tracking-[0.12em] text-gray-500">
                      Question {index + 1}
                    </span>
                    {questions.length > 1 && (
                      <button
                        type="button"
                        onClick={() =>
                          setQuestions((previous) =>
                            previous.filter((item) => item.key !== question.key)
                          )
                        }
                        aria-label="Remove question"
                        className="text-gray-500 transition-colors hover:text-red-400"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  <input
                    value={question.prompt}
                    onChange={(event) =>
                      updateQuestion(question.key, { prompt: event.target.value })
                    }
                    placeholder="Type the question"
                    className="mt-2 min-h-[42px] w-full rounded-xl border border-white/10 bg-white/5 px-3.5 text-sm font-semibold text-white outline-none transition-colors placeholder:text-gray-600 focus:border-[#6183FF]"
                  />

                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    <select
                      value={question.type}
                      onChange={(event) =>
                        updateQuestion(question.key, {
                          type: event.target.value as QuestionType,
                        })
                      }
                      className="min-h-[42px] rounded-xl border border-white/10 bg-white/5 px-3 text-xs font-semibold text-white outline-none focus:border-[#6183FF]"
                    >
                      {(Object.keys(TYPE_LABELS) as QuestionType[]).map((type) => (
                        <option key={type} value={type} className="bg-[#0A0B14]">
                          {TYPE_LABELS[type]}
                        </option>
                      ))}
                    </select>

                    <label className="flex min-h-[42px] cursor-pointer items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 text-[11px] font-semibold text-gray-300">
                      <input
                        type="checkbox"
                        checked={question.required}
                        onChange={(event) =>
                          updateQuestion(question.key, { required: event.target.checked })
                        }
                        className="h-4 w-4 rounded border-gray-600 bg-transparent text-[#6183FF]"
                      />
                      Required
                    </label>
                  </div>

                  {(question.type === 'single_choice' || question.type === 'multi_choice') && (
                    <input
                      value={question.optionsText}
                      onChange={(event) =>
                        updateQuestion(question.key, { optionsText: event.target.value })
                      }
                      placeholder="Options, separated by commas"
                      className="mt-2 min-h-[42px] w-full rounded-xl border border-white/10 bg-white/5 px-3.5 text-xs font-medium text-white outline-none transition-colors placeholder:text-gray-600 focus:border-[#6183FF]"
                    />
                  )}

                  {(question.type === 'short_text' || question.type === 'scale') && (
                    <p className="mt-2 flex items-center gap-1.5 text-[10px] font-medium text-gray-500">
                      <DocumentTextIcon className="h-3.5 w-3.5" />
                      {question.type === 'scale'
                        ? 'Participants choose a score from 1 to 5.'
                        : 'Participants type a short written answer.'}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {errorMsg && (
            <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-[11px] font-semibold leading-relaxed text-red-300">
              {errorMsg}
            </p>
          )}

          <div className="flex flex-col-reverse gap-2 border-t border-white/10 pt-4 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="min-h-[44px] rounded-xl border border-white/10 px-5 text-xs font-bold text-gray-300 transition-colors hover:bg-white/5 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-[#6183FF] px-6 text-sm font-bold text-white shadow-lg shadow-[#6183FF]/25 transition-colors hover:bg-[#4D6ED6] disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Publishing...
                </>
              ) : (
                <>
                  <BeakerIcon className="h-4 w-4" />
                  Publish survey
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
