import type { SupabaseClient } from '@supabase/supabase-js';

export type PatientProfile = { id: string };

/**
 * Resolve the patient_profiles row that medical_records.patient_id points to.
 * Creates one when the account does not have a profile yet.
 */
export async function ensurePatientProfile(
  supabase: SupabaseClient,
  user: { id: string; email?: string | null; user_metadata?: Record<string, unknown> }
): Promise<PatientProfile | null> {
  const { data: sessionData } = await supabase.auth.getSession();
  const sessionUser = sessionData.session?.user;
  const uid = sessionUser?.id || user.id;
  if (!uid) return null;

  const { data: existing } = await supabase
    .from('patient_profiles')
    .select('id')
    .eq('user_id', uid)
    .maybeSingle();

  if (existing?.id) return existing;

  const meta = (sessionUser?.user_metadata || user.user_metadata || {}) as Record<string, unknown>;
  const first = typeof meta.first_name === 'string' ? meta.first_name : '';
  const last = typeof meta.last_name === 'string' ? meta.last_name : '';
  const fullName = [first, last].filter(Boolean).join(' ') || sessionUser?.email?.split('@')[0] || 'Patient';

  const { data: created } = await supabase
    .from('patient_profiles')
    .insert({ user_id: uid, full_name: fullName })
    .select('id')
    .single();

  if (created?.id) return created;

  const { data: again } = await supabase
    .from('patient_profiles')
    .select('id')
    .eq('user_id', uid)
    .maybeSingle();

  return again?.id ? again : null;
}
