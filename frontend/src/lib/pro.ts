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

export function withTimeout<T>(promise: PromiseLike<T>, ms: number, message: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(message)), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      }
    );
  });
}

class ProVerificationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ProVerificationError';
  }
}

function isVerificationRejection(error: unknown) {
  if (error instanceof ProVerificationError) return true;
  const status = (error as { context?: { status?: number } } | null)?.context?.status;
  return status === 402;
}

export type ProActivation = {
  state: ProState;
  /** True when the Paystack verifier confirmed the payment on the server. */
  verified: boolean;
  /** Set when the payment is confirmed locally but server sync is still pending. */
  pendingMessage?: string;
};

const VERIFY_TIMEOUT_MS = 20000;

export async function activatePro(
  reference: string,
  options?: { amountKobo?: number; supabase?: SupabaseClient }
): Promise<ProActivation> {
  const supabase = options?.supabase || createClient();
  const expiresAt = expiryFromNow();
  const state: ProState = {
    active: true,
    reference,
    activatedAt: new Date().toISOString(),
    expiresAt,
    plan: PRO_PLAN_LABEL,
  };

  // The paystack-verify function checks the transaction with Paystack and
  // writes the entitlement, receipt, and auth metadata with the service role.
  // Those writes are not repeated here, so a slow network cannot stall the
  // upgrade screen with duplicate requests.
  let verified = false;
  let pendingMessage: string | undefined;

  try {
    const { data, error } = await withTimeout(
      supabase.functions.invoke('paystack-verify', { body: { reference } }),
      VERIFY_TIMEOUT_MS,
      'Payment verification timed out.'
    );

    if (error) throw error;

    const payload = data as { verified?: boolean; message?: string } | null;
    if (payload && payload.verified === false) {
      throw new ProVerificationError(
        payload.message || 'Payment could not be verified. Contact support with your receipt.'
      );
    }

    verified = payload?.verified === true;
  } catch (error) {
    if (isVerificationRejection(error)) {
      throw error instanceof Error
        ? error
        : new Error('Payment could not be verified. Contact support with your receipt.');
    }

    // Paystack already confirmed the charge if this callback is running. The
    // signed webhook still grants Pro on the server, so unlock locally now and
    // tell the patient the server copy is catching up.
    pendingMessage =
      'Payment received. Selorah Pro is unlocked on this device while Paystack finishes confirming it.';
    console.warn('Pro verification is pending:', error);
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

  return { state, verified, pendingMessage };
}
