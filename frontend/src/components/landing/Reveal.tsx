import { useRef } from 'react';
import { m, useInView, useReducedMotion } from 'framer-motion';

interface RevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  /** Render immediately without waiting for the observer. */
  eager?: boolean;
}

/**
 * Scroll reveal for the public pages. Content slides up into view and slides
 * back down when it leaves the viewport. Reduced motion users get the final
 * state immediately.
 */
export default function Reveal({ children, className = '', delay = 0, eager = false }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const inView = useInView(ref, { once: false, margin: '0px 0px -8% 0px', amount: 0.05 });
  const staticState = Boolean(eager || reduceMotion);
  const visible = staticState || inView;

  return (
    <m.div
      ref={ref}
      initial={staticState ? false : { opacity: 0, y: 24 }}
      animate={visible ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
      transition={{ duration: 0.55, delay: delay / 1000, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </m.div>
  );
}
