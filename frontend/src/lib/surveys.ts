export const NAIRA_PER_POINT = 20;
export const MIN_SURVEY_QUESTIONS = 15;

export type QuestionType = 'single_choice' | 'multi_choice' | 'short_text' | 'scale';

export type SurveyQuestion = {
  id: string;
  survey_id: string;
  position: number;
  prompt: string;
  question_type: QuestionType;
  options: string[];
  required: boolean;
};

export type Survey = {
  id: string;
  researcher_id?: string;
  title: string;
  summary: string;
  description: string | null;
  category: string;
  points: number;
  estimated_minutes: number;
  is_active?: boolean;
  closes_at: string | null;
  created_at: string;
  questions?: SurveyQuestion[];
};

export type SurveyResponse = {
  id: string;
  survey_id: string;
  points_awarded: number;
  reward_naira: number;
  created_at: string;
};

export type SurveyStats = {
  survey_id: string;
  responses: number;
  points_awarded: number;
  reward_naira: number;
};

export function pointsToNaira(points: number) {
  return points * NAIRA_PER_POINT;
}

/**
 * Older survey responses stored the reward at the old per-point rate. The
 * current rate is the source of truth, so never show less than points x 20.
 * A higher stored value is kept because some studies may add a bonus.
 */
export function normalizeSurveyReward(
  row: {
    points_awarded?: number | string | null;
    reward_naira?: number | string | null;
  },
  surveyPoints?: number | string | null
) {
  // The survey card shows the current question count as points. Older
  // responses can hold a lower snapshot, so use whichever value is larger.
  const points = Math.max(
    Number(row.points_awarded || 0),
    Number(surveyPoints || 0)
  );
  const stored = Number(row.reward_naira || 0);
  return Math.max(stored, points * NAIRA_PER_POINT);
}

export function formatNaira(value: number) {
  return `₦${Math.round(value).toLocaleString('en-NG')}`;
}

export function normalizeOptions(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item)).filter(Boolean);
}
