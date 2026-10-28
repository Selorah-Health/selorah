import { useEffect, useRef, useState } from 'react';
import {
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
      'Upload lab results, scans, prescriptions and visit notes. Everything is encrypted before it leaves your device.',
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

const FAQS = [
  {
    question: 'What exactly is Selorah Health?',
    answer:
      'Selorah is a patient-owned health record. You keep your lab results, scans, prescriptions and visit history in one encrypted place, then share them with any clinic using a time-limited QR code.',
  },
  {
    question: 'Who can see my medical records?',
    answer:
      'Only you, until you choose to share. When you generate a code you pick the records and the duration. Every open is logged, and you can revoke access at any moment.',
  },
  {
    question: 'Do hospitals need to be on Selorah?',
    answer:
      'No. A clinician can open your shared link in any browser and see the records you allowed. Hospitals that join get faster intake, NIN lookup and a full audit trail.',
  },
  {
    question: 'How is my data protected?',
    answer:
      'Records are encrypted in transit and at rest. Access links expire, are single purpose, and can be revoked instantly. We never sell your health information.',
  },
  {
    question: 'Can I log in with my phone number or NIN?',
    answer:
      'Yes. Once your phone number or 11-digit NIN is saved to your profile, you can use either to sign in instead of typing your email. You can still use email at any time.',
  },
  {
    question: 'What does Selorah Pro add?',
    answer:
      'Pro is ₦5,000 a year. It unlocks up to 10 emergency contacts, priority record verification, family sharing, ad-free use and early access to research rewards.',
  },
  {
    question: 'Is Selorah available across Africa?',
    answer:
      'We are starting in Nigeria and building for the continent. Join the waitlist and we will tell you the moment your city is live.',
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
  return (
    <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-[#6183FF]">
      {children}
    </p>
  );
}

function ProblemSection() {
  const [active, setActive] = useState(1);

  return (
    <section className="bg-white px-5 py-16 sm:px-8 sm:py-20 md:py-24 lg:px-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 max-w-3xl sm:mb-14">
          <SectionLabel>The problem</SectionLabel>
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
                className={`group relative flex flex-col overflow-hidden rounded-3xl border p-6 text-left transition-all duration-300 sm:p-7 ${
                  isActive
                    ? 'border-[#6183FF] bg-[#6183FF] text-white shadow-xl shadow-[#6183FF]/20'
                    : 'border-gray-100 bg-[#F8F9FA] text-[#101217] hover:border-[#6183FF]/30'
                }`}
              >
                <span
                  className={`flex h-11 w-11 items-center justify-center rounded-2xl transition-colors ${
                    isActive ? 'bg-white/15 text-white' : 'bg-white text-[#6183FF] shadow-sm'
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
          <SectionLabel>How it works</SectionLabel>
          <h2 className="text-3xl font-bold tracking-tight text-[#101217] sm:text-4xl md:text-[2.75rem]">
            THREE STEPS.
            <br />
            <span className="text-[#6183FF]">YOU STAY IN CONTROL.</span>
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
                    className={`relative z-10 flex flex-col gap-3 rounded-2xl px-4 py-5 transition-all duration-300 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-6 sm:py-6 ${
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
                        isHovered ? 'bg-[#6183FF] text-white' : 'bg-gray-100 text-gray-500'
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
                    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl">
                      <div className="flex items-center gap-1.5 border-b border-gray-100 bg-gray-50 px-4 py-2.5">
                        <span className="h-2.5 w-2.5 rounded-full bg-[#FF5F57]" />
                        <span className="h-2.5 w-2.5 rounded-full bg-[#FEBC2E]" />
                        <span className="h-2.5 w-2.5 rounded-full bg-[#28C840]" />
                      </div>
                      <div className="grid min-h-[140px] grid-cols-2">
                        <div className="flex flex-col items-center justify-center gap-2.5 bg-[#6183FF]/8 p-5">
                          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#6183FF]">
                            <Icon className="h-7 w-7 text-white" />
                          </div>
                          <p className="text-center text-sm font-bold leading-tight text-[#6183FF]">
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

  return (
    <section
      id="ownership"
      className="scroll-mt-24 bg-[#020924] px-5 py-16 text-white sm:px-8 sm:py-20 md:py-24 lg:px-10"
    >
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 flex flex-col justify-between gap-6 sm:mb-16 md:flex-row md:items-end">
          <h2 className="max-w-lg text-3xl font-bold leading-tight tracking-tight sm:text-4xl md:text-[2.75rem]">
            OWNERSHIP YOU <span className="text-[#6183FF]">CAN FEEL</span>
          </h2>
          <p className="max-w-sm text-base leading-relaxed text-white/50 sm:text-lg">
            Why Selorah exists, and why the timing matters for patients across Africa.
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
                className={`rounded-2xl border p-6 transition-all duration-300 sm:p-7 ${
                  isHovered
                    ? 'border-[#6183FF] bg-[#6183FF] shadow-xl shadow-[#6183FF]/30'
                    : 'border-white/10 bg-white/5'
                }`}
              >
                <Icon
                  className={`mb-4 h-7 w-7 ${isHovered ? 'text-white' : 'text-[#6183FF]'}`}
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

  return (
    <section
      id="faq"
      className="scroll-mt-24 border-t border-gray-100 bg-white px-5 py-16 sm:px-8 sm:py-20 md:py-24 lg:px-10"
    >
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
        <div>
          <SectionLabel>Questions</SectionLabel>
          <h2 className="text-3xl font-bold tracking-tight text-[#101217] sm:text-4xl md:text-[2.75rem]">
            Frequently asked
          </h2>
          <p className="mt-4 max-w-sm text-sm font-medium leading-relaxed text-gray-500 sm:text-base">
            Still unsure? Tell us what is on your mind when you join the waitlist and we will
            answer directly.
          </p>
        </div>

        <div className="divide-y divide-gray-100 border-y border-gray-100">
          {FAQS.map((item, index) => {
            const isOpen = openIndex === index;
            return (
              <div key={item.question}>
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  aria-expanded={isOpen}
                  className="flex w-full items-start justify-between gap-4 py-5 text-left transition-colors hover:text-[#6183FF] sm:py-6"
                >
                  <span
                    className={`text-sm font-bold leading-snug sm:text-base ${
                      isOpen ? 'text-[#6183FF]' : 'text-[#101217]'
                    }`}
                  >
                    {item.question}
                  </span>
                  <span
                    className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-colors ${
                      isOpen ? 'bg-[#6183FF] text-white' : 'bg-gray-50 text-gray-400'
                    }`}
                  >
                    {isOpen ? (
                      <MinusIcon className="h-3.5 w-3.5" strokeWidth={2.5} />
                    ) : (
                      <PlusIcon className="h-3.5 w-3.5" strokeWidth={2.5} />
                    )}
                  </span>
                </button>
                <div
                  className={`grid transition-all duration-300 ease-out ${
                    isOpen ? 'grid-rows-[1fr] pb-6 opacity-100' : 'grid-rows-[0fr] opacity-0'
                  }`}
                >
                  <div className="overflow-hidden">
                    <p className="max-w-xl pr-8 text-sm leading-relaxed text-gray-500">
                      {item.answer}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function FounderSection() {
  return (
    <section className="relative overflow-hidden bg-[#F8F9FA] px-5 py-16 sm:px-8 sm:py-20 md:py-24 lg:px-10">
      <div
        aria-hidden
        className="pointer-events-none absolute -left-32 top-1/2 h-80 w-80 -translate-y-1/2 rounded-full bg-[#6183FF]/10 blur-3xl"
      />
      <div className="relative mx-auto max-w-6xl">
        <div className="mb-10 flex flex-col gap-4 sm:mb-14 md:flex-row md:items-end md:justify-between">
          <div>
            <SectionLabel>The founder</SectionLabel>
            <h2 className="text-3xl font-bold tracking-tight text-[#101217] sm:text-4xl md:text-[2.75rem]">
              MEET <span className="text-[#6183FF]">SAMUEL</span>
            </h2>
          </div>
          <p className="max-w-sm text-sm font-medium leading-relaxed text-gray-500">
            One record. Every hospital. Built so patients stop starting over.
          </p>
        </div>

        <div className="grid gap-5 lg:grid-cols-12">
          <div className="relative overflow-hidden rounded-[32px] bg-[#020924] lg:col-span-5">
            <div className="relative aspect-[4/5] w-full sm:aspect-[5/4] lg:aspect-[4/5]">
              <img
                src="/landing/team-samuel.png"
                alt="Samuel Amanze, Founder of Selorah Health"
                width={640}
                height={800}
                decoding="async"
                fetchPriority="high"
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#020924] via-[#020924]/20 to-transparent" />
            </div>
            <div className="absolute inset-x-0 bottom-0 p-6 sm:p-7">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#5FFAB0]">
                Founder and CEO
              </p>
              <h3 className="mt-1 text-2xl font-bold text-white sm:text-3xl">Samuel Amanze</h3>
              <p className="mt-1 text-xs font-semibold text-white/50">Selorah Health</p>
            </div>
          </div>

          <div className="flex flex-col justify-between gap-8 rounded-[32px] border border-gray-100 bg-white p-6 shadow-sm sm:p-9 lg:col-span-7 lg:p-10">
            <div>
              <p className="text-xl font-semibold leading-relaxed tracking-tight text-[#101217] sm:text-2xl">
                &ldquo;No one should have to carry a folder of paper to prove their own medical
                history.&rdquo;
              </p>
              <p className="mt-5 text-sm leading-relaxed text-gray-500 sm:text-base">
                Samuel is building Selorah Health so patients across Africa can own, carry, and
                share their health records on their own terms. Not time-bound cards, not
                duplicated tests, and not paper folders that never move with them.
              </p>
              <p className="mt-4 text-sm leading-relaxed text-gray-500 sm:text-base">
                The vision is simple: your health story should follow you everywhere, and only you
                decide who gets to read it.
              </p>
            </div>

            <div className="grid gap-3 border-t border-gray-100 pt-6 sm:grid-cols-3">
              {[
                { value: '1', label: 'record you own' },
                { value: '3', label: 'steps to share' },
                { value: '0', label: 'data ever sold' },
              ].map((stat) => (
                <div key={stat.label}>
                  <p className="text-2xl font-bold tracking-tight text-[#6183FF]">{stat.value}</p>
                  <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-400">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <a
                href="https://www.linkedin.com/in/thedesigngm"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Samuel Amanze on LinkedIn"
                className="flex min-h-[44px] items-center gap-2 rounded-full border border-gray-200 bg-white px-4 text-xs font-bold text-[#101217] transition-colors hover:border-[#6183FF]/40 hover:text-[#6183FF]"
              >
                <svg className="h-4 w-4 text-[#6183FF]" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 9H1.778V20.452H5.337V9zM3.557 1.018c1.144 0 2.063.926 2.063 2.065 0 1.138-.92 2.063-2.063 2.063-1.14 0-2.064-.925-2.064-2.063 0-1.139.925-2.065 2.064-2.065zm1.782 17.434H1.778V9h3.561v9.452z" />
                </svg>
                LinkedIn
              </a>
              <a
                href="https://x.com/thedesigngm"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Samuel Amanze on X"
                className="flex min-h-[44px] items-center gap-2 rounded-full border border-gray-200 bg-white px-4 text-xs font-bold text-[#101217] transition-colors hover:border-[#6183FF]/40 hover:text-[#6183FF]"
              >
                <svg className="h-4 w-4 text-[#6183FF]" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.722-8.829L1.254 2.25H8.08l4.253 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
                </svg>
                X / Twitter
              </a>
              <span className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-400">
                <CheckCircleIcon className="h-3.5 w-3.5 text-[#5FFAB0]" />
                Building in public
              </span>
            </div>
          </div>
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
    <div className="min-h-screen overflow-x-hidden bg-[var(--background)] font-sans text-[var(--foreground)] selection:bg-primary/30 selection:text-primary">
      <SEOTitle title="The OS for Health Records" />
      <ProgressBar />
      <Header />

      <section
        ref={heroRef}
        className="relative flex min-h-[100svh] w-full items-center overflow-hidden bg-black pt-16 sm:pt-20"
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
              Health records for Africa
            </div>
            <h1 className="mb-5 text-4xl font-bold uppercase leading-[1.05] tracking-tighter text-white sm:mb-6 sm:text-5xl md:text-6xl lg:text-[4.25rem]">
              Tired of having to
              <br className="hidden sm:block" /> start from zero?
            </h1>
            <p className="mx-auto mb-8 max-w-xl text-base leading-relaxed text-white/75 sm:mb-10 sm:text-lg md:text-xl">
              Repeating the same tests and buying new cards at every hospital? Selorah gives you
              complete ownership of your medical records.
            </p>
            <div className="mb-8">
              <CTAButton size="lg" onClick={() => openWaitlist('patient', 'hero')}>
                Join The Waitlist
              </CTAButton>
            </div>
            <div className="flex items-center gap-3">
              <img
                src="/landing/hero-avatar.png"
                alt="People joining Selorah"
                width={280}
                height={40}
                decoding="async"
                fetchPriority="high"
                className="h-9 w-auto max-w-[200px] object-contain sm:h-11 sm:max-w-none"
              />
              <span className="text-xs text-white/60 sm:text-sm">Join 50+ on the waitlist</span>
            </div>
          </div>
        </div>
      </section>

      <ProblemSection />
      <HowItWorksSection />
      <OwnershipSection />
      <FaqSection />
      <FounderSection />

      <section className="bg-[var(--background)] px-5 py-16 sm:px-8 sm:py-20 lg:px-10">
        <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
          <SectionLabel>Waitlist</SectionLabel>
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-[#101217] sm:text-4xl md:text-5xl">
            JOIN THE WAITLIST!
          </h2>
          <p className="mb-8 max-w-lg text-base text-muted sm:text-lg">
            Get early access to health record ownership across Africa.
          </p>
          <CTAButton size="lg" onClick={() => openWaitlist('patient', 'final-cta')}>
            Join The Waitlist
          </CTAButton>
        </div>
      </section>

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
  );
}
