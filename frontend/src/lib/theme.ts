export type Theme = 'light' | 'dark';

export type AccentId =
  | 'blue'
  | 'teal'
  | 'violet'
  | 'rose'
  | 'amber'
  | 'emerald'
  | 'indigo'
  | 'slate';

export type AccentPreset = {
  id: AccentId;
  label: string;
  primary: string;
  hover: string;
};

export const ACCENT_PRESETS: Record<AccentId, AccentPreset> = {
  blue: { id: 'blue', label: 'Selorah blue', primary: '#6183FF', hover: '#4D6ED6' },
  teal: { id: 'teal', label: 'Teal', primary: '#0E9F8A', hover: '#0B7F70' },
  violet: { id: 'violet', label: 'Violet', primary: '#7C5CFF', hover: '#6547D9' },
  rose: { id: 'rose', label: 'Rose', primary: '#E24D7A', hover: '#C53B65' },
  amber: { id: 'amber', label: 'Amber', primary: '#B8730A', hover: '#955C07' },
  emerald: { id: 'emerald', label: 'Emerald', primary: '#0F8A5F', hover: '#0B6E4C' },
  indigo: { id: 'indigo', label: 'Indigo', primary: '#4F46E5', hover: '#4338CA' },
  slate: { id: 'slate', label: 'Slate', primary: '#475569', hover: '#334155' },
};

export const DEFAULT_ACCENT: AccentId = 'blue';

const THEME_STORAGE_KEY = 'selorah_theme';
const ACCENT_STORAGE_KEY = 'selorah_accent';
const THEME_EVENT = 'selorah:theme-updated';
const ACCENT_EVENT = 'selorah:accent-updated';

function systemTheme(): Theme {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function readTheme(): Theme {
  if (typeof window === 'undefined') return 'light';
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
  } catch {
    // Storage can be blocked in private mode.
  }
  return systemTheme();
}

export function readAccent(): AccentId {
  if (typeof window === 'undefined') return DEFAULT_ACCENT;
  try {
    const stored = window.localStorage.getItem(ACCENT_STORAGE_KEY);
    if (stored && Object.prototype.hasOwnProperty.call(ACCENT_PRESETS, stored)) {
      return stored as AccentId;
    }
  } catch {
    // Storage can be blocked in private mode.
  }
  return DEFAULT_ACCENT;
}

function updateThemeColor(theme: Theme, accent: AccentId) {
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute(
      'content',
      theme === 'dark' ? '#070A12' : ACCENT_PRESETS[accent].primary,
    );
  }
}

export function applyTheme(theme: Theme, persist = true) {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  root.classList.toggle('dark', theme === 'dark');
  root.style.colorScheme = theme;
  updateThemeColor(theme, readAccent());

  if (persist) {
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // The class on the document still applies for this session.
    }
    window.dispatchEvent(new CustomEvent<Theme>(THEME_EVENT, { detail: theme }));
  }
}

export function toggleTheme(): Theme {
  const next: Theme = document.documentElement.classList.contains('dark') ? 'light' : 'dark';
  applyTheme(next);
  return next;
}

export function applyAccent(accent: AccentId, persist = true) {
  if (typeof document === 'undefined') return;

  const preset = ACCENT_PRESETS[accent] ?? ACCENT_PRESETS[DEFAULT_ACCENT];
  const root = document.documentElement;
  root.style.setProperty('--primary', preset.primary);
  root.style.setProperty('--primary-hover', preset.hover);
  updateThemeColor(readTheme(), preset.id);

  if (persist) {
    try {
      window.localStorage.setItem(ACCENT_STORAGE_KEY, preset.id);
    } catch {
      // The variables on the document still apply for this session.
    }
    window.dispatchEvent(
      new CustomEvent<AccentId>(ACCENT_EVENT, { detail: preset.id }),
    );
  }
}

export function initTheme() {
  if (typeof window === 'undefined') return;

  applyAccent(readAccent(), false);
  applyTheme(readTheme(), false);

  let stored: string | null = null;
  try {
    stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  } catch {
    stored = null;
  }

  if (!stored) {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => applyTheme(media.matches ? 'dark' : 'light', false);
    media.addEventListener('change', onChange);
  }
}

export function listenForTheme(callback: (theme: Theme) => void) {
  const handler = (event: Event) => callback((event as CustomEvent<Theme>).detail);
  window.addEventListener(THEME_EVENT, handler);
  return () => window.removeEventListener(THEME_EVENT, handler);
}

export function listenForAccent(callback: (accent: AccentId) => void) {
  const handler = (event: Event) =>
    callback((event as CustomEvent<AccentId>).detail);
  window.addEventListener(ACCENT_EVENT, handler);
  return () => window.removeEventListener(ACCENT_EVENT, handler);
}
