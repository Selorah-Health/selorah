export type PrivacyPrefs = {
  version: 1;
  essential: true;
  personalisation: boolean;
  searchHistory: boolean;
  decidedAt: string | null;
};

const STORAGE_KEY = 'selorah_privacy_v1';
export const PRIVACY_EVENT = 'selorah:privacy-updated';

export const DEFAULT_PRIVACY: PrivacyPrefs = {
  version: 1,
  essential: true,
  personalisation: true,
  searchHistory: true,
  decidedAt: null,
};

export function readPrivacy(): PrivacyPrefs {
  if (typeof window === 'undefined') return DEFAULT_PRIVACY;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PRIVACY;
    const parsed = JSON.parse(raw) as Partial<PrivacyPrefs>;
    return {
      version: 1,
      essential: true,
      personalisation: parsed.personalisation !== false,
      searchHistory: parsed.searchHistory !== false,
      decidedAt: typeof parsed.decidedAt === 'string' ? parsed.decidedAt : null,
    };
  } catch {
    return DEFAULT_PRIVACY;
  }
}

export function hasPrivacyDecision() {
  return Boolean(readPrivacy().decidedAt);
}

export function savePrivacy(
  choices: Pick<PrivacyPrefs, 'personalisation' | 'searchHistory'>
): PrivacyPrefs {
  const prefs: PrivacyPrefs = {
    version: 1,
    essential: true,
    personalisation: Boolean(choices.personalisation),
    searchHistory: Boolean(choices.searchHistory),
    decidedAt: new Date().toISOString(),
  };

  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    } catch {
      // The choice still applies for this session through the event.
    }
    window.dispatchEvent(new CustomEvent<PrivacyPrefs>(PRIVACY_EVENT, { detail: prefs }));
  }

  return prefs;
}

export function acceptOptionalPrivacy() {
  return savePrivacy({ personalisation: true, searchHistory: true });
}

export function essentialOnlyPrivacy() {
  return savePrivacy({ personalisation: false, searchHistory: false });
}

export function allowsPersonalisation() {
  return readPrivacy().personalisation;
}

export function allowsSearchHistory() {
  return readPrivacy().searchHistory;
}

export function listenForPrivacy(callback: (prefs: PrivacyPrefs) => void) {
  const handler = (event: Event) => callback((event as CustomEvent<PrivacyPrefs>).detail);
  window.addEventListener(PRIVACY_EVENT, handler);
  return () => window.removeEventListener(PRIVACY_EVENT, handler);
}
