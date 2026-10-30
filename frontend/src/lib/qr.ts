import type { SupabaseClient } from '@supabase/supabase-js';

const DEVICE_KEY = 'selorah_device_id';
const PERMANENT_TOKEN_KEY = 'selorah_permanent_token';

export function cachePermanentToken(token: string) {
  try {
    window.localStorage.setItem(PERMANENT_TOKEN_KEY, token);
  } catch {
    // Storage can be unavailable in private mode.
  }
}

export function readCachedPermanentToken() {
  try {
    return window.localStorage.getItem(PERMANENT_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function getDeviceId() {
  if (typeof window === 'undefined') return '';
  try {
    const existing = window.localStorage.getItem(DEVICE_KEY);
    if (existing) return existing;
    const id =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `dev_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    window.localStorage.setItem(DEVICE_KEY, id);
    return id;
  } catch {
    return '';
  }
}

export function getDeviceLabel() {
  if (typeof navigator === 'undefined') return 'Unknown device';
  const ua = navigator.userAgent;
  if (/iPhone/i.test(ua)) return 'iPhone';
  if (/iPad/i.test(ua)) return 'iPad';
  if (/Android/i.test(ua)) return 'Android device';
  if (/Macintosh/i.test(ua)) return 'Mac';
  if (/Windows/i.test(ua)) return 'Windows PC';
  if (/Linux/i.test(ua)) return 'Linux device';
  return 'Web browser';
}

export function sharedUrl(token: string) {
  const origin =
    typeof window === 'undefined' ? 'https://www.selorah.app' : window.location.origin;
  return `${origin}/shared/${token}`;
}

export async function fetchPermanentToken(supabase: SupabaseClient) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('patient_profiles')
    .select('id, permanent_qr_token, full_name, blood_group, genotype, allergies, emergency_contacts')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function ensurePermanentToken(supabase: SupabaseClient) {
  const profile = await fetchPermanentToken(supabase);
  if (!profile) return null;
  if (profile.permanent_qr_token) {
    cachePermanentToken(profile.permanent_qr_token);
    return profile;
  }

  const { data, error } = await supabase
    .from('patient_profiles')
    .update({ permanent_qr_token: crypto.randomUUID() })
    .eq('id', profile.id)
    .select('id, permanent_qr_token, full_name, blood_group, genotype, allergies, emergency_contacts')
    .single();

  if (error) throw error;
  if (data?.permanent_qr_token) cachePermanentToken(data.permanent_qr_token);
  return data;
}
