/**
 * Session helpers for role-based portal access.
 *
 * Rules:
 * - patient  → /dashboard only (not hospital / researcher / insurer)
 * - provider / hospital / researcher / insurer → their portal + patient dashboard
 */

export type UserRole =
  | 'patient'
  | 'provider'
  | 'hospital'
  | 'researcher'
  | 'insurer'
  | 'developer'
  | 'partner';

export interface SelorahSession {
  id?: string;
  email?: string;
  phone?: string;
  nin?: string;
  first_name?: string;
  last_name?: string;
  role?: UserRole | string;
  org_id?: string;
  is_pro?: boolean;
}

export function readLocalSession(): SelorahSession | null {
  try {
    const raw = localStorage.getItem('selorah_user');
    if (!raw) return null;
    return JSON.parse(raw) as SelorahSession;
  } catch {
    return null;
  }
}

export function writeLocalSession(partial: SelorahSession) {
  const prev = readLocalSession() || {};
  localStorage.setItem('selorah_user', JSON.stringify({ ...prev, ...partial }));
}

export function clearLocalSession() {
  localStorage.removeItem('selorah_user');
}

export function normalizeRole(role?: string | null): UserRole {
  const r = (role || 'patient').toLowerCase();
  if (r === 'hospital' || r === 'provider') return 'provider';
  if (r === 'researcher') return 'researcher';
  if (r === 'insurer') return 'insurer';
  return 'patient';
}

/** Staff roles may also use the patient portal. */
export function isStaffRole(role?: string | null): boolean {
  const r = normalizeRole(role);
  return r === 'provider' || r === 'researcher' || r === 'insurer';
}

/**
 * Returns the correct home path for a role, or null if the role
 * is not allowed on `targetPath`.
 */
export function resolvePortalAccess(
  role: string | null | undefined,
  targetPath: string
): { allowed: boolean; redirectTo: string } {
  const r = normalizeRole(role);
  const path = targetPath.split('?')[0];

  const isPatientPortal = path.startsWith('/dashboard') || path === '/onboarding';
  const isHospital = path.startsWith('/hospital');
  const isResearcher = path.startsWith('/researcher');
  const isInsurer = path.startsWith('/insurer');

  // Patient portal: everyone logged in may enter
  if (isPatientPortal) {
    return { allowed: true, redirectTo: path };
  }

  if (isHospital) {
    if (r === 'provider') return { allowed: true, redirectTo: path };
    return { allowed: false, redirectTo: homeForRole(r) };
  }
  if (isResearcher) {
    if (r === 'researcher') return { allowed: true, redirectTo: path };
    return { allowed: false, redirectTo: homeForRole(r) };
  }
  if (isInsurer) {
    if (r === 'insurer') return { allowed: true, redirectTo: path };
    return { allowed: false, redirectTo: homeForRole(r) };
  }

  return { allowed: true, redirectTo: path };
}

export function homeForRole(role?: string | null): string {
  const r = normalizeRole(role);
  if (r === 'provider') return '/hospital';
  if (r === 'researcher') return '/researcher';
  if (r === 'insurer') return '/insurer';
  return '/dashboard';
}

/** Validate Nigerian NIN: exactly 11 digits */
export function isValidNin(nin: string): boolean {
  return /^\d{11}$/.test(nin.trim());
}
