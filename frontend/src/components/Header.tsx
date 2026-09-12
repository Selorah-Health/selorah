// Updated Header.tsx - with profile icon support
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bars3Icon, XMarkIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import LanguageSelector from './LanguageSelector';
import WaitlistModal from './WaitlistModal';

interface HeaderProps {
  theme?: 'dark' | 'light';
  isLoggedIn?: boolean; // New prop
  userAvatar?: string;   // Optional avatar URL
}

export default function Header({ 
  theme = 'dark', 
  isLoggedIn = false, 
  userAvatar 
}: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();

  const scrollToSection = (id: string) => {
    if (window.location.pathname !== '/') {
      navigate('/#' + id);
    } else {
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
    setIsMenuOpen(false);
  };

  return (
    <>
      <WaitlistModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      {/* NAVIGATION BAR */}
      <nav className={`fixed top-0 w-full z-50 backdrop-blur-md border-b ${theme === 'dark' ? 'bg-black/70 border-white/10' : 'bg-white/80 border-gray-100'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 h-16 sm:h-20 grid grid-cols-[1fr_auto] lg:grid-cols-[1fr_auto_1fr] items-center gap-4">
          {/* Brand */}
          <Link to="/" className="flex items-center gap-2 group hover:opacity-80 transition-opacity min-w-0 justify-self-start">
            <img src="/logo.svg" alt="Selorah Logo" className="w-9 h-9 sm:w-[45px] sm:h-[45px] group-hover:scale-105 transition-transform shrink-0" />
            <span className={`font-bold text-base sm:text-xl tracking-tight truncate ${theme === 'dark' ? 'text-white' : 'text-[#4262FF]'}`}>Selorah Health</span>
          </Link>

          {/* Desktop nav links - centered between brand and CTA */}
          <div className={`hidden lg:flex items-center justify-center gap-6 xl:gap-8 text-sm font-medium ${theme === 'dark' ? 'text-white/80' : 'text-gray-600'}`}>
            <button type="button" onClick={() => scrollToSection('how-it-works')} className={`transition-colors whitespace-nowrap ${theme === 'dark' ? 'hover:text-white' : 'hover:text-[#4262FF]'}`}>How It Works</button>
            <button type="button" onClick={() => scrollToSection('hospitals')} className={`transition-colors whitespace-nowrap ${theme === 'dark' ? 'hover:text-white' : 'hover:text-[#4262FF]'}`}>For Hospitals</button>
            <button type="button" onClick={() => scrollToSection('researchers')} className={`transition-colors whitespace-nowrap ${theme === 'dark' ? 'hover:text-white' : 'hover:text-[#4262FF]'}`}>For Researchers</button>
            <button type="button" onClick={() => scrollToSection('insurers')} className={`transition-colors whitespace-nowrap ${theme === 'dark' ? 'hover:text-white' : 'hover:text-[#4262FF]'}`}>For Insurers</button>
            <Link to="/pricing" className={`transition-colors whitespace-nowrap ${theme === 'dark' ? 'hover:text-white' : 'hover:text-[#4262FF]'}`}>Pricing</Link>
          </div>

          {/* Right: CTA / profile + mobile menu */}
          <div className="flex items-center gap-3 justify-self-end">
            <div className="hidden lg:flex items-center gap-4">
              {isLoggedIn ? (
                <>
                  <Link to="/dashboard" className={`text-sm font-medium transition-colors ${theme === 'dark' ? 'text-white/80 hover:text-white' : 'text-gray-600 hover:text-[#4262FF]'}`}>Dashboard</Link>
                  <div className="w-9 h-9 rounded-full overflow-hidden border border-white/30">
                    {userAvatar ? (
                      <img src={userAvatar} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <UserCircleIcon className="w-full h-full text-white/70" />
                    )}
                  </div>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsModalOpen(true)}
                  className="bg-primary text-white px-6 py-2 rounded-full font-bold hover:bg-primary-hover transition-colors whitespace-nowrap"
                >
                  Join Waitlist
                </button>
              )}
            </div>

            <button
              type="button"
              className="lg:hidden relative w-8 h-8 flex flex-col justify-center items-center gap-1.5 z-50"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
            >
              <span className={`w-4 h-0.5 transition-all duration-300 origin-center ${theme === 'dark' ? 'bg-white' : 'bg-gray-900'} ${isMenuOpen ? 'rotate-45 translate-y-[4px]' : ''}`} />
              <span className={`w-4 h-0.5 transition-all duration-300 origin-center ${theme === 'dark' ? 'bg-white' : 'bg-gray-900'} ${isMenuOpen ? '-rotate-45 -translate-y-[4px]' : ''}`} />
            </button>
          </div>
        </div>
      </nav>

      {/* MOBILE MENU - Simplified for new design */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-40 bg-[#0A0B14] pt-24 px-12 lg:hidden">
          <div className="flex flex-col gap-6 text-xl font-medium text-white/80">
            <button onClick={() => scrollToSection('how-it-works')} className="text-left">How It Works</button>
            <button onClick={() => scrollToSection('hospitals')} className="text-left">For Hospitals</button>
            <button onClick={() => scrollToSection('researchers')} className="text-left">For Researchers</button>
            <button onClick={() => scrollToSection('insurers')} className="text-left">For Insurers</button>
            <Link to="/pricing" onClick={() => setIsMenuOpen(false)}>Pricing</Link>
            
            {isLoggedIn ? (
              <Link to="/dashboard" onClick={() => setIsMenuOpen(false)} className="text-primary">Dashboard</Link>
            ) : (
              <button
                onClick={() => { setIsModalOpen(true); setIsMenuOpen(false); }}
                className="bg-primary text-white py-4 rounded-xl font-bold"
              >
                Join Waitlist
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
