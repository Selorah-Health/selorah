import { useState, useEffect, useRef } from 'react';
import {
  DocumentTextIcon,
  QrCodeIcon,
  HandRaisedIcon,
  FolderOpenIcon,
  UserGroupIcon,
  HeartIcon,
  LockClosedIcon,
  NoSymbolIcon,
  ShieldCheckIcon,
  ArrowUpRightIcon,
} from '@heroicons/react/24/outline';
import WaitlistModal, { type WaitlistRole } from '../components/WaitlistModal';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SEOTitle from '../components/SEOTitle';
import CTAButton from '../components/CTAButton';

const PROBLEM_CARDS = [
  {
    title: 'Records do not move with patients',
    body: 'This is meant to be a descriptive text paragraph that would further explain the problem title above. But in the meantime, feast on this: "Lorem ipsum dot alur venie ment sh d to ahtgw dhyr a fijje ritOe a cjujr toe forue ment itoleal nhejkot opyef."',
    icon: FolderOpenIcon,
  },
  {
    title: 'Doctors treating patients with incomplete information',
    body: 'Without a portable record, providers re-test or delay care when minutes matter most. Context is lost at every handoff.',
    icon: UserGroupIcon,
  },
  {
    title: 'Pregnant women pay a higher price',
    body: 'Critical history is scattered. Missed context during pregnancy can cost lives and money.',
    icon: HeartIcon,
  },
];

const HOW_STEPS = [
  {
    n: '01',
    title: 'Save your records',
    body: 'Keep key history in one place on your phone, not scattered across hospital counters.',
    icon: DocumentTextIcon,
    image: '/landing/steps-1.png',
    detailTitle: 'Encrypted vault',
    detailBody: 'Upload lab results, prescriptions and notes. Everything is encrypted end-to-end.',
  },
  {
    n: '02',
    title: 'Share with a code',
    body: 'When a clinic needs access, you show a time-limited code or link. Only what you allow.',
    icon: QrCodeIcon,
    image: '/landing/steps-2.png',
    detailTitle: 'Generate QR Code',
    detailBody:
      'When a clinic needs access, you generate a time-limited or allow them to scan your medical card. They only get access to what you allow.',
  },
  {
    n: '03',
    title: 'Revoke anytime',
    body: 'Access ends when you say so. Your story does not live on their desk forever.',
    icon: HandRaisedIcon,
    image: '/landing/steps-3.png',
    detailTitle: 'Instant revoke',
    detailBody: 'One tap ends access. The audit log remains so you always know who saw what.',
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
    <div className="fixed top-0 left-0 right-0 z-[60] h-[3px] bg-transparent pointer-events-none">
      <div className="h-full bg-[#5FFAB0] transition-[width] duration-150 ease-out" style={{ width: `${progress}%` }} />
    </div>
  );
}

function ProblemSection() {
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <section className="bg-white py-16 sm:py-20 md:py-24 px-5 sm:px-8 lg:px-10">
      <div className="max-w-6xl mx-auto">
        <div className="mb-10 sm:mb-14">
          <p className="text-[#6183FF] font-bold tracking-wider text-sm mb-3 uppercase">The Problem</p>
          <h2 className="text-3xl sm:text-4xl md:text-[2.75rem] font-bold max-w-3xl leading-tight text-[#101217]">
            Patients always have to start from zero whenever they go to a new hospital or change their location.
          </h2>
        </div>

        <div className="flex flex-col md:flex-row gap-4 sm:gap-5">
          {PROBLEM_CARDS.map((card, i) => {
            const Icon = card.icon;
            const isHovered = hovered === i;
            const isAnyHovered = hovered !== null;
            const flexClass = isAnyHovered
              ? isHovered
                ? 'md:flex-[2_1_0%]'
                : 'md:flex-[0.5_1_0%]'
              : 'md:flex-[1_1_0%]';

            return (
              <div
                key={card.title}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
                className={`
                  relative overflow-hidden rounded-2xl p-6 sm:p-7 cursor-default
                  transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]
                  ${flexClass}
                  ${isHovered ? 'bg-[#6183FF] text-white shadow-xl' : 'bg-[#F8F9FA] text-[#101217]'}
                `}
              >
                {/* Default: icon top, title bottom. Hovered: icon + title same line */}
                <div
                  className={`flex h-full min-h-[150px] md:min-h-[170px] transition-all duration-400 ${
                    isHovered ? 'flex-col' : 'flex-col justify-between'
                  }`}
                >
                  {/* Icon row */}
                  <div className={`flex items-center gap-3 ${isHovered ? 'mb-3' : ''}`}>
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-colors duration-300 ${
                        isHovered ? 'bg-white/25' : 'bg-transparent border-2 border-[#6183FF]/50'
                      }`}
                    >
                      {isHovered ? (
                        <span className="w-3.5 h-3.5 rounded-full bg-white" />
                      ) : (
                        <Icon className="w-4 h-4 text-[#6183FF]" strokeWidth={1.8} />
                      )}
                    </div>

                    {/* Title moves next to icon on hover */}
                    {isHovered && (
                      <h3 className="text-base sm:text-lg font-bold leading-snug text-white">
                        {card.title}
                      </h3>
                    )}
                  </div>

                  {/* Title at bottom when NOT hovered */}
                  {!isHovered && (
                    <h3 className="text-base sm:text-lg font-bold leading-snug text-gray-600 mt-auto">
                      {card.title}
                    </h3>
                  )}

                  {/* Body only on hover */}
                  <p
                    className={`text-sm leading-relaxed transition-all duration-400 overflow-hidden ${
                      isHovered ? 'text-white/90 opacity-100 max-h-48 mt-1' : 'opacity-0 max-h-0'
                    }`}
                  >
                    {card.body}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  How It Works — vertical rows. Floating card sits ON TOP of row.   */
/* ------------------------------------------------------------------ */

function HowItWorksSection() {
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <section id="how-it-works" className="scroll-mt-24">
      <div className="bg-white pt-16 sm:pt-20 md:pt-24 pb-8 px-5 sm:px-8 lg:px-10">
        <div className="max-w-6xl mx-auto">
          <p className="text-[#6183FF] font-bold tracking-wider text-sm mb-3 uppercase">How it works</p>
          <h2 className="text-3xl sm:text-4xl md:text-[2.75rem] font-bold tracking-tight text-[#101217]">
            THREE STEPS.
            <br />
            <span className="text-[#6183FF]">YOU STAY IN CONTROL.</span>
          </h2>
        </div>
      </div>

      <div className="bg-[var(--background)] pb-16 sm:pb-20 md:pb-24 px-5 sm:px-8 lg:px-10">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col relative">
            {HOW_STEPS.map((step, i) => {
              const Icon = step.icon;
              const isHovered = hovered === i;

              return (
                <div
                  key={step.n}
                  className="relative"
                  onMouseEnter={() => setHovered(i)}
                  onMouseLeave={() => setHovered(null)}
                >
                  {/* Row */}
                  <div
                    className={`
                      relative z-10 flex items-center justify-between gap-4 py-5 sm:py-6 px-4 sm:px-6
                      border-b border-[var(--border)] transition-all duration-400 ease-[cubic-bezier(0.22,1,0.36,1)]
                      ${isHovered ? 'bg-[#020924] text-white rounded-xl border-transparent my-1 shadow-xl' : 'bg-transparent text-[#101217]'}
                    `}
                  >
                    <div className="flex items-center gap-4 sm:gap-6 min-w-0">
                      <span
                        className={`text-lg sm:text-xl font-bold tracking-tight shrink-0 w-8 ${
                          isHovered ? 'text-white/40' : 'text-gray-400'
                        }`}
                      >
                        {step.n}
                      </span>
                      <h3 className="text-lg sm:text-xl font-bold truncate">{step.title}</h3>
                    </div>
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 ${
                        isHovered ? 'bg-[#6183FF] text-white' : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      <ArrowUpRightIcon className="w-4 h-4" strokeWidth={2.5} />
                    </div>
                  </div>

                  {/* Floating card — sits ON TOP of the hovered row (centered over it) */}
                  <div
                    className={`
                      absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-30
                      w-[340px] sm:w-[400px]
                      transition-all duration-400 ease-[cubic-bezier(0.22,1,0.36,1)]
                      ${isHovered ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'}
                    `}
                  >
                    <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
                      <div className="flex items-center gap-1.5 px-4 py-2.5 bg-gray-50 border-b border-gray-100">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]" />
                        <span className="w-2.5 h-2.5 rounded-full bg-[#FEBC2E]" />
                        <span className="w-2.5 h-2.5 rounded-full bg-[#28C840]" />
                      </div>
                      <div className="grid grid-cols-2 gap-0 min-h-[140px]">
                        <div className="bg-[#6183FF]/8 p-5 flex flex-col items-center justify-center gap-2.5">
                          <div className="w-14 h-14 rounded-xl bg-[#6183FF] flex items-center justify-center">
                            <Icon className="w-7 h-7 text-white" />
                          </div>
                          <p className="text-sm font-bold text-[#6183FF] text-center leading-tight">
                            {step.detailTitle}
                          </p>
                        </div>
                        <div className="p-5 flex flex-col justify-center">
                          <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
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
    <section id="ownership" className="bg-[#020924] text-white py-16 sm:py-20 md:py-24 px-5 sm:px-8 lg:px-10 scroll-mt-24">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-[2.75rem] font-bold leading-tight max-w-lg">
            OWNERSHIP YOU <span className="text-[#6183FF]">CAN FEEL</span>
          </h2>
          <p className="text-white/50 text-base sm:text-lg max-w-sm">
            Why Selorah exists, and why the timing matters for patients across Africa.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {OWNERSHIP_CARDS.map((card, i) => {
            const Icon = card.icon;
            const isHovered = hovered === i;
            return (
              <div
                key={card.title}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
                className={`rounded-2xl p-6 sm:p-7 border transition-all duration-400 ease-out ${
                  isHovered
                    ? 'bg-[#6183FF] border-[#6183FF] shadow-xl shadow-[#6183FF]/30'
                    : 'bg-white/5 border-white/10'
                }`}
              >
                <Icon className={`w-7 h-7 mb-4 ${isHovered ? 'text-white' : 'text-[#6183FF]'}`} strokeWidth={1.6} />
                <h3 className="text-lg font-bold mb-2">{card.title}</h3>
                <p className={`text-sm leading-relaxed ${isHovered ? 'text-white/90' : 'text-white/60'}`}>{card.body}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* Team: fit width, auto-slide, stop on hover, grayscale default, color on hover, arrows bottom */
function TeamSection() {
  return (
    <section className="bg-white py-16 sm:py-20 md:py-24 px-5 sm:px-8 lg:px-10">
      <div className="max-w-6xl mx-auto">
        <div className="mb-10 sm:mb-12">
          <p className="text-[#6183FF] font-bold tracking-wider text-sm mb-3 uppercase">The Founder</p>
          <h2 className="text-3xl sm:text-4xl md:text-[2.75rem] font-bold text-[#101217]">
            MEET THE <span className="text-[#6183FF]">FOUNDER</span>
          </h2>
        </div>

        <div className="flex flex-col md:flex-row items-start gap-8 md:gap-12">
          <div className="w-full md:w-[min(100%,320px)] shrink-0">
            <div className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-gray-100">
              <img
                src="/landing/team-samuel.png"
                alt="Samuel Amanze, Founder of Selorah Health"
                width={640}
                height={800}
                decoding="async"
                fetchPriority="high"
                className="absolute inset-0 w-full h-full object-cover"
              />
            </div>
          </div>

          <div className="flex flex-col justify-center flex-1 pt-0 md:pt-2">
            <h3 className="text-2xl sm:text-3xl font-bold text-[#101217] mb-1">Samuel Amanze</h3>
            <p className="text-[#6183FF] font-semibold text-sm sm:text-base mb-5">Founder, Selorah Health</p>
            <p className="text-muted text-sm sm:text-base leading-relaxed mb-8 max-w-md">
              Samuel is building Selorah Health so patients across Africa can own, carry, and share their
              health records on their own terms; with time-bound access instead of paper folders
              that never move with them.
            </p>

            <div className="flex items-center gap-3">
              <a
                href="https://www.linkedin.com/in/thedesigngm"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Samuel Amanze on LinkedIn"
                className="w-11 h-11 rounded-full bg-[#6183FF]/10 hover:bg-[#6183FF]/20 flex items-center justify-center transition-colors"
              >
                <svg className="w-5 h-5 text-[#6183FF]" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 9H1.778V20.452H5.337V9zM3.557 1.018c1.144 0 2.063.926 2.063 2.065 0 1.138-.92 2.063-2.063 2.063-1.14 0-2.064-.925-2.064-2.063 0-1.139.925-2.065 2.064-2.065zm1.782 17.434H1.778V9h3.561v9.452z" />
                </svg>
              </a>
              <a
                href="https://x.com/thedesigngm"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Samuel Amanze on X"
                className="w-11 h-11 rounded-full bg-[#6183FF]/10 hover:bg-[#6183FF]/20 flex items-center justify-center transition-colors"
              >
                <svg className="w-4 h-4 text-[#6183FF]" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.722-8.829L1.254 2.25H8.08l4.253 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
                </svg>
              </a>
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
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] font-sans overflow-x-hidden selection:bg-primary/30 selection:text-primary">
      <SEOTitle title="The OS for Health Records" />
      <ProgressBar />
      <Header />

      <section
        ref={heroRef}
        className="relative w-full overflow-hidden bg-black min-h-[100svh] flex items-center pt-16 sm:pt-20"
      >
        <video
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster="/assets/hero-bg-image-1.jpg"
          className="absolute inset-0 w-full h-full object-cover opacity-40"
        >
          <source src="/assets/hero-bg-video-1.mp4" type="video/mp4" />
        </video>

        <div className="relative z-10 max-w-4xl mx-auto px-5 sm:px-8 lg:px-10 pt-8 sm:pt-12 pb-20 sm:pb-24 text-center flex flex-col items-center">
          <div className="max-w-3xl w-full flex flex-col items-center">
            <div className="inline-flex items-center gap-2 bg-transparent border border-white/30 rounded-full px-4 py-1.5 text-xs sm:text-sm font-medium text-white mb-6 sm:mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-[#5FFAB0] shrink-0" aria-hidden />
              Health records for Africa
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-[4.25rem] font-bold leading-[1.05] tracking-tighter text-white mb-5 sm:mb-6 uppercase">
              Tired of having to
              <br className="hidden sm:block" /> start from zero?
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-white/75 max-w-xl leading-relaxed mb-8 sm:mb-10 mx-auto">
              Tired of repeating same tests, buying cards each time you visit a new hospital?
              Selorah gives you complete ownership of your medical records.
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
                className="h-9 sm:h-11 w-auto max-w-[200px] sm:max-w-none object-contain"
              />
              <span className="text-white/60 text-xs sm:text-sm">Join 50+ on the waitlist</span>
            </div>
          </div>
        </div>
      </section>

      <ProblemSection />
      <HowItWorksSection />
      <OwnershipSection />
      <TeamSection />

      <section className="bg-[var(--background)] py-16 sm:py-20 px-5 sm:px-8 lg:px-10">
        <div className="max-w-3xl mx-auto text-center flex flex-col items-center">
          <p className="text-[#6183FF] font-bold tracking-wider text-sm mb-3 uppercase">Waitlist</p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#101217] mb-4 tracking-tight">
            JOIN THE WAITLIST!
          </h2>
          <p className="text-base sm:text-lg text-muted mb-8 max-w-lg">
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
        <div className="sm:hidden fixed bottom-0 inset-x-0 z-40 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] bg-white/95 backdrop-blur-md border-t border-gray-100 shadow-[0_-8px_30px_rgba(0,0,0,0.08)]">
          <CTAButton className="w-full justify-center" onClick={() => openWaitlist('patient', 'sticky-mobile')}>
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
