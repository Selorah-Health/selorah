import {
  ArrowRightIcon,
  ClockIcon,
  FingerPrintIcon,
  LockClosedIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import { m } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useSiteContent } from '../../contexts/SiteContentContext';
import Reveal from './Reveal';

const TRUST_ITEMS = [
  {
    title: 'Encrypted in transit and at rest',
    body: 'Records are protected before they leave your device and stay encrypted in storage.',
    icon: LockClosedIcon,
  },
  {
    title: 'Consent before access',
    body: 'A clinician cannot open your record until you create a share for them.',
    icon: FingerPrintIcon,
  },
  {
    title: 'Time limited by default',
    body: 'Every share has an expiry. Access ends automatically, even if you forget.',
    icon: ClockIcon,
  },
  {
    title: 'A clear audit trail',
    body: 'See who opened what, when it happened, and revoke access at any time.',
    icon: ShieldCheckIcon,
  },
];

export default function TrustSecuritySection() {
  const { content } = useSiteContent();
  const section = content.trust;

  if (!section.enabled) return null;

  return (
    <section
      id="security"
      className="scroll-mt-24 bg-[#F6F9FC] px-5 py-20 sm:px-8 sm:py-24 lg:px-10"
    >
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
          <Reveal>
            <div className="lg:sticky lg:top-28">
              <p className="text-sm font-medium text-primary">{section.eyebrow}</p>
              <h2 className="mt-3 text-3xl font-semibold leading-tight tracking-[-0.03em] text-[#101217] sm:text-4xl">
                {section.title}
              </h2>
              <p className="mt-4 max-w-md text-base leading-relaxed text-[#4B5563]">
                {section.body}
              </p>
              <Link
                to="/privacy"
                className="group mt-6 inline-flex items-center gap-2 text-sm font-medium text-primary transition-colors hover:text-primary-hover"
              >
                Read the privacy policy
                <ArrowRightIcon
                  className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                  strokeWidth={2}
                />
              </Link>
            </div>
          </Reveal>

          <div className="grid gap-x-8 gap-y-0 sm:grid-cols-2">
            {TRUST_ITEMS.map((item, index) => {
              const Icon = item.icon;
              return (
                <Reveal key={item.title} delay={index * 60} className="h-full">
                  <m.div
                    whileHover={{ y: -2 }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                    className="h-full border-t border-[#E5E7EB] py-6 transition-colors hover:border-primary/40"
                  >
                    <Icon className="h-5 w-5 text-primary" strokeWidth={1.8} />
                    <h3 className="mt-4 text-base font-semibold text-[#101217]">{item.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-[#6B7280]">{item.body}</p>
                  </m.div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
