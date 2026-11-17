import { LazyMotion, domAnimation } from 'framer-motion';

/**
 * Keeps the animation feature bundle out of the main app shell. Marketing
 * pages opt in with this provider, so the dashboard and login routes do not
 * pay for Framer Motion.
 */
export default function MotionProvider({ children }: { children: React.ReactNode }) {
  return (
    <LazyMotion features={domAnimation} strict>
      {children}
    </LazyMotion>
  );
}
