import type { SupabaseClient } from '@supabase/supabase-js';
import { dataUrlToBlob } from '../offline/records';

export type RecordRowInput = {
  patient_id: string;
  title: string;
  record_type: string;
  file_url?: string | null;
  status?: string;
  encrypted?: boolean;
  ocr_text?: string | null;
  notes?: string | null;
  captured_via?: string | null;
};

function isMissingColumn(message?: string) {
  return /column .* does not exist|schema cache|Could not find the .* column/i.test(message || '');
}

/**
 * Insert a medical record and gracefully drop optional columns that have not
 * been added to older Supabase projects yet.
 */
export async function insertMedicalRecord(
  supabase: SupabaseClient,
  row: RecordRowInput
) {
  const optional = ['ocr_text', 'notes', 'captured_via'];
  let payload: Record<string, unknown> = { ...row };
  let lastError: unknown = null;

  for (let attempt = 0; attempt <= optional.length; attempt += 1) {
    const { data, error } = await supabase
      .from('medical_records')
      .insert(payload)
      .select('*')
      .single();

    if (!error) return { data, error: null };

    lastError = error;
    const missing = optional.find((key) => key in payload && isMissingColumn(error.message));
    if (!missing) break;
    const next = { ...payload };
    delete next[missing];
    payload = next;
  }

  return { data: null, error: lastError };
}

/** Upload a blob or data URL to the private records bucket. */
export async function uploadRecordFile(
  supabase: SupabaseClient,
  userId: string,
  input: { dataUrl: string; fileName: string; mimeType?: string }
): Promise<{ fileUrl: string; uploaded: boolean }> {
  try {
    const blob = await dataUrlToBlob(input.dataUrl);
    const safeName = (input.fileName || 'document')
      .replace(/[^\w.\-]+/g, '-')
      .replace(/-+/g, '-');
    const path = `${userId}/${Date.now()}_${safeName || 'document'}`;

    const { error } = await supabase.storage.from('records').upload(path, blob, {
      contentType: input.mimeType || blob.type || 'application/octet-stream',
      upsert: false,
    });

    if (!error) {
      const { data } = supabase.storage.from('records').getPublicUrl(path);
      if (data?.publicUrl) return { fileUrl: data.publicUrl, uploaded: true };
    }
  } catch {
    // Fall through to the inline data URL.
  }

  return { fileUrl: input.dataUrl, uploaded: false };
}

export function sanitizeFileName(name: string) {
  return name.replace(/[^\w.\-]+/g, '-').replace(/-+/g, '-');
}
