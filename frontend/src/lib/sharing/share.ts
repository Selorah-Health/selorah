export type ActiveShare = {
  token: string;
  expiresAt: string;
  recordId: string | null;
  recordName?: string;
  createdAt: string;
};

const STORAGE_KEY = 'selorah_active_share';
const TEN_YEARS_MS = 9 * 365 * 24 * 60 * 60 * 1000;

export function createShareToken(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const random = (Math.random() * 16) | 0;
    const value = char === 'x' ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}

export function expiryFromMinutes(minutes: number | null): string {
  if (minutes === null) {
    return new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000).toISOString();
  }
  return new Date(Date.now() + minutes * 60 * 1000).toISOString();
}

export function hasCountdown(expiresAt: string | null | undefined): boolean {
  if (!expiresAt) return false;
  const remaining = new Date(expiresAt).getTime() - Date.now();
  return remaining > 0 && remaining < TEN_YEARS_MS;
}

export function secondsUntil(expiresAt: string | null | undefined): number | null {
  if (!expiresAt) return null;
  if (!hasCountdown(expiresAt)) return null;
  const remaining = new Date(expiresAt).getTime() - Date.now();
  return Math.max(0, Math.floor(remaining / 1000));
}

export function readActiveShare(): ActiveShare | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ActiveShare;
    if (!parsed?.token) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeActiveShare(share: ActiveShare | null) {
  try {
    if (!share) {
      localStorage.removeItem(STORAGE_KEY);
      return;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(share));
  } catch {
    // Storage is optional; the share row still works online.
  }
}

export function shareUrl(token: string): string {
  const origin = typeof window === 'undefined' ? '' : window.location.origin;
  return `${origin}/shared/${token}`;
}

export function formatCountdown(seconds: number): string {
  if (seconds <= 0) return '0:00';
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hours > 0) {
    return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function isNetworkError(message?: string) {
  return /failed to fetch|networkerror|load failed|fetch failed|network request failed|timeout|offline/i.test(
    message || ''
  );
}
