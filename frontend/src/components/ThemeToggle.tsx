import { useEffect, useState } from 'react';
import { MoonIcon, SunIcon } from '@heroicons/react/24/outline';
import { listenForTheme, readTheme, toggleTheme, type Theme } from '../lib/theme';

interface ThemeToggleProps {
  tone?: 'light' | 'dark';
  className?: string;
}

export default function ThemeToggle({ tone = 'light', className = '' }: ThemeToggleProps) {
  const [theme, setTheme] = useState<Theme>(() => readTheme());

  useEffect(() => listenForTheme(setTheme), []);

  const isDark = theme === 'dark';
  const toneClass =
    tone === 'dark'
      ? 'border-white/15 text-white/70 hover:border-white/30 hover:bg-white/10 hover:text-white'
      : 'border-gray-200 bg-white text-gray-500 hover:border-[#6183FF]/40 hover:text-[#6183FF]';

  return (
    <button
      type="button"
      onClick={() => setTheme(toggleTheme())}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition-colors ${toneClass} ${className}`}
    >
      {isDark ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
    </button>
  );
}
