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
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import WaitlistModal, { type WaitlistRole } from '../components/WaitlistModal';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SEOTitle from '../components/SEOTitle';
import CTAButton from '../components/CTAButton';

const PROBLEM_CARDS = [
  {
    title: 'Records do not move with patients',
    body: 'Every new hospital means starting over: tests, history, and time already spent. Your file stays behind.',
    icon: FolderOpenIcon,
  },
  {
    title: 'Doctors treating patients with incomplete information',
    body: 'Without a portable record, providers re-test or delay care when minutes matter most.',
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
    detailBody: 'Create a single-use or time-bound QR. The clinic scans and sees only authorised records.',
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

const TEAM = [
  {
    name: 'Ibadat',
    role: 'Founder',
    image: '/landing/team-ibadat.webp',
  },
  {
    name: 'Idris Azeez',
    role: 'Engineering',
    image: '/landing/team-idris.jpg',
  },
  {
    name: 'Samuel Amanze',
    role: 'Product & Design',
    image: '/landing/team-samuel.png',
  },
  {
    name: 'Afolabi Olanrewaju',
    role: 'Growth',
    image: '/landing/team-afolabi.jpg',
  },
];

function ProgressBar() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const pct = docHeight > 0 ? Math.min(100, (scrollTop / docHeight) * 100) : 0;
      setProgress(pct);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 z-[60] h-[3px] bg-transparent pointer-events-none">
      <div
        className="h-full bg-[#5FFAB0] transition-[width] duration-150 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

function ProblemSection() {
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <section className="bg-white py-16 sm:py-20 md:py-24 px-4 sm:px-6 lg:px-12">
      <div className="max-w-7xl mx-auto">
        <div className="mb-10 sm:mb-14">
          <p className="text-[#6183FF] font-bold tracking-wider text-sm mb-3 uppercase">
            The Problem
          </p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold max-w-3xl leading-tight text-[#101217]">
            Patients always have to start from zero whenever they go to a new hospital or change
            their location.
          </h2>
        </div>

        {/* Flex row so we can animate widths */}
        <div className="flex flex-col md:flex-row gap-4 sm:gap-5">
          {PROBLEM_CARDS.map((card, i) => {
            const Icon = card.icon;
            const isHovered = hovered === i;
            const isAnyHovered = hovered !== null;

            // Width logic: hovered → ~2/3, others → ~0.5/3, none → equal
            let widthClass = 'md:flex-[1_1_0%]';
            if (isAnyHovered) {
              widthClass = isHovered ? 'md:flex-[2_1_0%]' : 'md:flex-[0.5_1_0%]';
            }

            return (
              <div
                key={card.title}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
                className={`
                  relative overflow-hidden rounded-2xl p-6 sm:p-8 cursor-default
                  transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]
                  ${widthClass}
                  ${isHovered ? 'bg-[#6183FF] text-white shadow-xl' : 'bg-[#F8F9FA] text-[#101217]'}
                `}
              >
                <div className="flex flex-col h-full min-h-[200px]">
                  <div className="flex items-start gap-3 mb-4">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors duration-300 ${
                        isHovered ? 'bg-white/20' : 'bg-[#6183FF]/10'
                      }`}
                    >
                      <Icon
                        className={`w-5 h-5 ${isHovered ? 'text-white' : 'text-[#6183FF]'}`}
                        strokeWidth={1.8}
                      />
                    </div>
                    <h3
                      className={`text-lg sm:text-xl font-bold leading-snug transition-colors duration-300 ${
                        isHovered ? 'text-white' : 'text-[#101217]'
                      }`}
                    >
                      {card.title}
                    </h3>
                  </div>

                  <p
                    className={`text-sm sm:text-base leading-relaxed transition-all duration-300 ${
                      isHovered
                        ? 'text-white/90 opacity-100 max-h-40'
                        : 'text-muted opacity-80 max-h-24 overflow-hidden'
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

function HowItWorksSection() {
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <section id="how-it-works" className="scroll-mt-24">
      {/* Header band – matches Problem section white */}
      <div className="bg-white pt-16 sm:pt-20 md:pt-24 pb-10 px-4 sm:px-6 lg:px-12">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-[#6183FF] font-bold tracking-wider text-sm mb-3 uppercase">
            How it works
          </p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-[#101217]">
            THREE STEPS.{' '}
            <span className="text-[#6183FF]">YOU STAY IN CONTROL.</span>
          </h2>
        </div>
      </div>

      {/* Cards – sit on page background */}
      <div className="bg-[var(--background)] pb-16 sm:pb-20 md:pb-24 px-4 sm:px-6 lg:px-12">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6 relative">
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
                  {/* Main step card */}
                  <div
                    className={`
                      relative z-10 rounded-2xl p-6 sm:p-8 border transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]
                      ${
                        isHovered
                          ? 'bg-[#020924] border-[#020924] text-white shadow-2xl -translate-y-1'
                          : 'bg-[var(--background)] border-[var(--border)] text-[#101217]'
                      }
                    `}
                  >
                    <div className="flex items-center justify-between mb-5">
                      <span
                        className={`text-2xl font-bold tracking-tight ${
                          isHovered ? 'text-white/40' : 'text-[#6183FF]/40'
                        }`}
                      >
                        {step.n}
                      </span>
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 ${
                          isHovered ? 'bg-[#6183FF] text-white' : 'bg-[#6183FF]/10 text-[#6183FF]'
                        }`}
                      >
                        <ArrowUpRightIcon className="w-4 h-4" strokeWidth={2.5} />
                      </div>
                    </div>
                    <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                    <p
                      className={`text-sm leading-relaxed ${
                        isHovered ? 'text-white/70' : 'text-muted'
                      }`}
                    >
                      {step.body}
                    </p>
                  </div>

                  {/* Floating detail card */}
                  <div
                    className={`
                      absolute left-1/2 -translate-x-1/2 bottom-full mb-3 w-[280px] sm:w-[300px] z-20
                      transition-all duration-400 ease-[cubic-bezier(0.22,1,0.36,1)]
                      ${
                        isHovered
                          ? 'opacity-100 translate-y-0 pointer-events-auto'
                          : 'opacity-0 translate-y-3 pointer-events-none'
                      }
                    `}
                  >
                    <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
                      {/* Traffic-light dots */}
                      <div className="flex items-center gap-1.5 px-4 py-2.5 bg-gray-50 border-b border-gray-100">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]" />
                        <span className="w-2.5 h-2.5 rounded-full bg-[#FEBC2E]" />
                        <span className="w-2.5 h-2.5 rounded-full bg-[#28C840]" />
                      </div>

                      {/* Grid: image | icon + text */}
                      <div className="grid grid-cols-2 gap-0">
                        <div className="bg-gray-50 p-3 flex items-center justify-center">
                          <img
                            src={step.image}
                            alt={step.title}
                            className="w-full h-auto max-h-28 object-contain"
                            loading="lazy"
                          />
                        </div>
                        <div className="p-4 flex flex-col justify-center">
                          <div className="w-8 h-8 rounded-lg bg-[#6183FF]/10 flex items-center justify-center mb-2">
                            <Icon className="w-4 h-4 text-[#6183FF]" />
                          </div>
                          <p className="text-xs font-bold text-gray-900 mb-1">{step.detailTitle}</p>
                          <p className="text-[11px] text-gray-500 leading-snug">{step.detailBody}</p>
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
      className="bg-[#020924] text-white py-16 sm:py-20 md:py-24 px-4 sm:px-6 lg:px-12 scroll-mt-24"
    >
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight max-w-lg">
            OWNERSHIP YOU{' '}
            <span className="text-[#6183FF]">CAN FEEL</span>
          </h2>
          <p className="text-white/50 text-base sm:text-lg max-w-sm">
            Why Selorah exists, and why the timing matters for patients across Africa.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
          {OWNERSHIP_CARDS.map((card, i) => {
            const Icon = card.icon;
            const isHovered = hovered === i;
            return (
              <div
                key={card.title}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
                className={`
                  rounded-2xl p-6 sm:p-8 border transition-all duration-400 ease-out
                  ${
                    isHovered
                      ? 'bg-[#6183FF] border-[#6183FF] shadow-xl shadow-[#6183FF]/30'
                      : 'bg-white/5 border-white/10'
                  }
                `}
              >
                <Icon
                  className={`w-8 h-8 mb-4 ${isHovered ? 'text-white' : 'text-[#6183FF]'}`}
                  strokeWidth={1.6}
                />
                <h3 className="text-lg sm:text-xl font-bold mb-3">{card.title}</h3>
                <p className={`text-sm sm:text-base leading-relaxed ${isHovered ? 'text-white/90' : 'text-white/60'}`}>
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

function TeamSection() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [isHovering, setIsHovering] = useState(false);
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const autoScrollRef = useRef<number | null>(null);

  // Auto horizontal scroll when not hovering
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const step = () => {
      if (isHovering) return;
      track.scrollLeft += 0.6;
      // Loop
      if (track.scrollLeft >= track.scrollWidth - track.clientWidth - 2) {
        track.scrollLeft = 0;
      }
    };

    autoScrollRef.current = window.setInterval(step, 20);
    return () => {
      if (autoScrollRef.current) clearInterval(autoScrollRef.current);
    };
  }, [isHovering]);

  const scrollByCard = (dir: 1 | -1) => {
    const track = trackRef.current;
    if (!track) return;
    const cardWidth = track.querySelector('[data-team-card]')?.clientWidth ?? 280;
    track.scrollBy({ left: dir * (cardWidth + 20), behavior: 'smooth' });
  };

  return (
    <section className="bg-white py-16 sm:py-20 md:py-24 px-4 sm:px-6 lg:px-12 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10 sm:mb-14">
          <div>
            <p className="text-[#6183FF] font-bold tracking-wider text-sm mb-3 uppercase">
              The Team
            </p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#101217]">
              MEET THE CREATIVE{' '}
              <span className="text-[#6183FF]">DRIVEN TEAM</span>
            </h2>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => scrollByCard(-1)}
              className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
              aria-label="Previous"
            >
              <ChevronLeftIcon className="w-5 h-5 text-gray-700" />
            </button>
            <button
              type="button"
              onClick={() => scrollByCard(1)}
              className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
              aria-label="Next"
            >
              <ChevronRightIcon className="w-5 h-5 text-gray-700" />
            </button>
          </div>
        </div>

        <div
          ref={trackRef}
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => {
            setIsHovering(false);
            setHoveredCard(null);
          }}
          className="flex gap-5 overflow-x-auto scrollbar-hide pb-4 -mx-4 px-4 sm:mx-0 sm:px-0"
          style={{ scrollBehavior: 'auto' }}
        >
          {TEAM.map((member, i) => {
            const isCardHovered = hoveredCard === i;
            return (
              <div
                key={member.name}
                data-team-card
                onMouseEnter={() => setHoveredCard(i)}
                onMouseLeave={() => setHoveredCard(null)}
                className={`
                  relative shrink-0 rounded-2xl overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]
                  ${isCardHovered ? 'w-[220px] h-[340px]' : 'w-[260px] h-[300px]'}
                `}
              >
                <img
                  src={member.image}
                  alt={member.name}
                  className="absolute inset-0 w-full h-full object-cover"
                  loading="lazy"
                />
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                {/* Glassy name plate */}
                <div
                  className={`
                    absolute bottom-4 left-4 right-4 rounded-xl px-4 py-3
                    backdrop-blur-md bg-white/15 border border-white/20
                    transition-all duration-400
                    ${isCardHovered ? 'bg-white/25' : ''}
                  `}
                >
                  <p className="text-white font-bold text-sm leading-tight">{member.name}</p>
                  <p className="text-white/70 text-xs mt-0.5">{member.role}</p>
                </div>
              </div>
            );
          })}
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

      {/* ===================== HERO ===================== */}
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

        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-12 pt-8 sm:pt-12 pb-20 sm:pb-24 text-center flex flex-col items-center">
          <div className="max-w-3xl w-full flex flex-col items-center">
            {/* Eyebrow – transparent pill */}
            <div className="inline-flex items-center gap-2 bg-transparent border border-white/30 rounded-full px-4 py-1.5 text-xs sm:text-sm font-medium text-white mb-6 sm:mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-[#5FFAB0] shrink-0" aria-hidden />
              Health records for Africa
            </div>

            {/* Heading – bold, larger, matches design */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-[4.5rem] font-bold leading-[1.05] tracking-tighter text-white mb-5 sm:mb-6 uppercase">
              Tired of having to
              <br className="hidden sm:block" /> start from zero?
            </h1>

            <p className="text-base sm:text-lg md:text-xl text-white/75 max-w-xl leading-relaxed mb-8 sm:mb-10 mx-auto">
              Tired of repeating same tests, buying cards each time you visit a new hospital?
              Selorah gives you complete ownership of your medical records.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center w-full sm:w-auto mb-8">
              <CTAButton size="lg" onClick={() => openWaitlist('patient', 'hero')}>
                Join The Waitlist
              </CTAButton>
            </div>

            {/* Avatar row */}
            <div className="flex items-center gap-3">
              <img
                src="/landing/hero-avatar.png"
                alt="People joining Selorah"
                className="h-8 sm:h-10 w-auto"
                loading="lazy"
              />
              <span className="text-white/60 text-xs sm:text-sm">Join 2,000+ on the waitlist</span>
            </div>
          </div>
        </div>
      </section>

      {/* ===================== PROBLEM ===================== */}
      <ProblemSection />

      {/* ===================== HOW IT WORKS ===================== */}
      <HowItWorksSection />

      {/* ===================== OWNERSHIP / BENEFITS ===================== */}
      <OwnershipSection />

      {/* ===================== TEAM ===================== */}
      <TeamSection />

      {/* ===================== FINAL CTA ===================== */}
      <section className="bg-[var(--background)] py-16 sm:py-20 px-4 sm:px-6 lg:px-12">
        <div className="max-w-3xl mx-auto text-center flex flex-col items-center">
          <p className="text-[#6183FF] font-bold tracking-wider text-sm mb-3 uppercase">
            Waitlist
          </p>
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

      {/* Sticky mobile CTA */}
      {showStickyCta && (
        <div className="sm:hidden fixed bottom-0 inset-x-0 z-40 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] bg-white/95 backdrop-blur-md border-t border-gray-100 shadow-[0_-8px_30px_rgba(0,0,0,0.08)]">
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
