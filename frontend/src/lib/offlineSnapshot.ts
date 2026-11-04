import { readLocalSession } from './auth/session';

const SNAPSHOT_PREFIX = 'selorah_snapshot_v1';

type Snapshot<T> = {
  savedAt: string;
  value: T;
};

function snapshotKey(name: string, userId: string) {
  return `${SNAPSHOT_PREFIX}:${name}:${userId}`;
}

export function currentSnapshotUser() {
  return readLocalSession()?.id || '';
}

export function readSnapshot<T>(name: string, userId = currentSnapshotUser()): T | null {
  if (!userId) return null;
  try {
    const raw = localStorage.getItem(snapshotKey(name, userId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Snapshot<T>;
    return parsed?.value ?? null;
  } catch {
    return null;
  }
}

export function writeSnapshot<T>(name: string, value: T, userId = currentSnapshotUser()) {
  if (!userId) return;
  try {
    localStorage.setItem(
      snapshotKey(name, userId),
      JSON.stringify({ savedAt: new Date().toISOString(), value })
    );
  } catch {
    // Storage can be full or unavailable in private mode.
  }
}

export function snapshotSavedAt(name: string, userId = currentSnapshotUser()) {
  if (!userId) return null;
  try {
    const raw = localStorage.getItem(snapshotKey(name, userId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Snapshot<unknown>;
    return parsed?.savedAt || null;
  } catch {
    return null;
  }
}

export function isOffline() {
  return typeof navigator !== 'undefined' && navigator.onLine === false;
}
