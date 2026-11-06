import type { Session, SupabaseClient } from '@supabase/supabase-js';
import { recordLogin } from '../notifications';
import { getDeviceLabel } from '../qr';
import { homeForRole, normalizeRole, writeLocalSession } from './session';

export type PostAuthResult = {
  destination: string;
  session: Session | null;
  needsEmailConfirmation: boolean;
};

function splitName(user: Session['user']) {
  const metadata = user.user_metadata || {};
  const explicitFirst = String(metadata.first_name || '').trim();
  const explicitLast = String(metadata.last_name || '').trim();

  if (explicitFirst || explicitLast) {
    return { first: explicitFirst, last: explicitLast };
  }

  const full = String(metadata.full_name || metadata.name || '').trim();
  if (!full) {
    const emailName = String(user.email || '').split('@')[0] || '';
    return { first: emailName, last: '' };
  }

  const parts = full.split(/\s+/).filter(Boolean);
  return {
    first: parts[0] || '',
    last: parts.slice(1).join(' '),
  };
}

function proIsActive(profile: {
  is_pro?: boolean | null;
  tier?: string | null;
  pro_expires_at?: string | null;
} | null) {
  if (!profile) return false;
  if (profile.is_pro) return true;
  if (profile.tier && profile.tier !== 'free') return true;
  if (profile.pro_expires_at) {
    return new Date(profile.pro_expires_at).getTime() > Date.now();
  }
  return false;
}

/**
 * Reads the restored Supabase session, writes the local session cache, and
 * decides where the person should land. New patients go to onboarding, while
 * existing patients and staff go to their portal home.
 */
export async function resolvePostAuthDestination(
  supabase: SupabaseClient
): Promise<PostAuthResult> {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) throw error;
  if (!session?.user) {
    return { destination: '/login', session: null, needsEmailConfirmation: false };
  }

  const user = session.user;
  const needsEmailConfirmation = !user.email_confirmed_at && !user.confirmed_at;

  if (needsEmailConfirmation) {
    return { destination: '/auth/callback', session, needsEmailConfirmation: true };
  }

  const [{ data: userRow }, { data: patientProfile }] = await Promise.all([
    supabase
      .from('users')
      .select('role, email, org_id')
      .eq('id', user.id)
      .maybeSingle(),
    supabase
      .from('patient_profiles')
      .select('id, full_name, is_pro, tier, pro_expires_at')
      .eq('user_id', user.id)
      .maybeSingle(),
  ]);

  const role = normalizeRole(userRow?.role || user.user_metadata?.role || 'patient');
  const names = splitName(user);
  const profileName = String(patientProfile?.full_name || '').trim();
  const profileParts = profileName ? profileName.split(/\s+/).filter(Boolean) : [];
  const firstName = names.first || profileParts[0] || '';
  const lastName = names.last || profileParts.slice(1).join(' ') || '';

  writeLocalSession({
    id: user.id,
    email: user.email || '',
    first_name: firstName,
    last_name: lastName,
    role,
    org_id: (userRow as { org_id?: string } | null)?.org_id,
    is_pro: proIsActive(patientProfile),
    avatar_url: String(user.user_metadata?.avatar_url || ''),
  });

  try {
    await recordLogin(supabase, getDeviceLabel());
  } catch {
    // A login alert is helpful, but it must never block the callback.
  }

  if (role === 'patient' && !patientProfile?.id) {
    return { destination: '/onboarding', session, needsEmailConfirmation: false };
  }

  return {
    destination: homeForRole(role),
    session,
    needsEmailConfirmation: false,
  };
}
