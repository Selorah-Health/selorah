import type { SupabaseClient } from '@supabase/supabase-js';
import { dbPut } from './db';
import {
  getQueuedActions,
  removeQueuedAction,
  type QueuedAction,
} from './queue';
import {
  cacheRecord,
  notifyRecordsChanged,
  removeCachedRecord,
  saveRecordMetadata,
  textToDataUrl,
} from './records';
import { ensurePatientProfile } from '../records/patientProfile';
import { insertMedicalRecord, uploadRecordFile } from '../records/storage';

export type SyncResult = { synced: number; remaining: number };

function isNetworkError(message?: string) {
  return /Failed to fetch|NetworkError|Load failed|fetch failed|network request failed|timeout/i.test(
    message || ''
  );
}

async function syncRecordCreate(
  supabase: SupabaseClient,
  action: Extract<QueuedAction, { type: 'record.create' }>
) {
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) return { ok: false, permanent: false };

  const profile = await ensurePatientProfile(supabase, user);
  if (!profile) return { ok: false, permanent: false };

  let fileUrl = action.payload.fileUrl || textToDataUrl(action.payload.notes || '');

  if (action.payload.fileUrl?.startsWith('data:') && action.payload.fileUrl.length > 20_000) {
    const uploaded = await uploadRecordFile(supabase, user.id, {
      dataUrl: action.payload.fileUrl,
      fileName: action.payload.fileName || `${action.payload.title}.jpg`,
      mimeType: action.payload.mimeType,
    });
    fileUrl = uploaded.fileUrl;
  }

  const { data, error } = await insertMedicalRecord(supabase, {
    patient_id: profile.id,
    title: action.payload.title,
    record_type: action.payload.recordType,
    file_url: fileUrl,
    status: 'active',
    encrypted: true,
    ocr_text: action.payload.ocrText || null,
    notes: action.payload.notes || null,
    captured_via: action.payload.capturedVia || null,
  });

  if (error) {
    const message = (error as { message?: string }).message;
    return { ok: false, permanent: !isNetworkError(message) };
  }

  const saved = data as Record<string, unknown> | null;
  if (saved?.id) {
    await saveRecordMetadata(String(saved.id), {
      ocrText: action.payload.ocrText,
      notes: action.payload.notes,
      capturedVia: action.payload.capturedVia,
      ocrStatus: action.payload.ocrText ? 'done' : 'pending',
    });
    await cacheRecord({
      id: String(saved.id),
      name: String(saved.title || action.payload.title),
      date: saved.created_at
        ? new Date(String(saved.created_at)).toLocaleDateString()
        : new Date().toLocaleDateString(),
      status: 'Encrypted',
      icon: '/assets/total-records-card-icon.png',
      document_url: typeof saved.file_url === 'string' ? saved.file_url : fileUrl,
      record_type: String(saved.record_type || action.payload.recordType),
      created_at: saved.created_at ? String(saved.created_at) : new Date().toISOString(),
      ocrText: action.payload.ocrText,
      notes: action.payload.notes,
      capturedVia: action.payload.capturedVia,
    });
  }

  await removeCachedRecord(action.payload.localId);
  return { ok: true, permanent: false };
}

async function runAction(supabase: SupabaseClient, action: QueuedAction) {
  if (action.type === 'record.create') {
    return syncRecordCreate(supabase, action);
  }

  if (action.type === 'link.create') {
    const row: Record<string, unknown> = {
      token: action.payload.token,
      user_id: action.payload.userId,
      expires_at: action.payload.expiresAt,
      is_active: true,
    };
    if (action.payload.recordId) row.record_id = action.payload.recordId;

    const { error } = await supabase.from('shared_links').insert(row);
    if (!error) return { ok: true, permanent: false };

    if (error.code === '23505') return { ok: true, permanent: false };
    const message = (error as { message?: string }).message || '';

    if (/record_id/i.test(message) && row.record_id) {
      delete row.record_id;
      const { error: retryError } = await supabase.from('shared_links').insert(row);
      if (!retryError || retryError.code === '23505') {
        return { ok: true, permanent: false };
      }
      return {
        ok: false,
        permanent: !isNetworkError(retryError.message),
      };
    }

    return { ok: false, permanent: !isNetworkError(message) };
  }

  if (action.type === 'link.revoke') {
    const { error } = await supabase
      .from('shared_links')
      .update({ is_active: false })
      .eq('token', action.payload.token);
    if (!error) return { ok: true, permanent: false };
    const message = (error as { message?: string }).message;
    return { ok: false, permanent: !isNetworkError(message) };
  }

  if (action.type === 'waitlist.join') {
    const { error } = await supabase.from('waitlist').insert({
      email: action.payload.email,
      full_name: action.payload.fullName,
      role: action.payload.role,
      source: action.payload.source,
    });
    if (!error) return { ok: true, permanent: false };

    if (/column .* does not exist/i.test(error.message)) {
      const { error: retryError } = await supabase.from('waitlist').insert({
        email: action.payload.email,
        full_name: action.payload.fullName,
      });
      if (!retryError) return { ok: true, permanent: false };
      if (retryError.code === '23505') return { ok: true, permanent: false };
      return {
        ok: false,
        permanent: !isNetworkError(retryError.message),
      };
    }

    if (error.code === '23505') return { ok: true, permanent: false };
    return { ok: false, permanent: !isNetworkError(error.message) };
  }

  return { ok: false, permanent: true };
}

export async function flushQueue(supabase: SupabaseClient): Promise<SyncResult> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    const remaining = (await getQueuedActions()).length;
    return { synced: 0, remaining };
  }

  const actions = await getQueuedActions();
  let synced = 0;

  for (const action of actions) {
    const result = await runAction(supabase, action);

    if (result.ok) {
      await removeQueuedAction(action.id);
      synced += 1;
      continue;
    }

    if (result.permanent) {
      const attempts = (action.attempts || 0) + 1;
      if (attempts >= 5) {
        await removeQueuedAction(action.id);
      } else {
        await dbPut('queue', { ...action, attempts });
      }
      continue;
    }

    // Network still unavailable. Keep the rest of the queue untouched.
    break;
  }

  if (synced > 0) notifyRecordsChanged();

  const remaining = (await getQueuedActions()).length;
  return { synced, remaining };
}
