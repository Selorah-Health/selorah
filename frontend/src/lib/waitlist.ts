export type WaitlistRole = 'patient' | 'doctor' | 'hospital';

export const WAITLIST_ROLES: { id: WaitlistRole; label: string; hint: string }[] = [
  { id: 'patient', label: 'Patient', hint: 'Own my records' },
  { id: 'doctor', label: 'Doctor', hint: 'Treat with context' },
  { id: 'hospital', label: 'Hospital', hint: 'Faster intake' },
];

/**
 * Old waitlist rows used "other" and some rows had trailing spaces. Keep the
 * public taxonomy to Patient, Doctor, and Hospital so the count page and QA
 * tools do not show duplicate or unknown categories.
 */
export function normalizeWaitlistRole(role?: string | null): WaitlistRole {
  const value = (role || '').trim().toLowerCase();

  if (value === 'doctor' || value === 'clinician') return 'doctor';
  if (value === 'hospital' || value === 'provider' || value === 'clinic') return 'hospital';

  return 'patient';
}

export function waitlistRoleLabel(role?: string | null) {
  const normalized = normalizeWaitlistRole(role);
  if (normalized === 'doctor') return 'Doctor';
  if (normalized === 'hospital') return 'Hospital';
  return 'Patient';
}
