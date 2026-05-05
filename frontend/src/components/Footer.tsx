import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import WaitlistModal from './WaitlistModal';

export default function Footer() {
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
  };

  return (
    <>
      <WaitlistModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      <footer className="bg-[#0A0B14] text-white pt-24 pb-12 px-12 border-t border-white/10 overflow-hidden relative font-sora">
        {/* Background Text */}
        <div className="absolute bottom-0 left-0 w-full opacity-5 pointer-events-none select-none">
          <h2 className="text-[20vw] font-black leading-none whitespace-nowrap -mb-8">selorahealth</h2>
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-24">
            <div className="lg:col-span-1">
              <Link to="/" className="flex items-center mb-8 hover:opacity-80 transition-opacity">
                <img src="/logo.svg" alt="Selorah Logo" className="w-[45px] h-[45px]" />
              </Link>
            </div>

            <div>
              <h4 className="font-bold text-gray-500 text-xs uppercase tracking-widest mb-6">Product</h4>
              <ul className="space-y-4 text-sm font-medium text-gray-300">
                <li><Link to="/dashboard" className="hover:text-white transition-colors">Patient App</Link></li>
                <li><Link to="/hospital" className="hover:text-white transition-colors">Hospital Portal</Link></li>
                <li><Link to="/researcher" className="hover:text-white transition-colors">Research Portal</Link></li>
                <li><Link to="/insurer" className="hover:text-white transition-colors">Insurer Portal</Link></li>
                <li><Link to="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-gray-500 text-xs uppercase tracking-widest mb-6">Company</h4>
              <ul className="space-y-4 text-sm font-medium text-gray-300">
                <li><Link to="/about" className="hover:text-white transition-colors">About</Link></li>
                <li><a href="https://samuel-amanze.vercel.app/" className="hover:text-white transition-colors">Schedule a meeting</a></li>
                <li><Link to="/careers" className="hover:text-white transition-colors">Career</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-gray-500 text-xs uppercase tracking-widest mb-6">Legal</h4>
              <ul className="space-y-4 text-sm font-medium text-gray-300">
                <li><Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link to="/terms" className="hover:text-white transition-colors">Terms of use</Link></li>
                <li><Link to="/cookie-policy" className="hover:text-white transition-colors">Cookie Policy</Link></li>
                <li><Link to="/dpa" className="hover:text-white transition-colors">Data Processing Agreement</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-gray-500 text-xs uppercase tracking-widest mb-6">Social</h4>
              <ul className="space-y-4 text-sm font-medium text-gray-300">
                <li><a href="https://linkedin.com/company/selorahealth/" className="hover:text-white transition-colors">LinkedIn</a></li>
                <li><a href="https://x.com/selorahealth" className="hover:text-white transition-colors">X/Twitter</a></li>
                <li><a href="https://chat.whatsapp.com/JI2LK41IF8yHiJjEuWKk2M?mode=gi_t" className="hover:text-white transition-colors">WhatsApp Community</a></li>
              </ul>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center pt-12 border-t border-white/5 gap-8">
            <div className="text-gray-500 text-xs flex-1 order-2 md:order-1 text-center md:text-left">
              <span>Copyright (c) 2026, Selorah Health Limited. All rights reserved.</span>
            </div>

            <div className="flex-1 flex justify-center order-1 md:order-2">
              <button
                onClick={() => setIsModalOpen(true)}
                className="bg-primary text-white px-8 py-2.5 rounded-full font-bold hover:bg-primary-hover transition-all hover:scale-105 shadow-lg shadow-primary/20"
              >
                Join Waitlist
              </button>
            </div>

            <div className="text-gray-500 text-xs flex gap-6 flex-1 justify-center md:justify-end order-3">
              <Link to="/terms" className="hover:text-white transition-colors">Terms</Link>
              <Link to="/privacy" className="hover:text-white transition-colors">Privacy</Link>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
