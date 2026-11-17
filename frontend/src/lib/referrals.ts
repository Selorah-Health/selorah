import type { SupabaseClient } from '@supabase/supabase-js';

export const REFERRAL_STORAGE_KEY = 'selorah_referral_code';

export type ReferralProfile = {
  id: string;
  username: string | null;
  firstName: string;
  fullName: string;
};

export type ReferralRow = {
  id: string;
  referee_username: string | null;
  referee_name: string;
  status: 'pending' | 'qualified' | 'rewarded' | 'cancelled' | string;
  created_at: string;
  qualified_at: string | null;
  rewarded_at: string | null;
};

export type ReferralActionResult = {
  ok: boolean;
  message?: string;
  duplicate?: boolean;
  username?: string;
};

export function readPendingReferralCode(): string {
  if (typeof window === 'undefined') return '';
  return window.localStorage.getItem(REFERRAL_STORAGE_KEY)?.trim().toLowerCase() || '';
}

export function clearPendingReferralCode() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(REFERRAL_STORAGE_KEY);
}

export function referralLink(username: string) {
  const origin = typeof window === 'undefined' ? 'https://www.selorah.app' : window.location.origin;
  return `${origin}/signup?ref=${encodeURIComponent(username)}`;
}

function asAction(data: unknown): ReferralActionResult {
  if (!data || typeof data !== 'object') return { ok: false };
  return data as ReferralActionResult;
}

/**
 * Claim a referral that was saved at signup. Safe to call on every dashboard
 * load: the database rejects duplicates, and the code is cleared once claimed.
 */
export async function claimPendingReferral(
  supabase: SupabaseClient
): Promise<ReferralActionResult | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const metadataCode =
    typeof user.user_metadata?.referral_code === 'string'
      ? user.user_metadata.referral_code.trim().toLowerCase()
      : '';
  const code = readPendingReferralCode() || metadataCode;
  if (!code) return null;

  const { data, error } = await supabase.rpc('claim_referral', { p_code: code });
  if (error) {
    const missingFunction =
      error.code === 'PGRST202' || /could not find the function/i.test(error.message);
    if (missingFunction) return { ok: false, message: 'Referrals are not live yet.' };
    return { ok: false, message: error.message };
  }

  const result = asAction(data);
  if (result.ok || result.duplicate) clearPendingReferralCode();
  return result;
}

export async function fetchReferralProfile(
  supabase: SupabaseClient
): Promise<ReferralProfile | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // public.profiles is a read-only compatibility view, so the username lives in
  // public.usernames. The username query can fail on projects that have not run
  // the referral migration yet; the profile still loads in that case.
  const [{ data: profile, error: profileError }, usernameResult] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
    supabase.from('usernames').select('username').eq('user_id', user.id).maybeSingle(),
  ]);

  if (profileError) return null;

  const row = (profile || {}) as Record<string, unknown>;
  const usernameRow = (usernameResult.data || {}) as Record<string, unknown>;
  return {
    id: user.id,
    username: typeof usernameRow.username === 'string' ? usernameRow.username : null,
    firstName: typeof row.first_name === 'string' ? row.first_name : '',
    fullName: typeof row.full_name === 'string' ? row.full_name : '',
  };
}

export async function fetchMyReferrals(supabase: SupabaseClient): Promise<ReferralRow[]> {
  const { data, error } = await supabase.rpc('my_referrals');
  if (error) {
    const missingFunction =
      error.code === 'PGRST202' || /could not find the function/i.test(error.message);
    if (missingFunction) return [];
    throw error;
  }
  return (data || []) as ReferralRow[];
}

export async function setReferralCode(
  supabase: SupabaseClient,
  username: string
): Promise<ReferralActionResult> {
  const cleaned = username.trim().toLowerCase();
  if (!/^[a-z0-9][a-z0-9_-]{2,19}$/.test(cleaned)) {
    return {
      ok: false,
      message: 'Use 3 to 20 lowercase letters, numbers, hyphens, or underscores.',
    };
  }

  const { data, error } = await supabase.rpc('set_referral_code', {
    p_username: cleaned,
  });
  if (error) {
    const missingFunction =
      error.code === 'PGRST202' || /could not find the function/i.test(error.message);
    if (missingFunction) {
      return { ok: false, message: 'Referrals are not live yet. Ask an admin to run the migration.' };
    }
    return { ok: false, message: error.message };
  }

  return asAction(data);
}

export function suggestUsername(firstName: string, fullName: string) {
  const source = (firstName || fullName || '').trim().toLowerCase();
  const base = source
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 13);
  return base || 'selorah';
}
