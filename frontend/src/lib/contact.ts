export type ContactRole = 'hospital' | 'researcher' | 'insurer';

const CONTACT_TOPIC: Record<ContactRole, string> = {
  hospital: 'Hospital or clinic',
  researcher: 'Research partnership',
  insurer: 'Insurance partnership',
};

export function contactPathForRole(role: ContactRole) {
  return `/contact?topic=${encodeURIComponent(CONTACT_TOPIC[role])}&role=${role}`;
}
