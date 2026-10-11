import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRightIcon } from '@heroicons/react/24/outline';
import WaitlistModal from './WaitlistModal';

export default function Footer() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const socials = [
    { name: 'Facebook', href: '#', icon: '/landing/social-facebook.png' },
    { name: 'Instagram', href: 'https://instagram.com/selorahealth', icon: '/landing/social-instagram.png' },
    { name: 'X', href: 'https://x.com/selorahealth', icon: '/landing/social-x.png' },
    { name: 'LinkedIn', href: 'https://www.linkedin.com/company/selorahealth', icon: '/landing/social-linkedin.png' },
    { name: 'TikTok', href: 'https://tiktok.com/@selorahealth', icon: '/landing/social-tiktok.png' },
    { name: 'WhatsApp', href: 'https://chat.whatsapp.com/JI2LK41IF8yHiJjEuWKk2M?mode=gi_t', icon: '/landing/social-whatsapp.png' },
  ];

  return (
    <>
      <WaitlistModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

      <footer className="bg-[#6183FF] text-white relative overflow-hidden font-sora">
        {/* ── Large "selorah" watermark ── */}
        <div className="relative w-full overflow-hidden select-none pointer-events-none">
          <img
            src="/assets/selorah-object-for-footer.png"
            alt=""
            aria-hidden
            className="w-full max-w-none h-auto object-cover object-top opacity-90"
            style={{ maxHeight: '180px' }}
          />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 pb-10 relative z-10">
          {/* ── Social icons row ── */}
          <div className="flex items-center gap-4 sm:gap-5 mb-12 sm:mb-14">
            {socials.map((s) => (
              <a
                key={s.name}
                href={s.href}
                target={s.href === '#' ? undefined : '_blank'}
                rel={s.href === '#' ? undefined : 'noopener noreferrer'}
                aria-label={s.name}
                className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center opacity-90 hover:opacity-100 transition-opacity"
              >
                <img
                  src={s.icon}
                  alt=""
                  className="w-5 h-5 sm:w-6 sm:h-6 object-contain brightness-0 invert"
                />
              </a>
            ))}
          </div>

          {/* ── Main content: heading+CTA left, columns right ── */}
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-12 lg:gap-16 mb-14 sm:mb-16">
            {/* Left: heading + CTA */}
            <div className="max-w-sm shrink-0">
              <h3 className="text-2xl sm:text-3xl font-bold leading-[1.15] tracking-tight mb-6 uppercase">
                Ready to take
                <br />
                control of your
                <br />
                medical records?
              </h3>

              {/* White pill CTA with black circle + white arrow */}
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center gap-2.5 bg-white text-[#020924] font-semibold rounded-full pl-5 pr-1.5 py-1.5 text-sm sm:text-base transition-all duration-300 hover:bg-gray-50 active:scale-[0.98] group"
              >
                <span>Join The Waitlist</span>
                <span className="w-8 h-8 rounded-full bg-[#020924] text-white flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
                  <ArrowUpRightIcon className="w-4 h-4" strokeWidth={2.5} />
                </span>
              </button>
            </div>

            {/* Right: three link columns */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 sm:gap-12 lg:gap-16 flex-1">
              {/* PRODUCT */}
              <div>
                <h4 className="font-bold text-white/70 text-xs uppercase tracking-widest mb-4">
                  Product
                </h4>
                <ul className="space-y-2.5 text-sm font-medium">
                  <li>
                    <Link to="/login" className="hover:text-white/80 transition-colors">
                      Patient Dashboard
                    </Link>
                  </li>
                  <li>
                    <Link to="/login" className="hover:text-white/80 transition-colors">
                      Hospital Portal
                    </Link>
                  </li>
                  <li>
                    <Link to="/login" className="hover:text-white/80 transition-colors">
                      Researcher Portal
                    </Link>
                  </li>
                  <li>
                    <Link to="/login" className="hover:text-white/80 transition-colors">
                      Insurer Portal
                    </Link>
                  </li>
                  <li>
                    <Link to="/pricing" className="hover:text-white/80 transition-colors">
                      Pricing
                    </Link>
                  </li>
                </ul>
              </div>

              {/* COMPANY */}
              <div>
                <h4 className="font-bold text-white/70 text-xs uppercase tracking-widest mb-4">
                  Company
                </h4>
                <ul className="space-y-2.5 text-sm font-medium">
                  <li>
                    <Link to="/about" className="hover:text-white/80 transition-colors">
                      About
                    </Link>
                  </li>
                  <li>
                    <a
                      href="https://samuel-amanze.vercel.app/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-white/80 transition-colors"
                    >
                      Schedule a Meeting
                    </a>
                  </li>
                  <li>
                    <Link to="/careers" className="hover:text-white/80 transition-colors">
                      Careers
                    </Link>
                  </li>
                </ul>
              </div>

              {/* LEGAL */}
              <div>
                <h4 className="font-bold text-white/70 text-xs uppercase tracking-widest mb-4">
                  Legal
                </h4>
                <ul className="space-y-2.5 text-sm font-medium">
                  <li>
                    <Link to="/privacy" className="hover:text-white/80 transition-colors">
                      Privacy Policy
                    </Link>
                  </li>
                  <li>
                    <Link to="/terms" className="hover:text-white/80 transition-colors">
                      Terms of use
                    </Link>
                  </li>
                  <li>
                    <Link to="/cookie-policy" className="hover:text-white/80 transition-colors">
                      Cookie Policy
                    </Link>
                  </li>
                  <li>
                    <Link to="/dpa" className="hover:text-white/80 transition-colors">
                      DPA
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* ── Bottom bar ── */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-6 border-t border-white/20 text-xs text-white/70">
            <span>© 2026 Selorah Health</span>
            <span className="hidden sm:inline">All Rights Reserved.</span>
            <div className="flex items-center gap-4">
              <Link to="/about" className="hover:text-white transition-colors">
                Help Center
              </Link>
              <Link to="/about" className="hover:text-white transition-colors">
                Contact
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
