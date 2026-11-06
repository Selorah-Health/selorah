import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from './supabase/client';

export const PRO_PLAN_LABEL = 'Selorah Pro';

export type ProPlanId = 'monthly' | 'annual';

export type ProPlan = {
  id: ProPlanId;
  label: string;
  priceNaira: number;
  priceKobo: number;
  months: number;
  durationLabel: string;
  billingLabel: string;
  badge?: string;
};

export const PRO_PLANS: Record<ProPlanId, ProPlan> = {
  monthly: {
    id: 'monthly',
    label: 'Monthly',
    priceNaira: 2000,
    priceKobo: 200000,
    months: 1,
    durationLabel: '30 days',
    billingLabel: 'per month',
  },
  annual: {
    id: 'annual',
    label: 'Annual',
    priceNaira: 20000,
    priceKobo: 2000000,
    months: 12,
    durationLabel: '12 months',
    billingLabel: 'per year',
    badge: 'Save ₦4,000',
  },
};

export const DEFAULT_PRO_PLAN: ProPlanId = 'annual';

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
const PENDING_PAYMENT_KEY = 'selorah_pending_payment';

export type ProState = {
  active: boolean;
  reference?: string;
  activatedAt?: string;
  expiresAt?: string;
  plan?: string;
  planId?: ProPlanId;
  amountKobo?: number;
};

export type PaymentRecord = {
  reference: string;
  amount: number;
  currency: string;
  status: 'paid' | 'pending' | 'failed';
  plan: string;
  createdAt: string;
};

export type PendingPayment = {
  reference: string;
  planId: ProPlanId;
  amountKobo: number;
  createdAt: string;
  email?: string;
};

export function readPendingPayment(): PendingPayment | null {
  try {
    const raw = localStorage.getItem(PENDING_PAYMENT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PendingPayment;
    if (!parsed?.reference) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function savePendingPayment(payment: PendingPayment) {
  try {
    localStorage.setItem(PENDING_PAYMENT_KEY, JSON.stringify(payment));
  } catch {
    // Storage can be unavailable in private mode.
  }
}

export function clearPendingPayment(reference?: string) {
  try {
    const current = readPendingPayment();
    if (reference && current && current.reference !== reference) return;
    localStorage.removeItem(PENDING_PAYMENT_KEY);
  } catch {
    // Ignore storage failures.
  }
}

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

function expiryFromMonths(months: number) {
  const current = readProState();
  const currentExpiry =
    current.active && current.expiresAt ? new Date(current.expiresAt) : null;
  const date =
    currentExpiry &&
    !Number.isNaN(currentExpiry.getTime()) &&
    currentExpiry.getTime() > Date.now()
      ? currentExpiry
      : new Date();
  date.setMonth(date.getMonth() + months);
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

type ProProfileRow = {
  tier?: string | null;
  is_pro?: boolean | null;
  pro_reference?: string | null;
  pro_expires_at?: string | null;
};

/**
 * Reconcile the device cache with the server. patient_profiles is the source of
 * truth for Pro, so the dashboard does not depend on auth metadata being fresh.
 */
export async function refreshProFromProfile(
  supabase: SupabaseClient,
  options?: { clearInactive?: boolean }
): Promise<ProState | null> {
  try {
    const { data: authData } = await withTimeout(
      supabase.auth.getUser(),
      8000,
      'Session lookup timed out.'
    );
    const user = authData?.user;
    if (!user) return null;

    const { data, error } = await withTimeout(
      supabase
        .from('patient_profiles')
        .select('tier, is_pro, pro_reference, pro_expires_at')
        .eq('user_id', user.id)
        .maybeSingle(),
      10000,
      'Pro lookup timed out.'
    );
    if (error) return null;

    const row = data as ProProfileRow | null;
    if (!row) return null;

    const expiry = row.pro_expires_at ? new Date(row.pro_expires_at) : null;
    const active = Boolean(row.is_pro) && (!expiry || expiry.getTime() > Date.now());

    if (active) {
      const state: ProState = {
        active: true,
        reference: row.pro_reference || undefined,
        expiresAt: row.pro_expires_at || undefined,
        plan: PRO_PLAN_LABEL,
        activatedAt: new Date().toISOString(),
      };
      cacheProState(state);
      return state;
    }

    // Keep a local unlock while a payment is still settling. The pending
    // reference is the guard, so a brief server lag cannot revoke Pro.
    if (options?.clearInactive === false || readPendingPayment()) {
      return { active: false };
    }

    const inactive: ProState = { active: false };
    cacheProState(inactive);
    return inactive;
  } catch {
    return null;
  }
}

export type ProActivation = {
  state: ProState;
  /** True when the Paystack verifier confirmed the payment on the server. */
  verified: boolean;
  /** Set when the payment is confirmed locally but server sync is still pending. */
  pendingMessage?: string;
};

const VERIFY_TIMEOUT_MS = 20000;

type VerifyPayload = {
  verified?: boolean;
  pending?: boolean;
  message?: string;
  reference?: string;
  plan?: string;
  months?: number;
  amount?: number;
  expiresAt?: string;
};

export async function activatePro(
  reference: string,
  options?: { planId?: ProPlanId; amountKobo?: number; supabase?: SupabaseClient }
): Promise<ProActivation> {
  const supabase = options?.supabase || createClient();
  const planId = options?.planId || DEFAULT_PRO_PLAN;
  const plan = PRO_PLANS[planId];
  const expiresAt = expiryFromMonths(plan.months);
  const planLabel = `${PRO_PLAN_LABEL} ${plan.label}`;
  const state: ProState = {
    active: true,
    reference,
    activatedAt: new Date().toISOString(),
    expiresAt,
    plan: planLabel,
    planId,
    amountKobo: options?.amountKobo ?? plan.priceKobo,
  };

  // The paystack-verify function checks the transaction with Paystack and
  // writes the entitlement, receipt, and auth metadata with the service role.
  // Those writes are not repeated here, so a slow network cannot stall the
  // upgrade screen with duplicate requests.
  let verified = false;
  let pendingMessage: string | undefined;
  let serverExpiresAt: string | undefined;

  try {
    const { data, error } = await withTimeout(
      supabase.functions.invoke('paystack-verify', { body: { reference } }),
      VERIFY_TIMEOUT_MS,
      'Payment verification timed out.'
    );

    if (error) throw error;

    const payload = data as VerifyPayload | null;
    if (payload?.verified === false && payload.pending !== true) {
      throw new ProVerificationError(
        payload.message || 'Payment could not be verified. Contact support with your receipt.'
      );
    }

    if (payload?.pending) {
      pendingMessage =
        payload.message ||
        'Payment received. Paystack is still confirming it, and Pro will stay unlocked while that finishes.';
      serverExpiresAt = payload.expiresAt;
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

  const serverState = await refreshProFromProfile(supabase, { clearInactive: false });
  const finalState: ProState = serverState?.active
    ? {
        ...state,
        ...serverState,
        reference: serverState.reference || reference,
        planId,
        amountKobo: state.amountKobo,
      }
    : { ...state, expiresAt: serverExpiresAt || state.expiresAt };

  cachePayment({
    reference,
    amount: options?.amountKobo ?? plan.priceKobo,
    currency: 'NGN',
    status: pendingMessage && !verified ? 'pending' : 'paid',
    plan: planLabel,
    createdAt: new Date().toISOString(),
  });
  cacheProState(finalState);
  if (verified) clearPendingPayment(reference);

  return { state: finalState, verified, pendingMessage };
}

/**
 * Verify a reference the patient copied from a Paystack receipt. This is the
 * recovery path when the checkout callback never reached the app, for example
 * after a bank transfer opened a different banking app.
 */
export async function verifyProReference(
  reference: string,
  options?: { supabase?: SupabaseClient; localUnlockOnPending?: boolean }
): Promise<ProActivation> {
  const supabase = options?.supabase || createClient();
  const clean = reference.trim();
  if (!clean) {
    throw new Error('Enter the payment reference from your Paystack receipt.');
  }

  let payload: VerifyPayload | null = null;
  try {
    const { data, error } = await withTimeout(
      supabase.functions.invoke('paystack-verify', { body: { reference: clean } }),
      VERIFY_TIMEOUT_MS,
      'Payment verification timed out.'
    );
    if (error) throw error;
    payload = data as VerifyPayload | null;
  } catch (error) {
    if (isVerificationRejection(error)) {
      throw error instanceof Error
        ? error
        : new Error('Payment could not be verified. Check the reference and try again.');
    }
    throw new Error(
      'Could not reach the payment verifier. Check your connection and try the reference again.'
    );
  }

  if (payload?.verified === false && payload.pending !== true) {
    throw new Error(
      payload.message || 'Payment could not be verified. Check the reference and try again.'
    );
  }

  const serverState = await refreshProFromProfile(supabase, { clearInactive: false });
  if (serverState?.active) {
    clearPendingPayment(clean);
    return { state: serverState, verified: true };
  }

  const pendingMessage = payload?.pending
    ? payload.message || 'Payment is still being confirmed. Check again in a moment.'
    : undefined;

  if (payload?.verified === true) {
    // The server confirmed the charge. If the profile read lagged, keep a local
    // unlock so the patient is not stuck on the upgrade screen.
    const state: ProState = {
      active: true,
      reference: clean,
      activatedAt: new Date().toISOString(),
      expiresAt: payload.expiresAt,
      plan: payload.plan || PRO_PLAN_LABEL,
      amountKobo: payload.amount,
    };
    cacheProState(state);
    clearPendingPayment(clean);
    return { state, verified: true };
  }

  if (pendingMessage && options?.localUnlockOnPending) {
    const state: ProState = {
      active: true,
      reference: clean,
      activatedAt: new Date().toISOString(),
      plan: PRO_PLAN_LABEL,
    };
    cacheProState(state);
    return { state, verified: false, pendingMessage };
  }

  return { state: readProState(), verified: false, pendingMessage };
}

/**
 * Recover a paid upgrade when the checkout callback never returned a
 * reference. The server searches recent Paystack charges for the signed-in
 * email and applies the newest successful plan payment.
 */
export async function reconcileProPayments(options?: {
  supabase?: SupabaseClient;
}): Promise<ProActivation> {
  const supabase = options?.supabase || createClient();

  let payload: VerifyPayload | null = null;
  try {
    const { data, error } = await withTimeout(
      supabase.functions.invoke('paystack-verify', { body: { reconcile: true } }),
      VERIFY_TIMEOUT_MS,
      'Payment lookup timed out.'
    );
    if (error) throw error;
    payload = data as VerifyPayload | null;
  } catch (error) {
    if (isVerificationRejection(error)) {
      throw error instanceof Error
        ? error
        : new Error('Payment could not be matched to this account.');
    }
    throw new Error(
      'Could not reach the payment verifier. Check your connection and try again.'
    );
  }

  if (payload?.verified === false && payload.pending !== true) {
    throw new Error(
      payload.message || 'No successful payment was found for this account.'
    );
  }

  const serverState = await refreshProFromProfile(supabase, { clearInactive: false });
  if (serverState?.active) {
    if (payload?.reference) clearPendingPayment(payload.reference);
    return { state: serverState, verified: true };
  }

  if (payload?.verified === true) {
    const reference = payload.reference || readPendingPayment()?.reference;
    const state: ProState = {
      active: true,
      reference,
      activatedAt: new Date().toISOString(),
      expiresAt: payload.expiresAt,
      plan: payload.plan || PRO_PLAN_LABEL,
      amountKobo: payload.amount,
    };
    cacheProState(state);
    if (reference) clearPendingPayment(reference);
    return { state, verified: true };
  }

  return {
    state: readProState(),
    verified: false,
    pendingMessage: payload?.pending
      ? payload.message || 'Payment is still being confirmed. Check again in a moment.'
      : undefined,
  };
}
