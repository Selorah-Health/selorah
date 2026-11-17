import { useEffect, useRef, useState } from 'react';
import { m, useInView, useReducedMotion } from 'framer-motion';

interface RevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  /** Render immediately without waiting for the observer. */
  eager?: boolean;
}

/**
 * Scroll reveal with a hard fail-open. The content is never left invisible:
 * if the observer is throttled, the element is already above the viewport, or
 * the browser does not support the API, it is shown after a short fallback.
 */
export default function Reveal({ children, className = '', delay = 0, eager = false }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const inView = useInView(ref, { once: true, margin: '0px 0px -8% 0px', amount: 0.05 });
  const [forced, setForced] = useState(Boolean(eager || reduceMotion));

  useEffect(() => {
    if (forced) return;
    const element = ref.current;
    if (!element) return;

    const showIfAbove = () => {
      if (element.getBoundingClientRect().bottom <= 0) {
        setForced(true);
      }
    };

    showIfAbove();
    const fallback = window.setTimeout(() => setForced(true), 1200);
    window.addEventListener('scroll', showIfAbove, { passive: true });
    window.addEventListener('resize', showIfAbove);

    return () => {
      window.clearTimeout(fallback);
      window.removeEventListener('scroll', showIfAbove);
      window.removeEventListener('resize', showIfAbove);
    };
  }, [forced]);

  const visible = forced || inView || Boolean(reduceMotion);

  return (
    <m.div
      ref={ref}
      initial={false}
      animate={visible ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 }}
      transition={{ duration: 0.55, delay: delay / 1000, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </m.div>
  );
}
