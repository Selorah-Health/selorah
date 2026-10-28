import type { SupabaseClient } from '@supabase/supabase-js';

export type MedicalRecord = {
  id: string;
  name: string;
  date: string;
  status: string;
  icon: string;
  document_url?: string | null;
  record_type?: string | null;
  created_at?: string | null;
  ocr_text?: string | null;
  notes?: string | null;
};

const OPTIONAL_RECORD_COLUMNS = new Set([
  'encrypted',
  'ocr_text',
  'notes',
  'captured_via',
  'record_date',
]);

function missingColumnName(message?: string | null) {
  if (!message) return null;
  const quoted =
    message.match(/column "([a-zA-Z0-9_]+)"/i) ||
    message.match(/Could not find the '([a-zA-Z0-9_]+)' column/i) ||
    message.match(/column '([a-zA-Z0-9_]+)'/i);
  return quoted?.[1]?.toLowerCase() || null;
}

/**
 * Insert a record while tolerating optional columns that an older Supabase
 * project may not have yet. Required columns are never removed.
 */
export async function insertMedicalRecord(
  supabase: SupabaseClient,
  row: Record<string, unknown>
): Promise<{ error: { message: string } | null }> {
  let payload = { ...row };
  let lastError: { message: string } | null = null;

  for (let attempt = 0; attempt < 10; attempt += 1) {
    const { error } = await supabase.from('medical_records').insert(payload);
    if (!error) return { error: null };

    lastError = error;
    const column = missingColumnName(error.message);

    if (column && OPTIONAL_RECORD_COLUMNS.has(column) && column in payload) {
      delete payload[column];
      continue;
    }

    const fallback = [...OPTIONAL_RECORD_COLUMNS].find((key) => key in payload);
    if (!fallback) break;
    delete payload[fallback];
  }

  return { error: lastError };
}

export const FILE_CATEGORY_TO_TYPE: Record<string, string> = {
  'Lab Results': 'Lab Results',
  Imaging: 'Imaging',
  Prescriptions: 'Prescription',
  'Visit Report': 'Visit Report',
  'Test Results': 'Test Results',
  'Other Clinical': 'Clinical Document',
};

export const RECORD_CATEGORIES = Object.keys(FILE_CATEGORY_TO_TYPE);

const PROFILE_TYPES = new Set([
  'vital',
  'allergy',
  'history',
  'emergency contact',
  'note',
]);

const PROFILE_TITLES = new Set([
  'height',
  'weight',
  'blood group',
  'genotype',
  'allergies',
  'family history',
  'medication history',
  'emergency contact',
]);

export function isProfileField(record: { record_type?: string | null; title?: string | null }) {
  const type = (record.record_type || '').toLowerCase();
  const title = (record.title || '').toLowerCase();
  return PROFILE_TYPES.has(type) || PROFILE_TITLES.has(title);
}

export function formatRecordDate(value?: string | null) {
  if (!value) return 'Date not recorded';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Date not recorded';
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export async function getPatientProfileId(
  supabase: SupabaseClient,
  userId: string
): Promise<string | null> {
  const { data } = await supabase
    .from('patient_profiles')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();

  return data?.id ?? null;
}

function metaString(meta: Record<string, unknown> | undefined, key: string) {
  const value = meta?.[key];
  return typeof value === 'string' ? value : '';
}

export async function ensurePatientProfile(
  supabase: SupabaseClient,
  user: { id: string; email?: string | null; user_metadata?: Record<string, unknown> }
): Promise<{ id: string } | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user?.id) return null;

  const existing = await getPatientProfileId(supabase, session.user.id);
  if (existing) return { id: existing };

  const first =
    metaString(user.user_metadata, 'first_name') ||
    metaString(session.user.user_metadata as Record<string, unknown> | undefined, 'first_name');
  const last =
    metaString(user.user_metadata, 'last_name') ||
    metaString(session.user.user_metadata as Record<string, unknown> | undefined, 'last_name');
  const fullName =
    [first, last].filter(Boolean).join(' ') ||
    session.user.email?.split('@')[0] ||
    'Patient';

  const payloads: Record<string, unknown>[] = [
    { user_id: session.user.id, full_name: fullName },
    { user_id: session.user.id },
  ];

  for (const payload of payloads) {
    const { data } = await supabase
      .from('patient_profiles')
      .insert(payload)
      .select('id')
      .maybeSingle();
    if (data?.id) return { id: data.id };
  }

  // A unique constraint may have raced with another request.
  const again = await getPatientProfileId(supabase, session.user.id);
  return again ? { id: again } : null;
}

export async function fetchMedicalRecords(
  supabase: SupabaseClient
): Promise<MedicalRecord[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const patientId = await getPatientProfileId(supabase, user.id);
  if (!patientId) return [];

  const { data, error } = await supabase
    .from('medical_records')
    .select('*')
    .eq('patient_id', patientId)
    .order('created_at', { ascending: false });

  if (error || !data) return [];

  return data
    .filter((record: Record<string, unknown>) => !isProfileField(record))
    .map((record: Record<string, unknown>) => ({
      id: String(record.id),
      name: String(record.title || record.name || 'Clinical document'),
      date: formatRecordDate(
        (record.created_at as string | null) || (record.date as string | null)
      ),
      status:
        record.status === 'active' || record.status === 'Active'
          ? 'Encrypted'
          : String(record.status || 'Private'),
      icon: '/assets/total-records-card-icon.png',
      document_url: (record.file_url as string) || (record.document_url as string) || null,
      record_type: (record.record_type as string) || null,
      created_at: (record.created_at as string) || null,
      ocr_text: (record.ocr_text as string) || null,
      notes: (record.notes as string) || null,
    }));
}
