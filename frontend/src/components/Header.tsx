import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import LanguageSelector from './LanguageSelector';
import WaitlistModal from './WaitlistModal';

interface HeaderProps {
  theme?: 'dark' | 'light';
}

export default function Header({ theme = 'dark' }: HeaderProps) {
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
      <nav className={`fixed top-0 w-full z-50 backdrop-blur-md border-b ${theme === 'dark' ? 'bg-black/20 border-white/10' : 'bg-white/80 border-gray-100'}`}>
        <div className="max-w-7xl mx-auto px-12 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group hover:opacity-80 transition-opacity">
            <img src="/logo.svg" alt="Selorah Logo" className="w-[45px] h-[45px] group-hover:scale-105 transition-transform" />
            <span className={`font-bold text-xl tracking-tight ${theme === 'dark' ? 'text-white' : 'text-[#4262FF]'}`}>Selorah Health</span>
          </Link>

          <div className={`hidden lg:flex items-center gap-8 text-sm font-medium ${theme === 'dark' ? 'text-white/80' : 'text-gray-600'}`}>
            <button onClick={() => scrollToSection('how-it-works')} className={`transition-colors ${theme === 'dark' ? 'hover:text-white' : 'hover:text-[#4262FF]'}`}>How It Works</button>
            <button onClick={() => scrollToSection('hospitals')} className={`transition-colors ${theme === 'dark' ? 'hover:text-white' : 'hover:text-[#4262FF]'}`}>For Hospitals</button>
            <button onClick={() => scrollToSection('researchers')} className={`transition-colors ${theme === 'dark' ? 'hover:text-white' : 'hover:text-[#4262FF]'}`}>For Researchers</button>
            <button onClick={() => scrollToSection('insurers')} className={`transition-colors ${theme === 'dark' ? 'hover:text-white' : 'hover:text-[#4262FF]'}`}>For Insurers</button>
            <Link to="/pricing" className={`transition-colors ${theme === 'dark' ? 'hover:text-white' : 'hover:text-[#4262FF]'}`}>Pricing</Link>

            <Link to="/login" className={`px-6 py-2 rounded-full border transition-colors ${theme === 'dark' ? 'border-white/20 hover:bg-white/10' : 'border-gray-200 hover:bg-gray-50'}`}>Log in</Link>
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-primary text-white px-6 py-2 rounded-full font-bold hover:bg-primary-hover transition-colors"
            >
              Join Waitlist
            </button>
          </div>

          <button
            className={`lg:hidden relative w-4 h-4 flex flex-col justify-center items-center gap-1.5 z-50`}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <span
              className={`w-4 h-0.5 transition-all duration-300 origin-center ${theme === 'dark' ? 'bg-white' : 'bg-gray-900'} ${isMenuOpen ? 'rotate-45 translate-y-[4px]' : ''}`}
            />
            <span
              className={`w-4 h-0.5 transition-all duration-300 origin-center ${theme === 'dark' ? 'bg-white' : 'bg-gray-900'} ${isMenuOpen ? '-rotate-45 -translate-y-[4px]' : ''}`}
            />
          </button>
        </div>
      </nav>

      {/* MOBILE MENU */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-40 bg-[#0A0B14] pt-24 px-12 lg:hidden">
          <div className="flex flex-col gap-6 text-xl font-medium text-white/80">
            <button onClick={() => scrollToSection('how-it-works')} className="text-left">How It Works</button>
            <button onClick={() => scrollToSection('hospitals')} className="text-left">For Hospitals</button>
            <button onClick={() => scrollToSection('researchers')} className="text-left">For Researchers</button>
            <button onClick={() => scrollToSection('insurers')} className="text-left">For Insurers</button>
            <Link to="/pricing" onClick={() => setIsMenuOpen(false)}>Pricing</Link>
            <Link to="/login" className="text-primary" onClick={() => setIsMenuOpen(false)}>Log in</Link>
            <button
              onClick={() => { setIsModalOpen(true); setIsMenuOpen(false); }}
              className="bg-primary text-white py-4 rounded-xl font-bold"
            >
              Join Waitlist
            </button>
          </div>
        </div>
      )}
    </>
  );
}
