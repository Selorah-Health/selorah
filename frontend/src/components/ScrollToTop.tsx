import { useLayoutEffect } from 'react';
import { useLocation } from 'react-router-dom';

/** Reset every scroll surface when the route changes. */
export default function ScrollToTop() {
  const { pathname } = useLocation();

  useLayoutEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }

    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;

    // The dashboard and portal shells scroll inside their own containers.
    document.querySelectorAll<HTMLElement>('[data-scroll-root]').forEach((node) => {
      node.scrollTop = 0;
    });

    // If a focused control is far down the page, blur it so the browser does
    // not try to keep it in view and undo the reset.
    const active = document.activeElement;
    if (active instanceof HTMLElement && active !== document.body) {
      active.blur();
    }
  }, [pathname]);

  return null;
}
