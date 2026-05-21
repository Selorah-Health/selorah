import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Bars3Icon,
  XMarkIcon,
  ShieldCheckIcon,
  ArrowPathIcon,
  GlobeAltIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
  ArrowUpRightIcon,
  PlayIcon,
  CheckCircleIcon,
  LockClosedIcon,
  XCircleIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';

import WaitlistModal from '../components/WaitlistModal';
import LanguageSelector from '../components/LanguageSelector';
import { useLanguage } from '../contexts/LanguageContext';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SEOTitle from '../components/SEOTitle';

const HERO_SLIDES = [
  {
    id: 1,
    video: "/assets/hero-bg-video-1.mp4",
    title: "Securing Health Records",
    subtitle: "from Patient to Provider",
    description: "At Selorah Health, we transform how your medical history travels with you — putting ownership where it has always belonged: in your hands.",
    buttonText: "HERE'S HOW IT WORKS",
    buttonLink: "#how-it-works"
  },
  {
    id: 2,
    video: "/assets/hero-bg-video-2.mp4",
    title: "Tired of Chasing Your Own Records?",
    subtitle: "",
    description: "Selorah Health gives you full ownership — encrypted, portable, private. Access your data anytime, anywhere, with anyone you trust.",
    buttonText: "HERE'S HOW IT WORKS",
    buttonLink: "#how-it-works"
  }
];

export default function LandingPage() {
  const { t } = useLanguage();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [stepVideoEnded, setStepVideoEnded] = useState<boolean[]>([false, false, false, false]);

  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);
  const stepVideoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const scrollLocked = useRef(false);

  useEffect(() => {
    setIsLoaded(true);
    // Auto-advance slides every 10 seconds (if you re-enable carousel)
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  // IntersectionObserver for step videos
  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    const timers: (number | undefined)[] = [];

    stepRefs.current.forEach((ref, i) => {
      if (!ref) return;

      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !stepVideoEnded[i]) {
            scrollLocked.current = true;
            const video = stepVideoRefs.current[i];
            if (video) {
              video.currentTime = 0;
              video.play()
                .then(() => {
                  const timer = window.setTimeout(() => {
                    video.pause();
                    handleStepVideoEnd(i);
                    const nextIndex = i + 1;
                    if (stepRefs.current[nextIndex]) {
                      stepRefs.current[nextIndex]!.scrollIntoView({ behavior: 'smooth' });
                    } else {
                      scrollLocked.current = false;
                    }
                  }, 5000);

                  timers[i] = timer;

                  video.onpause = () => {
                    if (timers[i]) clearTimeout(timers[i]);
                  };
                })
                .catch(() => {});
            }
          }
        });
      }, { threshold: 0.3 });

      observer.observe(ref);
      observers.push(observer);
    });

    return () => {
      observers.forEach((o) => o.disconnect());
      timers.forEach((t) => t && clearTimeout(t));
    };
  }, [stepVideoEnded]);

  const handleStepVideoEnd = (i: number) => {
    setStepVideoEnded((prev) => {
      const next = [...prev];
      next[i] = true;
      return next;
    });
    scrollLocked.current = false;
  };

  const handleNextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
  };

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] font-sans overflow-x-hidden selection:bg-primary/30 selection:text-primary">
      <SEOTitle title="The OS for Health Records" />
      <Header />

      {/* HERO SECTION - Static (carousel logic kept but not used) */}
      <section className="relative w-full overflow-hidden bg-black min-h-[100svh] flex items-center pt-20">
        {/* Background Video */}
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover opacity-40"
        >
          <source src="/assets/hero-bg-video-1.mp4" type="video/mp4" />
        </video>

        {/* Content Overlay */}
        <div className="relative z-10 max-w-5xl mx-auto px-6 lg:px-12 pt-12 pb-24">
          <div className="max-w-3xl">
            {/* Tag */}
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-4 py-1.5 text-sm font-medium text-white mb-6">
              <span className="text-primary">🌍</span>
              Building the future of health records in Africa
            </div>

            {/* Main Heading */}
            <h1 className="text-6xl lg:text-7xl font-medium leading-[1.05] tracking-tighter text-white mb-8">
              Tired of chasing<br />your own records?
            </h1>

            {/* Description */}
            <p className="text-xl text-white/80 max-w-xl leading-relaxed mb-12">
              Selorah Health gives you full ownership — encrypted, portable, and private.
              Access your data anytime, anywhere, with anyone you trust.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href="#how-it-works"
                className="inline-flex items-center justify-center px-8 py-4 bg-primary hover:bg-primary-hover text-white font-semibold rounded-full text-lg transition-all active:scale-[0.985]"
              >
                Get Started
              </a>
              <button
                onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
                className="inline-flex items-center justify-center px-8 py-4 border border-white/60 hover:bg-white/10 text-white font-semibold rounded-full text-lg transition-all backdrop-blur-sm"
              >
                Here's How It Works →
              </button>
            </div>
          </div>
        </div>

        {/* Subtle gradient overlay at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-black to-transparent pointer-events-none" />
      </section>

      {/* Rest of your sections remain the same */}
      {/* AVATAR BADGE SECTION */}
      <section className="bg-white py-24 text-center px-12">
        <div className="max-w-4xl mx-auto flex flex-col items-center">
          <img
            src="/assets/custom-avatar-badge.png"
            alt="User Avatars"
            className="mb-8 w-[400px] md:w-[600px] h-auto"
          />
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">
            Building across Africa — join the early wave
          </h2>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-primary text-white px-12 py-5 rounded-full text-xl font-bold hover:bg-primary-hover transition-all shadow-xl shadow-primary/25 hover:scale-105 active:scale-95"
          >
            Join the Waitlist
          </button>
        </div>
      </section>

      {/* ... (THE PROBLEM, HOW IT WORKS, BUILT FOR EVERYONE, PRIVACY ARCHITECTURE sections unchanged) ... */}

      <Footer />

      {/* Waitlist Modal */}
      {isModalOpen && <WaitlistModal onClose={() => setIsModalOpen(false)} />}
    </div>
  );
}

/* ====================== Sub-components ====================== */
function UserCircleIcon(props: any) {
  return (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function BuildingOffice2Icon(props: any) {
  return (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
    </svg>
  );
}

function BeakerIcon(props: any) {
  return (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v1.244c0 .892-.567 1.686-1.414 1.99L4.389 7.75c-.279.1-.476.367-.476.665v10.332c0 .851.81 1.45 1.63 1.23l12.445-3.333c.82-.22 1.63.379 1.63 1.23V7.125c0-.298-.197-.565-.476-.665l-3.947-1.412c-.847-.304-1.414-1.098-1.414-1.99V3.104m-9.75 0h9.75M9 6h6m-7 4.5h8M3.375 19.5h17.25" />
    </svg>
  );
}
