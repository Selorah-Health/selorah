import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowRightIcon,
  Bars3Icon,
  BeakerIcon,
  BuildingOffice2Icon,
  ChevronDownIcon,
  ShieldCheckIcon,
  UserCircleIcon,
  UserGroupIcon,
  UserIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import WaitlistModal, { type WaitlistRole } from './WaitlistModal';
import CTAButton from './CTAButton';
import ThemeToggle from './ThemeToggle';
import { contactPathForRole } from '../lib/contact';
import { listenForTheme, readTheme, type Theme } from '../lib/theme';

interface HeaderProps {
  theme?: 'dark' | 'light';
  isLoggedIn?: boolean;
  userAvatar?: string;
  /** Slim announcement bar shown above the main navigation. */
  announcement?: React.ReactNode;
  /** Force the announcement bar to a dark treatment while keeping the nav light. */
  announcementTone?: 'light' | 'dark';
  /** Path that section links should scroll within. Defaults to the home page. */
  basePath?: string;
}

const SOLUTIONS: {
  id: string;
  role?: WaitlistRole;
  name: string;
  description: string;
  icon: typeof UserIcon;
  href?: string;
}[] = [
  {
    id: 'patient',
    role: 'patient',
    name: 'For patients',
    description: 'Own your history and share it with a time-limited code.',
    icon: UserIcon,
  },
  {
    id: 'doctor',
    role: 'doctor',
    name: 'For doctors',
    description: 'Open a shared record in the browser, without a new portal.',
    icon: UserGroupIcon,
  },
  {
    id: 'hospital',
    name: 'For hospitals',
    description: 'Discuss intake, record access, and a hospital rollout.',
    icon: BuildingOffice2Icon,
    href: contactPathForRole('hospital'),
  },
  {
    id: 'researcher',
    name: 'For researchers',
    description: 'Discuss studies, cohorts, and approved data access.',
    icon: BeakerIcon,
    href: contactPathForRole('researcher'),
  },
  {
    id: 'insurer',
    name: 'For insurers',
    description: 'Discuss claims workflows and member record access.',
    icon: ShieldCheckIcon,
    href: contactPathForRole('insurer'),
  },
];

export default function Header({
  theme = 'dark',
  isLoggedIn = false,
  userAvatar,
  announcement,
  announcementTone = 'light',
  basePath = '/',
}: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalRole, setModalRole] = useState<WaitlistRole>('patient');
  const [modalSource, setModalSource] = useState('header');
  const [isScrolled, setIsScrolled] = useState(false);
  const [solutionsOpen, setSolutionsOpen] = useState(false);
  const [appearance, setAppearance] = useState<Theme>(() => readTheme());
  const solutionsRef = useRef<HTMLDivElement>(null);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const isDark = theme === 'dark' || appearance === 'dark';

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => listenForTheme(setAppearance), []);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (solutionsRef.current && !solutionsRef.current.contains(event.target as Node)) {
        setSolutionsOpen(false);
      }
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSolutionsOpen(false);
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
    // Route changes close any open navigation surface.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMenuOpen(false);
    setSolutionsOpen(false);
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
    setSolutionsOpen(false);
    if (location.pathname !== basePath) {
      navigate(basePath + '#' + id);
      window.setTimeout(
        () => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }),
        120
      );
      return;
    }
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const openSolutions = () => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    setSolutionsOpen(true);
  };

  const closeSolutions = () => {
    hoverTimer.current = setTimeout(() => setSolutionsOpen(false), 140);
  };

  const openWaitlist = (role: WaitlistRole = 'patient', source = 'header') => {
    setModalRole(role);
    setModalSource(source);
    setIsModalOpen(true);
    setSolutionsOpen(false);
    setIsMenuOpen(false);
  };

  const navBg = isScrolled
    ? isDark
      ? 'border-b border-white/10 bg-[#05081a]/80 shadow-[0_12px_40px_-18px_rgba(0,0,0,0.8)] backdrop-blur-xl'
      : 'border-b border-[#E7EBF3] bg-white/85 shadow-[0_12px_40px_-24px_rgba(15,23,42,0.22)] backdrop-blur-xl'
    : 'border-b border-transparent bg-transparent';

  const navLink = `rounded-none px-3 py-2 text-sm font-medium transition-colors ${
    isDark
      ? 'text-white/70 hover:bg-white/[0.06] hover:text-white'
      : 'text-[#4B5563] hover:bg-[#F6F8FA] hover:text-[#101217]'
  }`;

  return (
    <>
      <WaitlistModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialRole={modalRole}
        source={modalSource}
      />

      <nav className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${navBg}`}>
        {announcement && (
          <div
            className={`border-b px-5 py-2 text-center text-xs font-medium sm:text-sm ${
              announcementTone === 'dark'
                ? 'border-white/10 bg-[#020924] text-white/70'
                : isDark
                  ? 'border-white/10 bg-[#05081a] text-white/70'
                  : 'border-[#E7EBF3] bg-[#F6F9FC] text-[#4B5563]'
            }`}
          >
            <div className="mx-auto flex max-w-6xl items-center justify-center gap-1.5">
              {announcement}
            </div>
          </div>
        )}
        <div className="flex h-16 w-full items-center justify-between gap-4 px-5 sm:h-[4.5rem] sm:px-8 lg:px-10">
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
            className={`hidden flex-1 items-center justify-center gap-0.5 lg:flex ${
              isDark ? 'text-white/70' : 'text-[#4B5563]'
            }`}
          >
            <button type="button" onClick={() => scrollToSection('product')} className={navLink}>
              Product
            </button>

            <div
              ref={solutionsRef}
              className="relative"
              onMouseEnter={openSolutions}
              onMouseLeave={closeSolutions}
            >
              <button
                type="button"
                aria-expanded={solutionsOpen}
                aria-haspopup="true"
                onClick={() => setSolutionsOpen((value) => !value)}
                className={`${navLink} flex items-center gap-1 ${
                  solutionsOpen
                    ? isDark
                      ? 'bg-white/[0.08] text-white'
                      : 'bg-[#F6F8FA] text-[#101217]'
                    : ''
                }`}
              >
                Solutions
                <ChevronDownIcon
                  className={`h-3.5 w-3.5 transition-transform duration-200 ${
                    solutionsOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              <div
                className={`absolute left-1/2 top-full z-50 w-[640px] max-w-[calc(100vw-3rem)] -translate-x-1/2 pt-2 transition-all duration-200 ${
                  solutionsOpen
                    ? 'pointer-events-auto translate-y-0 opacity-100'
                    : 'pointer-events-none -translate-y-1 opacity-0'
                }`}
              >
                <div className="overflow-hidden rounded-none border border-[#E5E7EB] bg-white shadow-[0_16px_40px_-20px_rgba(15,23,42,0.24)]">
                  <div className="grid grid-cols-3 gap-1 p-1.5">
                    {SOLUTIONS.map((solution) => {
                      const Icon = solution.icon;
                      const cardClass =
                        'group flex h-full flex-col items-start gap-3 rounded-none px-3 py-3 text-left transition-colors hover:bg-[#F6F8FA] focus-visible:bg-[#F6F8FA] focus-visible:outline-none';
                      const content = (
                        <>
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-none border border-[#E5E7EB] bg-white text-[#6B7280] transition-colors group-hover:text-primary">
                            <Icon className="h-4 w-4" strokeWidth={1.8} />
                          </span>
                          <span className="min-w-0">
                            <span className="block text-sm font-medium text-[#101217]">
                              {solution.name}
                            </span>
                            <span className="mt-1 block text-xs leading-relaxed text-[#6B7280]">
                              {solution.description}
                            </span>
                          </span>
                        </>
                      );

                      if (solution.href) {
                        return (
                          <Link
                            key={solution.id}
                            to={solution.href}
                            onClick={() => setSolutionsOpen(false)}
                            className={cardClass}
                          >
                            {content}
                          </Link>
                        );
                      }

                      return (
                        <button
                          key={solution.id}
                          type="button"
                          onClick={() =>
                            openWaitlist(solution.role || 'patient', `header-${solution.id}`)
                          }
                          className={cardClass}
                        >
                          {content}
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex items-center justify-between gap-4 border-t border-[#EFF2F7] px-4 py-3">
                    <span className="text-xs text-[#8A94A6]">Built for the whole visit.</span>
                    <button
                      type="button"
                      onClick={() => openWaitlist('patient', 'header-solutions-footer')}
                      className="shrink-0 text-xs font-medium text-primary transition-colors hover:text-primary-hover"
                    >
                      Join the waitlist
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <button type="button" onClick={() => scrollToSection('security')} className={navLink}>
              Security
            </button>
            <Link to="/blog" className={navLink}>
              Blog
            </Link>
            <Link to="/pricing" className={navLink}>
              Pricing
            </Link>
          </div>

          <div className="flex shrink-0 items-center gap-2.5">
            <div className="hidden items-center gap-2 lg:flex">
              <ThemeToggle tone={isDark ? 'dark' : 'light'} />
              {isLoggedIn ? (
                <Link
                  to="/dashboard"
                  className={`flex items-center gap-2 rounded-none border px-3 py-1.5 text-sm font-medium transition-colors ${
                    isDark
                      ? 'border-white/15 text-white/80 hover:border-white/30 hover:text-white'
                      : 'border-[#E7EBF3] text-[#4B5563] hover:border-[#D5DCE8] hover:text-[#101217]'
                  }`}
                >
                  <span className="flex h-7 w-7 overflow-hidden rounded-full border border-white/20 bg-primary/10">
                    {userAvatar ? (
                      <img src={userAvatar} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <UserCircleIcon className="h-full w-full text-primary" />
                    )}
                  </span>
                  Dashboard
                </Link>
              ) : (
                <CTAButton size="sm" onClick={() => openWaitlist('patient', 'header-cta')}>
                  Join the waitlist
                </CTAButton>
              )}
            </div>

            <ThemeToggle tone={isDark ? 'dark' : 'light'} className="lg:hidden" />

            <button
              type="button"
              className={`relative z-50 flex h-10 w-10 flex-col items-center justify-center gap-1.5 rounded-none transition-colors lg:hidden ${
                isDark ? 'text-white hover:bg-white/10' : 'text-[#101217] hover:bg-[#F4F6FA]'
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
        <div className="fixed inset-0 z-40 overflow-y-auto bg-white px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-24 lg:hidden">
          <div className="mx-auto flex max-w-md flex-col">
            <p className="mb-3 text-xs font-medium text-[#8A94A6]">
              Navigate
            </p>
            <div className="overflow-hidden rounded-none border border-[#E5E7EB] bg-white">
              {[
                { label: 'Product', id: 'product' },
                { label: 'Security', id: 'security' },
                { label: 'FAQ', id: 'faq' },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => scrollToSection(item.id)}
                  className="flex min-h-[52px] w-full items-center justify-between border-b border-[#EFF2F7] px-4 text-left text-[15px] font-medium text-[#101217] last:border-b-0 hover:bg-[#F6F8FA]"
                >
                  {item.label}
                  <ArrowRightIcon className="h-4 w-4 text-[#A7B0C0]" />
                </button>
              ))}
              <Link
                to="/blog"
                onClick={() => setIsMenuOpen(false)}
                className="flex min-h-[52px] w-full items-center justify-between border-b border-[#EFF2F7] px-4 text-left text-[15px] font-medium text-[#101217] hover:bg-[#F6F8FA]"
              >
                Blog
                <ArrowRightIcon className="h-4 w-4 text-[#A7B0C0]" />
              </Link>
              <Link
                to="/pricing"
                onClick={() => setIsMenuOpen(false)}
                className="flex min-h-[52px] w-full items-center justify-between px-4 text-left text-[15px] font-medium text-[#101217] hover:bg-[#F6F8FA]"
              >
                Pricing
                <ArrowRightIcon className="h-4 w-4 text-[#A7B0C0]" />
              </Link>
            </div>

            <p className="mb-3 mt-7 text-xs font-medium text-[#8A94A6]">
              Solutions
            </p>
            <div className="grid grid-cols-1 gap-2">
              {SOLUTIONS.map((solution) => {
                const Icon = solution.icon;
                const className =
                  'flex min-w-0 min-h-[60px] items-center gap-3 rounded-none border border-[#E5E7EB] bg-white px-4 py-3 text-left transition-colors hover:bg-[#F6F8FA]';
                const content = (
                  <>
                    <span className="flex h-10 w-10 items-center justify-center rounded-none bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-[#101217]">
                        {solution.name}
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-[#6B7280]">
                        {solution.href ? 'Talk to our team' : 'Join the waitlist'}
                      </span>
                    </span>
                    <ArrowRightIcon className="h-4 w-4 shrink-0 text-[#A7B0C0]" />
                  </>
                );

                if (solution.href) {
                  return (
                    <Link
                      key={solution.id}
                      to={solution.href}
                      onClick={() => setIsMenuOpen(false)}
                      className={className}
                    >
                      {content}
                    </Link>
                  );
                }

                return (
                  <button
                    key={solution.id}
                    type="button"
                    onClick={() => openWaitlist(solution.role || 'patient', `mobile-${solution.id}`)}
                    className={className}
                  >
                    {content}
                  </button>
                );
              })}
            </div>

            <div className="mt-7 grid grid-cols-1 gap-2.5">
              {isLoggedIn && (
                <Link
                  to="/dashboard"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex min-h-[50px] items-center justify-center rounded-none border border-[#E5E7EB] text-sm font-medium text-[#101217]"
                >
                  Dashboard
                </Link>
              )}
              <CTAButton
                className="w-full justify-center"
                onClick={() => openWaitlist('patient', 'mobile-cta')}
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
