import { dbDelete, dbGetAll, dbPut } from './db';

export const QUEUE_EVENT = 'selorah:queue-changed';

export type RecordCreatePayload = {
  patientId?: string;
  title: string;
  recordType: string;
  fileUrl?: string;
  fileName?: string;
  mimeType?: string;
  ocrText?: string;
  notes?: string;
  capturedVia?: 'camera' | 'upload' | 'manual';
  localId: string;
  createdAt: string;
};

export type QueuedAction =
  | {
      id: string;
      type: 'record.create';
      createdAt: string;
      attempts: number;
      payload: RecordCreatePayload;
    }
  | {
      id: string;
      type: 'link.create';
      createdAt: string;
      attempts: number;
      payload: {
        token: string;
        userId: string;
        expiresAt: string;
        recordId?: string | null;
      };
    }
  | {
      id: string;
      type: 'link.revoke';
      createdAt: string;
      attempts: number;
      payload: { token: string };
    }
  | {
      id: string;
      type: 'waitlist.join';
      createdAt: string;
      attempts: number;
      payload: { email: string; fullName: string; role: string; source: string };
    };

export function notifyQueueChanged() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(QUEUE_EVENT));
}

export function createQueueId(prefix = 'q') {
  const random =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return `${prefix}-${random}`;
}

export async function enqueueAction(
  action: Omit<QueuedAction, 'id' | 'createdAt' | 'attempts'>
): Promise<QueuedAction> {
  const queued = {
    ...action,
    id: createQueueId('queue'),
    createdAt: new Date().toISOString(),
    attempts: 0,
  } as QueuedAction;

  await dbPut('queue', queued);
  notifyQueueChanged();
  return queued;
}

export async function getQueuedActions(): Promise<QueuedAction[]> {
  const actions = await dbGetAll<QueuedAction>('queue');
  return actions.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export async function removeQueuedAction(id: string) {
  await dbDelete('queue', id);
  notifyQueueChanged();
}

export async function countQueuedActions(): Promise<number> {
  const actions = await dbGetAll<QueuedAction>('queue');
  return actions.length;
}
