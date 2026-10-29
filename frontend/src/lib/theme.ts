export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'selorah_theme';
const EVENT = 'selorah:theme-updated';

function systemTheme(): Theme {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function readTheme(): Theme {
  if (typeof window === 'undefined') return 'light';
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
  } catch {
    // Storage can be blocked in private mode.
  }
  return systemTheme();
}

export function applyTheme(theme: Theme, persist = true) {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  root.classList.toggle('dark', theme === 'dark');
  root.style.colorScheme = theme;

  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', theme === 'dark' ? '#070A12' : '#6183FF');

  if (persist) {
    try {
      window.localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // The class on the document still applies for this session.
    }
    window.dispatchEvent(new CustomEvent<Theme>(EVENT, { detail: theme }));
  }
}

export function toggleTheme(): Theme {
  const next: Theme = document.documentElement.classList.contains('dark') ? 'light' : 'dark';
  applyTheme(next);
  return next;
}

export function initTheme() {
  if (typeof window === 'undefined') return;

  applyTheme(readTheme(), false);

  let stored: string | null = null;
  try {
    stored = window.localStorage.getItem(STORAGE_KEY);
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
  window.addEventListener(EVENT, handler);
  return () => window.removeEventListener(EVENT, handler);
}
