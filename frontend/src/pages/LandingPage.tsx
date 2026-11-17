import { useEffect, useRef, useState } from 'react';
import {
  ArrowRightIcon,
  ArrowUpRightIcon,
  CheckCircleIcon,
  DocumentTextIcon,
  FolderOpenIcon,
  HandRaisedIcon,
  HeartIcon,
  LockClosedIcon,
  MinusIcon,
  NoSymbolIcon,
  PlusIcon,
  QrCodeIcon,
  ShieldCheckIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import WaitlistModal, { type WaitlistRole } from '../components/WaitlistModal';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SEOTitle from '../components/SEOTitle';
import CTAButton from '../components/CTAButton';
import WaitlistProof from '../components/WaitlistProof';
import MotionProvider from '../components/MotionProvider';
import Reveal from '../components/landing/Reveal';
import RoleSolutionsSection from '../components/landing/RoleSolutionsSection';
import TrustSecuritySection from '../components/landing/TrustSecuritySection';
import BlogTeaserSection from '../components/landing/BlogTeaserSection';
import ProductPreviewSection from '../components/landing/ProductPreviewSection';
import CareTeamsSection from '../components/landing/CareTeamsSection';
import WhatHappensNext from '../components/landing/WhatHappensNext';
import { AdSlot, PartnerBand } from '../components/landing/AdSections';
import { useSiteContent } from '../contexts/SiteContentContext';

const PROBLEM_CARDS = [
  {
    title: 'Records do not move with patients',
    body: 'Your history stays in the filing cabinet of the last hospital you visited. Move city or change clinic and you are a stranger again.',
    icon: FolderOpenIcon,
  },
  {
    title: 'Doctors treating patients with incomplete information',
    body: 'Without a portable record, providers repeat tests or delay care when minutes matter most. Context is lost at every handoff.',
    icon: UserGroupIcon,
  },
  {
    title: 'Pregnant women pay a higher price',
    body: 'Critical history is scattered across cards and folders. Missed context during pregnancy can cost lives and money.',
    icon: HeartIcon,
  },
];

const HOW_STEPS = [
  {
    n: '01',
    title: 'Save your records',
    body: 'Keep key history in one place on your phone, not scattered across hospital counters.',
    icon: DocumentTextIcon,
    detailTitle: 'Encrypted vault',
    detailBody:
      'Upload lab results, scans, prescriptions, and visit notes. Everything is encrypted before it leaves your device.',
  },
  {
    n: '02',
    title: 'Share with a code',
    body: 'When a clinic needs access, you show a time-limited code or link. Only what you allow.',
    icon: QrCodeIcon,
    detailTitle: 'Generate a QR code',
    detailBody:
      'A clinician scans your code and sees only the records you selected, for a window you set.',
  },
  {
    n: '03',
    title: 'Revoke anytime',
    body: 'Access ends when you say so. Your story does not live on their desk forever.',
    icon: HandRaisedIcon,
    detailTitle: 'Instant revoke',
    detailBody:
      'One tap ends access. The audit log stays, so you always know who saw what and when.',
  },
];

const OWNERSHIP_CARDS = [
  {
    title: 'You control access',
    body: 'Share with a clinic for a limited time. When you revoke, access stops.',
    icon: LockClosedIcon,
  },
  {
    title: 'Not for sale',
    body: 'We do not sell your health information. Privacy is part of the product.',
    icon: NoSymbolIcon,
  },
  {
    title: 'Why now',
    body: 'Paper folders still decide care for millions. Digital ownership should not wait another decade.',
    icon: ShieldCheckIcon,
  },
];

function ProgressBar() {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const onScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(docHeight > 0 ? Math.min(100, (scrollTop / docHeight) * 100) : 0);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return (
    <div className="pointer-events-none fixed left-0 right-0 top-0 z-[60] h-[3px] bg-transparent">
      <div
        className="h-full bg-[#5FFAB0] transition-[width] duration-150 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-sm font-medium text-primary">{children}</p>;
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-primary">{children}</p>
  );
}

function ProblemSection() {
  const [active, setActive] = useState(1);

  return (
    <section
      id="product"
      className="scroll-mt-24 bg-white px-5 py-16 sm:px-8 sm:py-20 md:py-24 lg:px-10"
    >
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 max-w-3xl sm:mb-14">
          <Eyebrow>The problem</Eyebrow>
          <h2 className="text-3xl font-bold leading-tight tracking-tight text-[#101217] sm:text-4xl md:text-[2.75rem]">
            Patients always start from zero at a new hospital.
          </h2>
          <p className="mt-4 max-w-xl text-sm font-medium leading-relaxed text-gray-500 sm:text-base">
            The records exist. They just never travel with the person who needs them.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {PROBLEM_CARDS.map((card, index) => {
            const Icon = card.icon;
            const isActive = active === index;
            return (
              <button
                key={card.title}
                type="button"
                onClick={() => setActive(index)}
                onMouseEnter={() => setActive(index)}
                onFocus={() => setActive(index)}
                aria-pressed={isActive}
                className={`group relative flex flex-col overflow-hidden rounded-none border p-6 text-left transition-all duration-300 sm:p-7 ${
                  isActive
                    ? 'border-primary bg-primary text-white shadow-xl shadow-primary/20'
                    : 'border-gray-100 bg-[#F8F9FA] text-[#101217] hover:border-primary/30'
                }`}
              >
                <span
                  className={`flex h-11 w-11 items-center justify-center rounded-none transition-colors ${
                    isActive ? 'bg-white/15 text-white' : 'bg-white text-primary shadow-sm'
                  }`}
                >
                  <Icon className="h-5 w-5" strokeWidth={1.7} />
                </span>
                <h3
                  className={`mt-5 text-lg font-bold leading-snug ${
                    isActive ? 'text-white' : 'text-[#101217]'
                  }`}
                >
                  {card.title}
                </h3>
                <p
                  className={`mt-2.5 text-sm leading-relaxed ${
                    isActive ? 'text-white/80' : 'text-gray-500'
                  }`}
                >
                  {card.body}
                </p>
                <span
                  className={`mt-5 text-[10px] font-black uppercase tracking-[0.16em] ${
                    isActive ? 'text-white/60' : 'text-gray-300'
                  }`}
                >
                  0{index + 1}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function HowItWorksSection() {
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <section id="how-it-works" className="scroll-mt-24">
      <div className="bg-white px-5 pb-8 pt-16 sm:px-8 sm:pt-20 md:pt-24 lg:px-10">
        <div className="mx-auto max-w-6xl">
          <Eyebrow>How it works</Eyebrow>
          <h2 className="text-3xl font-bold tracking-tight text-[#101217] sm:text-4xl md:text-[2.75rem]">
            THREE STEPS.
            <br />
            <span className="text-primary">YOU STAY IN CONTROL.</span>
          </h2>
        </div>
      </div>

      <div className="bg-[var(--background)] px-5 pb-16 pt-4 sm:px-8 sm:pb-20 md:pb-24 lg:px-10">
        <div className="mx-auto max-w-6xl">
          <div className="relative flex flex-col">
            {HOW_STEPS.map((step, index) => {
              const Icon = step.icon;
              const isHovered = hovered === index;
              return (
                <div
                  key={step.n}
                  className="relative"
                  onMouseEnter={() => setHovered(index)}
                  onMouseLeave={() => setHovered(null)}
                >
                  <div
                    className={`relative z-10 flex flex-col gap-3 rounded-none px-4 py-5 transition-all duration-300 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-6 sm:py-6 ${
                      isHovered
                        ? 'border-transparent bg-[#020924] text-white shadow-xl'
                        : 'border-b border-[var(--border)] bg-transparent text-[#101217]'
                    }`}
                  >
                    <div className="flex min-w-0 items-center gap-4 sm:gap-6">
                      <span
                        className={`w-8 shrink-0 text-lg font-bold tracking-tight sm:text-xl ${
                          isHovered ? 'text-white/40' : 'text-gray-400'
                        }`}
                      >
                        {step.n}
                      </span>
                      <h3 className="truncate text-lg font-bold sm:text-xl">{step.title}</h3>
                    </div>

                    <p
                      className={`text-sm leading-relaxed sm:hidden ${
                        isHovered ? 'text-white/70' : 'text-gray-500'
                      }`}
                    >
                      {step.detailBody}
                    </p>

                    <div
                      className={`hidden h-9 w-9 shrink-0 items-center justify-center rounded-full transition-all duration-300 sm:flex ${
                        isHovered ? 'bg-primary text-white' : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      <ArrowUpRightIcon className="h-4 w-4" strokeWidth={2.5} />
                    </div>
                  </div>

                  <div
                    className={`pointer-events-none absolute left-1/2 top-1/2 z-30 hidden w-[400px] -translate-x-1/2 -translate-y-1/2 transition-all duration-300 sm:block ${
                      isHovered ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
                    }`}
                  >
                    <div className="overflow-hidden rounded-none border border-gray-100 bg-white shadow-2xl">
                      <div className="flex items-center gap-1.5 border-b border-gray-100 bg-gray-50 px-4 py-2.5">
                        <span className="h-2.5 w-2.5 rounded-full bg-[#FF5F57]" />
                        <span className="h-2.5 w-2.5 rounded-full bg-[#FEBC2E]" />
                        <span className="h-2.5 w-2.5 rounded-full bg-[#28C840]" />
                      </div>
                      <div className="grid min-h-[140px] grid-cols-2">
                        <div className="flex flex-col items-center justify-center gap-2.5 bg-primary/10 p-5">
                          <div className="flex h-14 w-14 items-center justify-center rounded-none bg-primary">
                            <Icon className="h-7 w-7 text-white" />
                          </div>
                          <p className="text-center text-sm font-bold leading-tight text-primary">
                            {step.detailTitle}
                          </p>
                        </div>
                        <div className="flex flex-col justify-center p-5">
                          <p className="text-xs leading-relaxed text-gray-600 sm:text-sm">
                            {step.detailBody}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

function OwnershipSection() {
  const [hovered, setHovered] = useState<number | null>(null);
  const { content } = useSiteContent();
  const section = content.ownership;

  if (!section.enabled) return null;

  return (
    <section
      id="ownership"
      className="scroll-mt-24 bg-[#020924] px-5 py-16 text-white sm:px-8 sm:py-20 md:py-24 lg:px-10"
    >
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 flex flex-col justify-between gap-6 sm:mb-16 md:flex-row md:items-end">
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-primary">
              {section.eyebrow}
            </p>
            <h2 className="max-w-lg text-3xl font-bold leading-tight tracking-tight sm:text-4xl md:text-[2.75rem]">
              {section.title}
            </h2>
          </div>
          <p className="max-w-sm text-base leading-relaxed text-white/50 sm:text-lg">
            {section.body}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {OWNERSHIP_CARDS.map((card, index) => {
            const Icon = card.icon;
            const isHovered = hovered === index;
            return (
              <div
                key={card.title}
                onMouseEnter={() => setHovered(index)}
                onMouseLeave={() => setHovered(null)}
                className={`rounded-none border p-6 transition-all duration-300 sm:p-7 ${
                  isHovered
                    ? 'border-primary bg-primary shadow-xl shadow-primary/30'
                    : 'border-white/10 bg-white/5'
                }`}
              >
                <Icon
                  className={`mb-4 h-7 w-7 ${isHovered ? 'text-white' : 'text-primary'}`}
                  strokeWidth={1.6}
                />
                <h3 className="mb-2 text-lg font-bold">{card.title}</h3>
                <p
                  className={`text-sm leading-relaxed ${
                    isHovered ? 'text-white/90' : 'text-white/60'
                  }`}
                >
                  {card.body}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const { content } = useSiteContent();
  const section = content.faq;

  if (!section.enabled || section.items.length === 0) return null;

  return (
    <section
      id="faq"
      className="scroll-mt-24 border-t border-[#E5E7EB] bg-white px-5 py-20 sm:px-8 sm:py-24 lg:px-10"
    >
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
        <Reveal>
          <div>
            <SectionLabel>{section.eyebrow}</SectionLabel>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-[#101217] sm:text-4xl">
              {section.title}
            </h2>
            <p className="mt-4 max-w-sm text-base leading-relaxed text-[#4B5563]">
              {section.body}
            </p>
          </div>
        </Reveal>

        <Reveal delay={80}>
          <div className="border-y border-[#E5E7EB]">
            {section.items.map((item, index) => {
              const isOpen = openIndex === index;
              return (
                <div key={item.question} className={index > 0 ? 'border-t border-[#E5E7EB]' : ''}>
                  <button
                    type="button"
                    onClick={() => setOpenIndex(isOpen ? null : index)}
                    aria-expanded={isOpen}
                    className="flex w-full items-start justify-between gap-6 py-5 text-left transition-colors sm:py-6"
                  >
                    <span
                      className={`text-base font-medium leading-snug ${
                        isOpen ? 'text-primary' : 'text-[#101217]'
                      }`}
                    >
                      {item.question}
                    </span>
                    {isOpen ? (
                      <MinusIcon className="mt-0.5 h-4 w-4 shrink-0 text-primary" strokeWidth={2} />
                    ) : (
                      <PlusIcon
                        className="mt-0.5 h-4 w-4 shrink-0 text-[#8A94A6]"
                        strokeWidth={2}
                      />
                    )}
                  </button>
                  <div
                    className={`grid transition-all duration-300 ease-out ${
                      isOpen ? 'grid-rows-[1fr] pb-6 opacity-100' : 'grid-rows-[0fr] opacity-0'
                    }`}
                  >
                    <div className="overflow-hidden">
                      <p className="max-w-xl pr-8 text-sm leading-relaxed text-[#6B7280]">
                        {item.answer}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function FounderSection() {
  const { content } = useSiteContent();
  const section = content.founder;

  if (!section.enabled) return null;

  return (
    <section id="founder" className="scroll-mt-24 bg-[#F6F9FC] px-5 py-20 sm:px-8 sm:py-24 lg:px-10">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start lg:gap-16">
          <Reveal>
            <div>
              <img
                src={section.imageUrl}
                alt={`${section.name}, Founder of Selorah Health`}
                width={640}
                height={800}
                decoding="async"
                fetchPriority="high"
                className="aspect-[4/5] w-full rounded-none object-cover"
              />
              <div className="mt-4">
                <p className="text-base font-semibold text-[#101217]">{section.name}</p>
                <p className="text-sm text-[#6B7280]">{section.role}</p>
              </div>
            </div>
          </Reveal>

          <Reveal delay={80}>
            <div>
              <SectionLabel>{section.eyebrow}</SectionLabel>
              <p className="mt-3 max-w-2xl text-2xl font-medium leading-relaxed tracking-[-0.02em] text-[#101217] sm:text-3xl">
                &ldquo;{section.quote}&rdquo;
              </p>
              {section.bio.map((paragraph) => (
                <p key={paragraph} className="mt-4 max-w-xl text-base leading-relaxed text-[#4B5563] first:mt-6">
                  {paragraph}
                </p>
              ))}

              <div className="mt-7 flex flex-wrap items-center gap-5">
                <a
                  href={section.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${section.name} on LinkedIn`}
                  className="inline-flex items-center gap-2 text-sm font-medium text-[#101217] transition-colors hover:text-primary"
                >
                  <img
                    src="/landing/social-linkedin.png"
                    alt=""
                    className="h-4 w-4 object-contain"
                    aria-hidden="true"
                  />
                  LinkedIn
                </a>
                <a
                  href={section.xUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${section.name} on X`}
                  className="inline-flex items-center gap-2 text-sm font-medium text-[#101217] transition-colors hover:text-primary"
                >
                  <svg
                    className="h-4 w-4 text-primary"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.722-8.829L1.254 2.25H8.08l4.253 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
                  </svg>
                  X / Twitter
                </a>
                <span className="inline-flex items-center gap-1.5 text-sm font-medium text-[#6B7280]">
                  <CheckCircleIcon className="h-4 w-4 text-[#0F9F6E]" />
                  Building in public
                </span>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function FinalCtaSection({ onJoin }: { onJoin: () => void }) {
  const { content } = useSiteContent();
  const section = content.finalCta;

  if (!section.enabled) return null;

  return (
    <section
      id="waitlist"
      className="scroll-mt-24 bg-[var(--background)] px-5 py-16 sm:px-8 sm:py-20 lg:px-10"
    >
      <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
        <Eyebrow>{section.eyebrow}</Eyebrow>
        <h2 className="mb-4 text-3xl font-bold tracking-tight text-[#101217] sm:text-4xl md:text-5xl">
          {section.title}
        </h2>
        <p className="mb-8 max-w-lg text-base text-muted sm:text-lg">{section.body}</p>
        <CTAButton size="lg" onClick={onJoin}>
          {section.ctaLabel}
        </CTAButton>
        <div className="mt-6">
          <WaitlistProof />
        </div>
      </div>
    </section>
  );
}

export default function LandingPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalRole, setModalRole] = useState<WaitlistRole>('patient');
  const [modalSource, setModalSource] = useState('hero');
  const [showStickyCta, setShowStickyCta] = useState(false);
  const heroRef = useRef<HTMLElement | null>(null);
  const footerSentinelRef = useRef<HTMLDivElement | null>(null);
  const { content } = useSiteContent();

  const openWaitlist = (role: WaitlistRole = 'patient', source = 'unknown') => {
    setModalRole(role);
    setModalSource(source);
    setIsModalOpen(true);
  };

  useEffect(() => {
    const onScroll = () => {
      const heroBottom = heroRef.current?.getBoundingClientRect().bottom ?? 0;
      const nearFooter =
        (footerSentinelRef.current?.getBoundingClientRect().top ?? 9999) < window.innerHeight + 80;
      setShowStickyCta(heroBottom < 0 && !nearFooter);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <MotionProvider>
      <div className="min-h-screen overflow-x-hidden bg-[var(--background)] font-sans text-[var(--foreground)] selection:bg-primary/30 selection:text-primary">
        <SEOTitle
          title="The OS for Health Records"
          description="Selorah gives you one encrypted health record you can carry to any hospital, share with a time-limited QR code, and revoke whenever you choose. Join the waitlist."
        />
        <ProgressBar />
        <Header
          theme="dark"
          announcementTone="dark"
          announcement={
            <span>
              {content.announcement.text}{' '}
              <button
                type="button"
                onClick={() => openWaitlist('patient', 'announcement')}
                className="inline-flex items-center gap-1 font-medium text-[#8FA8FF] transition-colors hover:text-white"
              >
                {content.announcement.linkLabel}
                <ArrowRightIcon className="h-3.5 w-3.5" strokeWidth={2} />
              </button>
            </span>
          }
        />

        <section
          ref={heroRef}
          className="relative flex min-h-[100svh] w-full items-center overflow-hidden bg-black pt-28 sm:pt-32"
        >
          <video
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            poster="/assets/hero-bg-image-1.jpg"
            className="absolute inset-0 h-full w-full object-cover opacity-40"
          >
            <source src="/assets/hero-bg-video-1.mp4" type="video/mp4" />
          </video>

          <div className="relative z-10 mx-auto flex max-w-4xl flex-col items-center px-5 pb-20 pt-8 text-center sm:px-8 sm:pb-24 sm:pt-12 lg:px-10">
            <div className="flex w-full max-w-3xl flex-col items-center">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/30 px-4 py-1.5 text-xs font-medium text-white sm:mb-8 sm:text-sm">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#5FFAB0]" aria-hidden />
                {content.hero.eyebrow}
              </div>
              <h1 className="mb-5 max-w-3xl text-4xl font-bold uppercase leading-[1.05] tracking-tighter text-white sm:mb-6 sm:text-5xl md:text-6xl lg:text-[4.25rem]">
                {content.hero.title}
              </h1>
              <p className="mx-auto mb-8 max-w-xl text-base leading-relaxed text-white/75 sm:mb-10 sm:text-lg md:text-xl">
                {content.hero.subtitle}
              </p>
              <div className="mb-8">
                <CTAButton size="lg" onClick={() => openWaitlist('patient', 'hero')}>
                  {content.hero.ctaLabel}
                </CTAButton>
              </div>
              <WaitlistProof tone="dark" />
            </div>
          </div>
        </section>

        <ProductPreviewSection />
        <Reveal>
          <PartnerBand />
        </Reveal>
        <Reveal>
          <ProblemSection />
        </Reveal>
        <Reveal>
          <HowItWorksSection />
        </Reveal>
        <CareTeamsSection onJoin={openWaitlist} />
        <Reveal>
          <AdSlot />
        </Reveal>
        <RoleSolutionsSection onJoin={openWaitlist} />
        <Reveal>
          <OwnershipSection />
        </Reveal>
        <TrustSecuritySection />
        <BlogTeaserSection />
        <WhatHappensNext />
        <Reveal>
          <AdSlot variant="native" />
        </Reveal>
        <FaqSection />
        <FounderSection />
        <Reveal>
          <FinalCtaSection onJoin={() => openWaitlist('patient', 'final-cta')} />
        </Reveal>

        <div ref={footerSentinelRef} aria-hidden className="h-px" />
        <Footer />

        {showStickyCta && (
          <div className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-100 bg-white/95 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-8px_30px_rgba(0,0,0,0.08)] backdrop-blur-md sm:hidden">
            <CTAButton
              className="w-full justify-center"
              onClick={() => openWaitlist('patient', 'sticky-mobile')}
            >
              Join The Waitlist
            </CTAButton>
          </div>
        )}

        <WaitlistModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          initialRole={modalRole}
          source={modalSource}
        />
      </div>
    </MotionProvider>
  );
}
