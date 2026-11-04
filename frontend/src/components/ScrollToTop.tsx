import { useEffect, useLayoutEffect } from 'react';
import { useLocation } from 'react-router-dom';

if (typeof window !== 'undefined' && 'scrollRestoration' in window.history) {
  window.history.scrollRestoration = 'manual';
}

function resetScroll() {
  if (typeof window === 'undefined') return;

  const root = document.documentElement;
  const previousBehavior = root.style.scrollBehavior;
  root.style.scrollBehavior = 'auto';

  window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  root.scrollTop = 0;
  document.body.scrollTop = 0;

  document.querySelectorAll<HTMLElement>('[data-scroll-root]').forEach((node) => {
    node.scrollTop = 0;
    node.scrollLeft = 0;
  });

  root.style.scrollBehavior = previousBehavior;
}

/** Reset every scroll surface when the route changes. */
export default function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useLayoutEffect(() => {
    const active = document.activeElement;
    if (active instanceof HTMLElement && active !== document.body) {
      active.blur();
    }

    if (hash) {
      const id = hash.replace(/^#/, '');
      const timer = window.setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 90);
      return () => window.clearTimeout(timer);
    }

    resetScroll();

    // Lazy routes mount after this effect. Reset again once the new page has
    // painted so a deep scroll position from the previous page cannot survive.
    const frame = window.requestAnimationFrame(resetScroll);
    const immediate = window.setTimeout(resetScroll, 0);
    const settled = window.setTimeout(resetScroll, 180);

    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(immediate);
      window.clearTimeout(settled);
    };
  }, [pathname, hash]);

  useEffect(() => {
    if (!hash) return;
    const id = hash.replace(/^#/, '');
    const timer = window.setTimeout(() => {
      document
        .getElementById(id)
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 260);
    return () => window.clearTimeout(timer);
  }, [hash]);

  return null;
}
