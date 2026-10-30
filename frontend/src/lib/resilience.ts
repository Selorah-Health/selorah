import type { SupabaseClient } from '@supabase/supabase-js';
import type { MedicalRecord } from './records';

const encoder = new TextEncoder();

function toHex(buffer: ArrayBuffer) {
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

export async function sha256Hex(value: string) {
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(value));
  return toHex(digest);
}

function toBase64(bytes: Uint8Array) {
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

function fromBase64(value: string) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

async function deriveKey(passphrase: string, salt: Uint8Array, iterations: number) {
  const material = await crypto.subtle.importKey(
    'raw',
    encoder.encode(passphrase),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as unknown as BufferSource,
      iterations,
      hash: 'SHA-256',
    },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export type EncryptedVault = {
  ciphertext: string;
  iv: string;
  salt: string;
  iterations: number;
};

export async function encryptVault(passphrase: string, payload: unknown): Promise<EncryptedVault> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const iterations = 210000;
  const key = await deriveKey(passphrase, salt, iterations);
  const cipher = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv as unknown as BufferSource },
    key,
    encoder.encode(JSON.stringify(payload))
  );

  return {
    ciphertext: toBase64(new Uint8Array(cipher)),
    iv: toBase64(iv),
    salt: toBase64(salt),
    iterations,
  };
}

export async function decryptVault<T = unknown>(
  passphrase: string,
  vault: EncryptedVault
): Promise<T> {
  const salt = fromBase64(vault.salt);
  const iv = fromBase64(vault.iv);
  const key = await deriveKey(passphrase, salt, vault.iterations || 210000);
  const plain = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv as unknown as BufferSource },
    key,
    fromBase64(vault.ciphertext) as unknown as BufferSource
  );

  return JSON.parse(new TextDecoder().decode(plain)) as T;
}

export type VaultSnapshot = {
  version: 1;
  createdAt: string;
  patient: Record<string, unknown>;
  records: Array<Record<string, unknown>>;
};

export function buildSnapshot(
  patient: Record<string, unknown>,
  records: MedicalRecord[]
): VaultSnapshot {
  return {
    version: 1,
    createdAt: new Date().toISOString(),
    patient,
    records: records.map((record) => ({
      id: record.id,
      name: record.name,
      date: record.date,
      status: record.status,
      record_type: record.record_type || null,
      notes: record.notes || null,
      ocr_text: record.ocr_text || null,
      document_url: record.document_url || null,
    })),
  };
}

export async function saveEncryptedVault(
  supabase: SupabaseClient,
  patientId: string,
  passphrase: string,
  snapshot: VaultSnapshot
) {
  const vault = await encryptVault(passphrase, snapshot);
  const { error } = await supabase.from('emergency_vaults').upsert(
    {
      patient_id: patientId,
      ciphertext: vault.ciphertext,
      iv: vault.iv,
      salt: vault.salt,
      iterations: vault.iterations,
      summary: `${snapshot.records.length} records backed up on ${new Date(
        snapshot.createdAt
      ).toLocaleDateString()}`,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'patient_id' }
  );

  if (error) throw error;
  return vault;
}

export async function loadEncryptedVault(supabase: SupabaseClient, patientId: string) {
  const { data, error } = await supabase
    .from('emergency_vaults')
    .select('ciphertext, iv, salt, iterations, summary, updated_at')
    .eq('patient_id', patientId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function anchorRecords(
  supabase: SupabaseClient,
  patientId: string,
  records: MedicalRecord[]
) {
  if (!records.length) return 0;

  const rows = await Promise.all(
    records.map(async (record) => ({
      patient_id: patientId,
      record_id: record.id,
      content_hash: await sha256Hex(
        JSON.stringify({
          id: record.id,
          name: record.name,
          date: record.date,
          record_type: record.record_type || null,
          notes: record.notes || null,
          ocr_text: record.ocr_text || null,
        })
      ),
      algorithm: 'sha256',
      anchor_network: 'pending',
      metadata: { source: 'selorah-client', anchored_by: 'patient' },
    }))
  );

  const { error } = await supabase
    .from('record_anchors')
    .upsert(rows, { onConflict: 'record_id' });

  if (error) throw error;
  return rows.length;
}

export async function fetchAnchors(supabase: SupabaseClient, patientId: string) {
  const { data, error } = await supabase
    .from('record_anchors')
    .select('id, record_id, content_hash, algorithm, anchor_network, anchor_tx, anchored_at, created_at')
    .eq('patient_id', patientId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export function downloadJson(filename: string, payload: unknown) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
