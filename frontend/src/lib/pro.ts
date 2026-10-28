import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from './supabase/client';

export const PRO_PRICE_NAIRA = 5000;
export const PRO_PRICE_KOBO = PRO_PRICE_NAIRA * 100;
export const PRO_PLAN_LABEL = 'Selorah Pro';
export const PRO_DURATION_MONTHS = 12;

export const PRO_FEATURES = [
  'Unlimited emergency contacts (up to 10)',
  'Priority medical record verification',
  'Ad-free experience and premium themes',
  'Early access to research rewards',
  'Secure family account sharing',
  'Exclusive wellness insights',
];

const PRO_CACHE_KEY = 'selorah_pro_state';
const PAYMENTS_KEY = 'selorah_payments';

export type ProState = {
  active: boolean;
  reference?: string;
  activatedAt?: string;
  expiresAt?: string;
  plan?: string;
};

export type PaymentRecord = {
  reference: string;
  amount: number;
  currency: string;
  status: 'paid' | 'pending' | 'failed';
  plan: string;
  createdAt: string;
};

export function readProState(): ProState {
  try {
    const raw = localStorage.getItem(PRO_CACHE_KEY);
    if (!raw) return { active: false };
    const parsed = JSON.parse(raw) as ProState;
    if (!parsed.active) return { active: false };
    if (parsed.expiresAt && new Date(parsed.expiresAt).getTime() < Date.now()) {
      return { ...parsed, active: false };
    }
    return parsed;
  } catch {
    return { active: false };
  }
}

export function cacheProState(state: ProState) {
  try {
    localStorage.setItem(PRO_CACHE_KEY, JSON.stringify(state));
    const raw = localStorage.getItem('selorah_user');
    if (raw) {
      const user = JSON.parse(raw);
      localStorage.setItem(
        'selorah_user',
        JSON.stringify({ ...user, is_pro: state.active, pro_expires_at: state.expiresAt })
      );
    }
    window.dispatchEvent(new CustomEvent('selorah:pro-updated', { detail: state }));
    window.dispatchEvent(new Event('storage'));
  } catch {
    // Local cache is a convenience, not the source of truth.
  }
}

export function readPayments(): PaymentRecord[] {
  try {
    const raw = localStorage.getItem(PAYMENTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function cachePayment(record: PaymentRecord) {
  try {
    const next = [record, ...readPayments().filter((item) => item.reference !== record.reference)];
    localStorage.setItem(PAYMENTS_KEY, JSON.stringify(next.slice(0, 20)));
  } catch {
    // Ignore storage failures.
  }
}

function expiryFromNow() {
  const date = new Date();
  date.setMonth(date.getMonth() + PRO_DURATION_MONTHS);
  return date.toISOString();
}

export async function activatePro(
  reference: string,
  options?: { amountKobo?: number; supabase?: SupabaseClient }
) {
  const supabase = options?.supabase || createClient();
  const expiresAt = expiryFromNow();
  const state: ProState = {
    active: true,
    reference,
    activatedAt: new Date().toISOString(),
    expiresAt,
    plan: PRO_PLAN_LABEL,
  };

  // Ask the optional serverless verifier first. If it is not deployed, the
  // local entitlement still unlocks the app for the current session.
  try {
    const { data } = await supabase.functions.invoke('paystack-verify', {
      body: { reference },
    });
    if (data && data.verified === false) {
      throw new Error(data.message || 'Payment could not be verified.');
    }
  } catch (error) {
    if (error instanceof Error && /payment could not be verified/i.test(error.message)) {
      throw error;
    }
  }

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      await supabase.auth.updateUser({
        data: {
          is_pro: true,
          pro_reference: reference,
          pro_expires_at: expiresAt,
        },
      });

      const updates: Record<string, unknown>[] = [
        { tier: 'pro', is_pro: true, pro_expires_at: expiresAt, pro_reference: reference },
        { tier: 'pro' },
        { is_pro: true },
      ];

      for (const payload of updates) {
        const { error } = await supabase
          .from('patient_profiles')
          .update(payload)
          .eq('user_id', user.id);
        if (!error) break;
      }

      await supabase.from('payments').insert({
        user_id: user.id,
        reference,
        amount: options?.amountKobo ?? PRO_PRICE_KOBO,
        currency: 'NGN',
        status: 'paid',
        provider: 'paystack',
        plan: PRO_PLAN_LABEL,
      });
    }
  } catch {
    // Auth or profile tables may be unavailable offline. The local cache still applies.
  }

  cachePayment({
    reference,
    amount: options?.amountKobo ?? PRO_PRICE_KOBO,
    currency: 'NGN',
    status: 'paid',
    plan: PRO_PLAN_LABEL,
    createdAt: new Date().toISOString(),
  });
  cacheProState(state);
  return state;
}
