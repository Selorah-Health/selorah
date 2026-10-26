import { dbDelete, dbGet, dbGetAll, dbPut } from './db';

export const RECORDS_EVENT = 'selorah:records-changed';

export type CachedRecord = {
  id: string;
  name: string;
  date: string;
  status: string;
  icon: string;
  document_url?: string | null;
  record_type?: string;
  created_at?: string;
  pending?: boolean;
  ocrText?: string;
  notes?: string;
  capturedVia?: 'camera' | 'upload' | 'manual';
  cachedAt?: string;
};

export type RecordMetadata = {
  ocrText?: string;
  notes?: string;
  capturedVia?: 'camera' | 'upload' | 'manual';
  ocrStatus?: 'pending' | 'done' | 'failed';
  savedAt?: string;
};

type MetaRow = RecordMetadata & { key: string };

export function notifyRecordsChanged() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(RECORDS_EVENT));
}

export async function cacheRecords(records: CachedRecord[]) {
  const cleaned = records.filter((record) => record?.id);
  await Promise.all(
    cleaned.map((record) =>
      dbPut('records', {
        ...record,
        cachedAt: new Date().toISOString(),
      })
    )
  );
}

export async function cacheRecord(record: CachedRecord) {
  if (!record?.id) return;
  await dbPut('records', { ...record, cachedAt: new Date().toISOString() });
  notifyRecordsChanged();
}

export async function readCachedRecords(): Promise<CachedRecord[]> {
  const records = await dbGetAll<CachedRecord>('records');
  return records.sort((a, b) => {
    const left = a.created_at || a.date || '';
    const right = b.created_at || b.date || '';
    return right.localeCompare(left);
  });
}

export async function readCachedRecord(id: string): Promise<CachedRecord | null> {
  return dbGet<CachedRecord>('records', id);
}

export async function removeCachedRecord(id: string) {
  await dbDelete('records', id);
  await dbDelete('meta', `record:${id}`);
  notifyRecordsChanged();
}

export async function saveRecordMetadata(id: string, metadata: RecordMetadata) {
  if (!id) return;
  await dbPut<MetaRow>('meta', {
    key: `record:${id}`,
    ...metadata,
    savedAt: new Date().toISOString(),
  });
}

export async function readRecordMetadata(id: string): Promise<RecordMetadata | null> {
  if (!id) return null;
  const row = await dbGet<MetaRow>('meta', `record:${id}`);
  if (!row) return null;
  const { key: _key, ...metadata } = row;
  return metadata;
}

export async function hydrateRecordMetadata<T extends CachedRecord>(record: T): Promise<T> {
  if (!record?.id) return record;
  const metadata = await readRecordMetadata(record.id);
  if (!metadata) return record;
  return {
    ...record,
    ocrText: record.ocrText || metadata.ocrText,
    notes: record.notes || metadata.notes,
    capturedVia: record.capturedVia || metadata.capturedVia,
  };
}

/** Data URLs make records readable even when storage is unavailable. */
export function textToDataUrl(text: string) {
  return `data:text/plain;charset=utf-8,${encodeURIComponent(text)}`;
}

export function dataUrlToText(url?: string | null) {
  if (!url) return '';
  if (!url.startsWith('data:text/plain')) return '';
  try {
    return decodeURIComponent((url.split(',')[1] || '').trim());
  } catch {
    return '';
  }
}

export async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const response = await fetch(dataUrl);
  return response.blob();
}
