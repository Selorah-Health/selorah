/**
 * Session helpers for role-based portal access.
 *
 * Rules:
 * - patient  -> /dashboard only (not hospital / researcher / insurer)
 * - provider / hospital / researcher / insurer -> their portal + patient dashboard
 * - writer -> /adb
 * - qa / admin -> /qa
 */

export type UserRole =
  | 'patient'
  | 'provider'
  | 'hospital'
  | 'researcher'
  | 'insurer'
  | 'writer'
  | 'qa'
  | 'admin'
  | 'developer'
  | 'partner';

/** Internal staff domain. Any authenticated user on this domain can open the CMS. */
export const SELORAH_STAFF_DOMAIN = 'selorah.app';

/**
 * Bootstrap owner accounts. These are checked in the browser only so the owner
 * can open the website admin before a profile role is set. Database writes are
 * still protected by RLS; add the same address to public.site_admins before
 * expecting saves to succeed.
 */
const BOOTSTRAP_SITE_ADMIN_EMAILS = [
  'officialsammy61@gmail.com',
  'officalsammy61@gmail.com',
  'samuelamanze@selorah.app',
];

const EXTRA_SITE_ADMIN_EMAILS = String(import.meta.env.VITE_SITE_ADMIN_EMAILS || '')
  .split(',')
  .map((value: string) => value.trim().toLowerCase())
  .filter(Boolean);

export function isSelorahStaffEmail(email?: string | null): boolean {
  const normalized = (email || '').trim().toLowerCase();
  return normalized.endsWith(`@${SELORAH_STAFF_DOMAIN}`);
}

/** Staff, the bootstrap owner, and any address in VITE_SITE_ADMIN_EMAILS. */
export function isSelorahSiteAdminEmail(email?: string | null): boolean {
  const normalized = (email || '').trim().toLowerCase();
  if (!normalized) return false;
  return (
    isSelorahStaffEmail(normalized) ||
    BOOTSTRAP_SITE_ADMIN_EMAILS.includes(normalized) ||
    EXTRA_SITE_ADMIN_EMAILS.includes(normalized)
  );
}

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
  avatar_url?: string;
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
  if (r === 'writer') return 'writer';
  if (r === 'qa') return 'qa';
  if (r === 'admin') return 'admin';
  return 'patient';
}

/** Staff roles may also use the patient portal. */
export function isStaffRole(role?: string | null): boolean {
  const r = normalizeRole(role);
  return r === 'provider' || r === 'researcher' || r === 'insurer' || r === 'writer';
}

/**
 * Returns the correct home path for a role, or null if the role
 * is not allowed on `targetPath`.
 */
export function resolvePortalAccess(
  role: string | null | undefined,
  targetPath: string,
  email?: string | null
): { allowed: boolean; redirectTo: string } {
  const r = normalizeRole(role);
  const path = targetPath.split('?')[0];

  const isPatientPortal = path.startsWith('/dashboard') || path === '/onboarding';
  const isHospital = path.startsWith('/hospital');
  const isResearcher = path.startsWith('/researcher');
  const isInsurer = path.startsWith('/insurer');
  const isCms = path.startsWith('/cms') || path.startsWith('/adb');
  const isQa = path.startsWith('/qa');

  // Patient portal: everyone logged in may enter
  if (isPatientPortal) {
    return { allowed: true, redirectTo: path };
  }

  if (isQa) {
    if (r === 'qa' || r === 'admin') return { allowed: true, redirectTo: path };
    return { allowed: false, redirectTo: homeForRole(r) };
  }

  if (isCms) {
    if (r === 'writer' || r === 'admin' || isSelorahSiteAdminEmail(email)) {
      return { allowed: true, redirectTo: path };
    }
    // Do not bounce an authenticated visitor to the patient dashboard. The
    // website admin renders a clear access message instead, which is easier to
    // understand and avoids a redirect loop when the profile lookup is slow.
    return { allowed: false, redirectTo: path };
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
  if (r === 'writer') return '/adb';
  if (r === 'qa' || r === 'admin') return '/qa';
  return '/dashboard';
}

/** Validate Nigerian NIN: exactly 11 digits */
export function isValidNin(nin: string): boolean {
  return /^\d{11}$/.test(nin.trim());
}
