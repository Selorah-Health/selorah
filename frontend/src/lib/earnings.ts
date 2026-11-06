import type { SupabaseClient } from '@supabase/supabase-js';
import { normalizeSurveyReward } from './surveys';
import { isOffline, readSnapshot, writeSnapshot } from './offlineSnapshot';

export const EARNINGS_EVENT = 'selorah:earnings-updated';

export type EarningRow = {
  id: string;
  amount_local: number;
  currency: string;
  status: string;
  source: string | null;
  description: string | null;
  created_at: string;
};

export type WithdrawalRow = {
  id: string;
  amount_local: number;
  currency: string;
  status: string;
  bank_name: string | null;
  bank_code: string | null;
  account_number: string | null;
  account_name: string | null;
  admin_note: string | null;
  created_at: string;
  processed_at: string | null;
};

export type EarningsSummary = {
  patientId: string | null;
  available: number;
  pending: number;
  lifetime: number;
  withdrawn: number;
  earnings: EarningRow[];
  withdrawals: WithdrawalRow[];
};

export const EMPTY_EARNINGS: EarningsSummary = {
  patientId: null,
  available: 0,
  pending: 0,
  lifetime: 0,
  withdrawn: 0,
  earnings: [],
  withdrawals: [],
};

function sum(rows: { amount_local: number | string }[]) {
  return rows.reduce((total, row) => total + Number(row.amount_local || 0), 0);
}

export async function fetchEarnings(supabase: SupabaseClient): Promise<EarningsSummary> {
  const cached = readSnapshot<EarningsSummary>('earnings');
  if (isOffline()) return cached || EMPTY_EARNINGS;

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return cached || EMPTY_EARNINGS;

    const { data: profile } = await supabase
      .from('patient_profiles')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!profile?.id) return cached || EMPTY_EARNINGS;

    const [earningsRes, withdrawalsRes, surveyRes] = await Promise.all([
      supabase
        .from('earnings')
        .select('id, amount_local, currency, status, source, description, created_at')
        .eq('patient_id', profile.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('withdrawals')
        .select(
          'id, amount_local, currency, status, bank_name, bank_code, account_number, account_name, admin_note, created_at, processed_at'
        )
        .eq('patient_id', profile.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('survey_responses')
        .select('survey_id, points_awarded, reward_naira, created_at')
        .eq('user_id', user.id),
    ]);

    if (earningsRes.error) return cached || EMPTY_EARNINGS;
    if (withdrawalsRes.error) return cached || EMPTY_EARNINGS;

    const earnings = (earningsRes.data || []) as EarningRow[];
    const withdrawals = (withdrawalsRes.data || []) as WithdrawalRow[];

    // Normalize legacy survey earnings at read time. The migration does the same
    // in the database, but this keeps the balance correct before it runs.
    const surveyRows = (surveyRes.data || []) as Array<{
      survey_id?: string | null;
      points_awarded?: number | string | null;
      reward_naira?: number | string | null;
      created_at?: string | null;
    }>;

    const surveyIds = Array.from(
      new Set(surveyRows.map((row) => row.survey_id).filter(Boolean))
    ) as string[];
    const surveyPoints = new Map<string, number>();
    if (surveyIds.length > 0) {
      const { data: surveyData } = await supabase
        .from('surveys')
        .select('id, points')
        .in('id', surveyIds);
      for (const survey of (surveyData || []) as Array<{
        id: string;
        points?: number | string | null;
      }>) {
        surveyPoints.set(String(survey.id), Number(survey.points || 0));
      }
    }

    const surveyRewards = surveyRows
      .map((row) => ({
        at: row.created_at ? new Date(row.created_at).getTime() : Number.NaN,
        amount: normalizeSurveyReward(
          row,
          row.survey_id ? surveyPoints.get(row.survey_id) : undefined
        ),
      }))
      .filter((row) => Number.isFinite(row.at));

    const normalizedEarnings = earnings.map((row) => {
      if (String(row.source || '') !== 'survey') return row;
      const at = new Date(row.created_at).getTime();
      if (!Number.isFinite(at)) return row;

      let closest: { at: number; amount: number } | null = null;
      for (const reward of surveyRewards) {
        const delta = Math.abs(at - reward.at);
        if (delta > 10 * 60 * 1000) continue;
        if (!closest || delta < Math.abs(at - closest.at)) closest = reward;
      }

      if (closest && Number(row.amount_local || 0) < closest.amount) {
        return { ...row, amount_local: closest.amount };
      }
      return row;
    });

    const cleared = normalizedEarnings.filter((row) =>
      ['available', 'cleared'].includes(String(row.status))
    );
    const paidOut = withdrawals.filter((row) =>
      ['pending', 'processing'].includes(String(row.status))
    );

    const summary: EarningsSummary = {
      patientId: profile.id,
      available: Math.max(0, sum(cleared) - sum(paidOut)),
      pending: sum(paidOut),
      lifetime: sum(normalizedEarnings),
      withdrawn: sum(withdrawals.filter((row) => String(row.status) === 'paid')),
      earnings: normalizedEarnings,
      withdrawals,
    };

    writeSnapshot('earnings', summary);
    return summary;
  } catch {
    return cached || EMPTY_EARNINGS;
  }
}

export function notifyEarningsChanged() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(EARNINGS_EVENT));
}

export function subscribeEarnings(
  supabase: SupabaseClient,
  patientId: string,
  onChange: () => void
) {
  const channel = supabase
    .channel(`earnings:${patientId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'earnings',
        filter: `patient_id=eq.${patientId}`,
      },
      onChange
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'withdrawals',
        filter: `patient_id=eq.${patientId}`,
      },
      onChange
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}

export async function requestWithdrawal(
  supabase: SupabaseClient,
  input: {
    amount: number;
    bankCode: string;
    bankName: string;
    accountNumber: string;
    accountName: string;
  }
) {
  const { data, error } = await supabase.rpc('request_withdrawal', {
    p_amount: input.amount,
    p_bank_code: input.bankCode,
    p_bank_name: input.bankName,
    p_account_number: input.accountNumber,
    p_account_name: input.accountName,
  });
  if (error) throw error;
  const result = data as { ok?: boolean; message?: string } | null;
  if (!result?.ok) throw new Error(result?.message || 'The withdrawal could not be requested.');
  notifyEarningsChanged();
  return result;
}

export function formatNaira(value: number) {
  return `\u20a6${Math.round(value).toLocaleString('en-NG')}`;
}
