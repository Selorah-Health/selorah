import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Bars3Icon,
  XMarkIcon,
  UserCircleIcon,
  UserIcon,
  BuildingOffice2Icon,
  BeakerIcon,
  ShieldCheckIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';
import WaitlistModal from './WaitlistModal';
import CTAButton from './CTAButton';

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
      'Securely store, view and share your complete medical history with time-bound QR codes. You decide who sees what and for how long.',
    href: '/login',
    icon: UserIcon,
  },
  {
    id: 'hospital',
    name: 'Hospitals Portal',
    description:
      'Scan or open a patient share at the front desk. See only what the patient authorised. Built for busy clinics.',
    href: '/login',
    icon: BuildingOffice2Icon,
  },
  {
    id: 'researcher',
    name: 'Researchers Portal',
    description:
      'Consent-first participation. Access structured, patient-controlled data while patients retain full ownership.',
    href: '/login',
    icon: BeakerIcon,
  },
  {
    id: 'insurer',
    name: 'Insurers Portal',
    description:
      'Receive patient-authorised medical context for cleaner claims. Full audit trail of every access granted.',
    href: '/login',
    icon: ShieldCheckIcon,
  },
];

export default function Header({
  theme = 'dark',
  isLoggedIn = false,
  userAvatar,
}: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [portalsOpen, setPortalsOpen] = useState(false);
  const [activePortal, setActivePortal] = useState(PORTALS[0]);
  const portalsRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Glassmorphism on scroll (keep existing behaviour)
  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close portals dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (portalsRef.current && !portalsRef.current.contains(e.target as Node)) {
        setPortalsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const scrollToSection = (id: string) => {
    if (location.pathname !== '/') {
      navigate('/#' + id);
    } else {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
    setIsMenuOpen(false);
    setPortalsOpen(false);
  };

  const isDark = theme === 'dark';
  const navBg = isScrolled
    ? isDark
      ? 'bg-black/70 backdrop-blur-md border-b border-white/10'
      : 'bg-white/80 backdrop-blur-md border-b border-gray-100'
    : isDark
      ? 'bg-transparent border-b border-transparent'
      : 'bg-transparent border-b border-transparent';

  return (
    <>
      <WaitlistModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${navBg}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 h-16 sm:h-20 flex items-center justify-between gap-4">
          {/* Brand */}
          <Link
            to="/"
            className="flex items-center gap-2 group hover:opacity-80 transition-opacity shrink-0"
          >
            <img
              src="/logo.svg"
              alt="Selorah Logo"
              className="w-9 h-9 sm:w-[42px] sm:h-[42px] group-hover:scale-105 transition-transform"
            />
            <span
              className={`font-bold text-base sm:text-lg tracking-tight ${
                isDark ? 'text-white' : 'text-[#6183FF]'
              }`}
            >
              Selorah Health
            </span>
          </Link>

          {/* Desktop Nav */}
          <div
            className={`hidden lg:flex items-center gap-1 xl:gap-2 text-sm font-medium ${
              isDark ? 'text-white/80' : 'text-gray-600'
            }`}
          >
            <button
              type="button"
              onClick={() => scrollToSection('how-it-works')}
              className={`px-3 py-2 rounded-lg transition-colors ${
                isDark ? 'hover:text-white hover:bg-white/5' : 'hover:text-[#6183FF] hover:bg-gray-50'
              }`}
            >
              How It Works
            </button>

            {/* Portals Dropdown */}
            <div
              ref={portalsRef}
              className="relative"
              onMouseEnter={() => {
                setPortalsOpen(true);
                setActivePortal(PORTALS[0]);
              }}
              onMouseLeave={() => setPortalsOpen(false)}
            >
              <button
                type="button"
                className={`flex items-center gap-1 px-3 py-2 rounded-lg transition-colors ${
                  isDark ? 'hover:text-white hover:bg-white/5' : 'hover:text-[#6183FF] hover:bg-gray-50'
                } ${portalsOpen ? (isDark ? 'text-white bg-white/5' : 'text-[#6183FF] bg-gray-50') : ''}`}
                onClick={() => setPortalsOpen((v) => !v)}
              >
                Portals
                <ChevronDownIcon
                  className={`w-4 h-4 transition-transform duration-200 ${portalsOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {/* Dropdown panel */}
              {portalsOpen && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 pt-3 w-[520px] z-50">
                  <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden flex">
                    {/* Left: portal list */}
                    <div className="w-[200px] bg-gray-50/80 p-2 border-r border-gray-100">
                      {PORTALS.map((portal) => {
                        const Icon = portal.icon;
                        const isActive = activePortal.id === portal.id;
                        return (
                          <button
                            key={portal.id}
                            type="button"
                            onMouseEnter={() => setActivePortal(portal)}
                            onClick={() => {
                              navigate(portal.href);
                              setPortalsOpen(false);
                            }}
                            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left text-sm font-medium transition-all ${
                              isActive
                                ? 'bg-[#6183FF] text-white shadow-sm'
                                : 'text-gray-700 hover:bg-white hover:shadow-sm'
                            }`}
                          >
                            <Icon className="w-4.5 h-4.5 shrink-0" strokeWidth={2} />
                            <span className="truncate">{portal.name}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Right: active portal detail */}
                    <div className="flex-1 p-5 flex flex-col justify-between min-h-[180px]">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <activePortal.icon className="w-5 h-5 text-[#6183FF]" />
                          <h4 className="font-bold text-gray-900 text-sm">
                            {activePortal.name}
                          </h4>
                        </div>
                        <p className="text-sm text-gray-600 leading-relaxed">
                          {activePortal.description}
                        </p>
                      </div>
                      <Link
                        to={activePortal.href}
                        onClick={() => setPortalsOpen(false)}
                        className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[#6183FF] hover:underline"
                      >
                        Open portal
                        <ChevronDownIcon className="w-3.5 h-3.5 -rotate-90" />
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => scrollToSection('ownership')}
              className={`px-3 py-2 rounded-lg transition-colors ${
                isDark ? 'hover:text-white hover:bg-white/5' : 'hover:text-[#6183FF] hover:bg-gray-50'
              }`}
            >
              Benefits
            </button>

            <Link
              to="/pricing"
              className={`px-3 py-2 rounded-lg transition-colors ${
                isDark ? 'hover:text-white hover:bg-white/5' : 'hover:text-[#6183FF] hover:bg-gray-50'
              }`}
            >
              Pricing
            </Link>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            <div className="hidden lg:flex items-center">
              {isLoggedIn ? (
                <Link
                  to="/dashboard"
                  className={`flex items-center gap-2 text-sm font-medium ${
                    isDark ? 'text-white/80 hover:text-white' : 'text-gray-600 hover:text-[#6183FF]'
                  }`}
                >
                  <div className="w-9 h-9 rounded-full overflow-hidden border border-white/30">
                    {userAvatar ? (
                      <img src={userAvatar} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <UserCircleIcon className="w-full h-full text-white/70" />
                    )}
                  </div>
                </Link>
              ) : (
                <CTAButton size="sm" onClick={() => setIsModalOpen(true)}>
                  Join The Waitlist
                </CTAButton>
              )}
            </div>

            {/* Mobile hamburger */}
            <button
              type="button"
              className="lg:hidden relative w-9 h-9 flex flex-col justify-center items-center gap-1.5 z-50"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
            >
              {isMenuOpen ? (
                <XMarkIcon className={`w-6 h-6 ${isDark ? 'text-white' : 'text-gray-900'}`} />
              ) : (
                <Bars3Icon className={`w-6 h-6 ${isDark ? 'text-white' : 'text-gray-900'}`} />
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-40 bg-[#020924] pt-24 px-6 lg:hidden overflow-y-auto">
          <div className="flex flex-col gap-1 text-lg font-medium text-white/90">
            <button
              type="button"
              onClick={() => scrollToSection('how-it-works')}
              className="text-left py-3 border-b border-white/10"
            >
              How It Works
            </button>

            <div className="py-3 border-b border-white/10">
              <p className="text-white/50 text-xs uppercase tracking-widest mb-2">Portals</p>
              {PORTALS.map((p) => {
                const Icon = p.icon;
                return (
                  <Link
                    key={p.id}
                    to={p.href}
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-3 py-2.5 text-white/80 hover:text-white"
                  >
                    <Icon className="w-5 h-5 text-[#6183FF]" />
                    {p.name}
                  </Link>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => scrollToSection('ownership')}
              className="text-left py-3 border-b border-white/10"
            >
              Benefits
            </button>

            <Link
              to="/pricing"
              onClick={() => setIsMenuOpen(false)}
              className="py-3 border-b border-white/10"
            >
              Pricing
            </Link>

            {!isLoggedIn && (
              <div className="pt-6">
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
            )}
          </div>
        </div>
      )}
    </>
  );
}
