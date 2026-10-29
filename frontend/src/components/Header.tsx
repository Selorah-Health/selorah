import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowRightIcon,
  Bars3Icon,
  BeakerIcon,
  BuildingOffice2Icon,
  CheckCircleIcon,
  ChevronDownIcon,
  ShieldCheckIcon,
  UserCircleIcon,
  UserIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import WaitlistModal from './WaitlistModal';
import CTAButton from './CTAButton';
import ThemeToggle from './ThemeToggle';

interface HeaderProps {
  theme?: 'dark' | 'light';
  isLoggedIn?: boolean;
  userAvatar?: string;
}

const PORTALS = [
  {
    id: 'patient',
    name: 'Patient Dashboard',
    description:
      'Own and share your health records with time-bound QR codes. You decide who sees what and for how long.',
    href: '/login',
    icon: UserIcon,
    features: [
      'Time-bound QR sharing',
      'Full history in one place',
      'Emergency info when it counts',
      'Earn from research shares',
    ],
  },
  {
    id: 'hospital',
    name: 'Hospitals Portal',
    description:
      'Faster intake when patients bring a clear trail. Less missing paperwork at the desk.',
    href: '/login',
    icon: BuildingOffice2Icon,
    features: [
      'Scan or open a patient shared QR code',
      'Unified EMR search by NIN',
      'Faster emergency handovers',
      'Share of research revenue',
    ],
  },
  {
    id: 'researcher',
    name: 'Researchers Portal',
    description:
      'Consent-first participation. Access structured, patient-controlled data while patients retain full ownership.',
    href: '/login',
    icon: BeakerIcon,
    features: [
      'Clear consent paths',
      'Structured datasets',
      'Patient stays in control',
      'Ethical data access',
    ],
  },
  {
    id: 'insurer',
    name: 'Insurers Portal',
    description:
      'Receive patient-authorised medical context for cleaner claims. Full audit trail of every access granted.',
    href: '/login',
    icon: ShieldCheckIcon,
    features: [
      'Patient-authorised context',
      'Fewer missing documents',
      'Clear audit of shares',
      'Faster claims processing',
    ],
  },
];

export default function Header({ theme = 'dark', isLoggedIn = false, userAvatar }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [portalsOpen, setPortalsOpen] = useState(false);
  const [activePortal, setActivePortal] = useState(PORTALS[0]);
  const portalsRef = useRef<HTMLDivElement>(null);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const isDark = theme === 'dark';

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (portalsRef.current && !portalsRef.current.contains(event.target as Node)) {
        setPortalsOpen(false);
      }
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setPortalsOpen(false);
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, []);

  useEffect(() => {
    setIsMenuOpen(false);
    setPortalsOpen(false);
    document.body.style.overflow = '';
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMenuOpen]);

  const scrollToSection = (id: string) => {
    setIsMenuOpen(false);
    setPortalsOpen(false);
    if (location.pathname !== '/') {
      navigate('/#' + id);
      setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }), 120);
      return;
    }
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const openPortals = () => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    setPortalsOpen(true);
  };

  const closePortals = () => {
    hoverTimer.current = setTimeout(() => setPortalsOpen(false), 140);
  };

  const navBg = isScrolled
    ? isDark
      ? 'border-b border-white/10 bg-[#05081a]/80 shadow-[0_12px_40px_-18px_rgba(0,0,0,0.8)] backdrop-blur-xl'
      : 'border-b border-gray-100 bg-white/85 shadow-[0_12px_40px_-24px_rgba(15,23,42,0.22)] backdrop-blur-xl'
    : 'border-b border-transparent bg-transparent';

  const navLink = `rounded-full px-3.5 py-2 text-[13px] font-semibold transition-colors ${
    isDark
      ? 'text-white/70 hover:bg-white/[0.06] hover:text-white'
      : 'text-gray-600 hover:bg-gray-50 hover:text-[#101217]'
  }`;

  return (
    <>
      <WaitlistModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

      <nav className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${navBg}`}>
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5 sm:h-[4.5rem] sm:px-8 lg:px-10">
          <Link
            to="/"
            className="group flex shrink-0 items-center gap-2.5 transition-opacity hover:opacity-85"
            aria-label="Selorah Health home"
          >
            <img
              src="/logo.svg"
              alt=""
              className="h-8 w-8 object-contain transition-transform duration-300 group-hover:scale-105 sm:h-9 sm:w-9"
            />
            <span
              className={`text-base font-bold tracking-tight sm:text-lg ${
                isDark ? 'text-white' : 'text-[#101217]'
              }`}
            >
              Selorah Health
            </span>
          </Link>

          <div
            className={`hidden items-center gap-0.5 lg:flex ${
              isDark ? 'text-white/70' : 'text-gray-600'
            }`}
          >
            <button type="button" onClick={() => scrollToSection('how-it-works')} className={navLink}>
              How It Works
            </button>

            <div
              ref={portalsRef}
              className="relative"
              onMouseEnter={openPortals}
              onMouseLeave={closePortals}
            >
              <button
                type="button"
                aria-expanded={portalsOpen}
                aria-haspopup="true"
                onClick={() => setPortalsOpen((value) => !value)}
                className={`${navLink} flex items-center gap-1 ${
                  portalsOpen
                    ? isDark
                      ? 'bg-white/[0.08] text-white'
                      : 'bg-gray-50 text-[#101217]'
                    : ''
                }`}
              >
                Portals
                <ChevronDownIcon
                  className={`h-3.5 w-3.5 transition-transform duration-200 ${
                    portalsOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              <div
                className={`absolute left-1/2 top-full z-50 w-[640px] max-w-[calc(100vw-3rem)] -translate-x-1/2 pt-3 transition-all duration-200 ${
                  portalsOpen
                    ? 'pointer-events-auto translate-y-0 opacity-100'
                    : 'pointer-events-none -translate-y-1 opacity-0'
                }`}
              >
                <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-[0_30px_80px_-24px_rgba(15,23,42,0.35)]">
                  <div className="flex items-center justify-between border-b border-gray-50 px-5 py-3.5">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-300">
                        Choose your portal
                      </p>
                      <p className="text-sm font-bold text-[#101217]">
                        One record, every care setting
                      </p>
                    </div>
                    <span className="rounded-full bg-[#EEF2FF] px-3 py-1 text-[9px] font-black uppercase tracking-widest text-[#6183FF]">
                      4 roles
                    </span>
                  </div>

                  <div className="flex min-h-[268px]">
                    <div className="flex w-[220px] shrink-0 flex-col gap-1 border-r border-gray-50 bg-[#F8F9FA] p-2.5">
                      {PORTALS.map((portal) => {
                        const Icon = portal.icon;
                        const isActive = activePortal.id === portal.id;
                        return (
                          <button
                            key={portal.id}
                            type="button"
                            onMouseEnter={() => setActivePortal(portal)}
                            onFocus={() => setActivePortal(portal)}
                            onClick={() => {
                              navigate(portal.href);
                              setPortalsOpen(false);
                            }}
                            className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition-all ${
                              isActive
                                ? 'bg-white text-[#101217] shadow-sm ring-1 ring-[#6183FF]/15'
                                : 'text-gray-500 hover:bg-white/70 hover:text-[#101217]'
                            }`}
                          >
                            <span
                              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                                isActive ? 'bg-[#6183FF] text-white' : 'bg-white text-[#6183FF]'
                              }`}
                            >
                              <Icon className="h-4 w-4" strokeWidth={1.8} />
                            </span>
                            <span className="truncate">{portal.name}</span>
                            {isActive && (
                              <ArrowRightIcon className="ml-auto h-3.5 w-3.5 text-[#6183FF]" />
                            )}
                          </button>
                        );
                      })}
                    </div>

                    <div className="flex flex-1 flex-col p-5">
                      <p className="text-sm leading-relaxed text-gray-600">
                        {activePortal.description}
                      </p>
                      <ul className="mt-4 space-y-2.5">
                        {activePortal.features.map((feature) => (
                          <li key={feature} className="flex items-start gap-2.5 text-sm text-gray-700">
                            <CheckCircleIcon
                              className="mt-0.5 h-4 w-4 shrink-0 text-[#6183FF]"
                              strokeWidth={2}
                            />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                      <button
                        type="button"
                        onClick={() => {
                          navigate(activePortal.href);
                          setPortalsOpen(false);
                        }}
                        className="mt-auto flex items-center gap-1.5 pt-4 text-xs font-bold text-[#6183FF] transition-colors hover:text-[#4D6ED6]"
                      >
                        Continue to {activePortal.name}
                        <ArrowRightIcon className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <button type="button" onClick={() => scrollToSection('ownership')} className={navLink}>
              Benefits
            </button>
            <button type="button" onClick={() => scrollToSection('faq')} className={navLink}>
              FAQ
            </button>
            <Link to="/pricing" className={navLink}>
              Pricing
            </Link>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="hidden items-center gap-2 lg:flex">
              <ThemeToggle tone={isDark ? 'dark' : 'light'} />
              {isLoggedIn ? (
                <Link
                  to="/dashboard"
                  className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold transition-colors ${
                    isDark
                      ? 'border-white/15 text-white/80 hover:border-white/30 hover:text-white'
                      : 'border-gray-200 text-gray-700 hover:border-gray-300 hover:text-[#101217]'
                  }`}
                >
                  <span className="flex h-7 w-7 overflow-hidden rounded-full border border-white/20 bg-[#EEF2FF]">
                    {userAvatar ? (
                      <img src={userAvatar} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <UserCircleIcon className="h-full w-full text-[#6183FF]" />
                    )}
                  </span>
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    to="/login"
                    className={`rounded-full px-3.5 py-2 text-[13px] font-semibold transition-colors ${
                      isDark
                        ? 'text-white/70 hover:bg-white/[0.06] hover:text-white'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-[#101217]'
                    }`}
                  >
                    Log in
                  </Link>
                  <CTAButton size="sm" onClick={() => setIsModalOpen(true)}>
                    Join The Waitlist
                  </CTAButton>
                </>
              )}
            </div>

            <ThemeToggle tone={isDark ? 'dark' : 'light'} className="lg:hidden" />

            <button
              type="button"
              className={`relative z-50 flex h-10 w-10 flex-col items-center justify-center gap-1.5 rounded-full transition-colors lg:hidden ${
                isDark ? 'text-white hover:bg-white/10' : 'text-gray-900 hover:bg-gray-100'
              }`}
              onClick={() => setIsMenuOpen((value) => !value)}
              aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={isMenuOpen}
            >
              {isMenuOpen ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </nav>

      {isMenuOpen && (
        <div className="fixed inset-0 z-40 overflow-y-auto bg-[#05081a] px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-24 lg:hidden">
          <div className="mx-auto flex max-w-md flex-col">
            <p className="mb-3 text-[10px] font-black uppercase tracking-[0.2em] text-white/30">
              Navigate
            </p>
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
              {[
                { label: 'How It Works', id: 'how-it-works' },
                { label: 'Benefits', id: 'ownership' },
                { label: 'FAQ', id: 'faq' },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => scrollToSection(item.id)}
                  className="flex min-h-[52px] w-full items-center justify-between border-b border-white/[0.06] px-4 text-left text-[15px] font-semibold text-white/85 last:border-b-0 hover:bg-white/[0.04]"
                >
                  {item.label}
                  <ArrowRightIcon className="h-4 w-4 text-white/30" />
                </button>
              ))}
              <Link
                to="/pricing"
                onClick={() => setIsMenuOpen(false)}
                className="flex min-h-[52px] w-full items-center justify-between px-4 text-left text-[15px] font-semibold text-white/85 hover:bg-white/[0.04]"
              >
                Pricing
                <ArrowRightIcon className="h-4 w-4 text-white/30" />
              </Link>
            </div>

            <p className="mb-3 mt-7 text-[10px] font-black uppercase tracking-[0.2em] text-white/30">
              Portals
            </p>
            <div className="grid gap-2">
              {PORTALS.map((portal) => {
                const Icon = portal.icon;
                return (
                  <Link
                    key={portal.id}
                    to={portal.href}
                    onClick={() => setIsMenuOpen(false)}
                    className="flex min-h-[60px] items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 transition-colors hover:border-[#6183FF]/40 hover:bg-[#6183FF]/10"
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#6183FF]/15 text-[#8FA8FF]">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-bold text-white">{portal.name}</span>
                      <span className="mt-0.5 block truncate text-[11px] text-white/40">
                        {portal.description}
                      </span>
                    </span>
                    <ArrowRightIcon className="h-4 w-4 shrink-0 text-white/30" />
                  </Link>
                );
              })}
            </div>

            <div className="mt-7 grid gap-2.5">
              {!isLoggedIn && (
                <Link
                  to="/login"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex min-h-[50px] items-center justify-center rounded-2xl border border-white/15 text-sm font-bold text-white"
                >
                  Log in
                </Link>
              )}
              <CTAButton
                className="w-full justify-center"
                onClick={() => {
                  setIsModalOpen(true);
                  setIsMenuOpen(false);
                }}
              >
                Join The Waitlist
              </CTAButton>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
