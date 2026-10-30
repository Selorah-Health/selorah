import type { SupabaseClient } from '@supabase/supabase-js';

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
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return EMPTY_EARNINGS;

  const { data: profile } = await supabase
    .from('patient_profiles')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!profile?.id) return EMPTY_EARNINGS;

  const [earningsRes, withdrawalsRes] = await Promise.all([
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
  ]);

  if (earningsRes.error) throw earningsRes.error;
  if (withdrawalsRes.error) throw withdrawalsRes.error;

  const earnings = (earningsRes.data || []) as EarningRow[];
  const withdrawals = (withdrawalsRes.data || []) as WithdrawalRow[];

  const cleared = earnings.filter((row) =>
    ['available', 'cleared'].includes(String(row.status))
  );
  const paidOut = withdrawals.filter((row) =>
    ['pending', 'processing'].includes(String(row.status))
  );

  return {
    patientId: profile.id,
    available: Math.max(0, sum(cleared) - sum(paidOut)),
    pending: sum(paidOut),
    lifetime: sum(earnings),
    withdrawn: sum(withdrawals.filter((row) => String(row.status) === 'paid')),
    earnings,
    withdrawals,
  };
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
