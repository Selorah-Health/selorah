"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import WaitlistModal from "@/components/WaitlistModal";
import {
  ChevronRightIcon,
  CheckCircleIcon,
  LockClosedIcon,
  ShieldCheckIcon,
  ArrowRightIcon,
  Bars3Icon,
  XMarkIcon
} from "@heroicons/react/24/outline";
import {
  CheckIcon,
  PlayIcon
} from "@heroicons/react/24/solid";

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
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [stepVideoEnded, setStepVideoEnded] = useState<boolean[]>([false, false, false, false]);
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);
  const stepVideoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const scrollLocked = useRef(false);

  const nextSlide = (currentSlide + 1) % HERO_SLIDES.length;

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  // // Scroll-lock logic: when a step enters view, lock scroll and play its video; unlock when done
  // useEffect(() => {
  //   const preventScroll = (e: WheelEvent | TouchEvent) => {
  //     if (scrollLocked.current) e.preventDefault();
  //   };
  //   window.addEventListener('wheel', preventScroll, { passive: false });
  //   window.addEventListener('touchmove', preventScroll, { passive: false });
  //   return () => {
  //     window.removeEventListener('wheel', preventScroll);
  //     window.removeEventListener('touchmove', preventScroll);
  //   };
  // }, []);

  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    stepRefs.current.forEach((ref, i) => {
      if (!ref) return;
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting && !stepVideoEnded[i]) {
              scrollLocked.current = true;
              const video = stepVideoRefs.current[i];
              if (video) {
                video.currentTime = 0;
                video.play().catch(() => { });
              }
            }
          });
        },
        { threshold: 0.55 }
      );
      observer.observe(ref);
      observers.push(observer);
    });
    return () => observers.forEach((o) => o.disconnect());
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
    setCurrentSlide(nextSlide);
  };

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] font-sans overflow-x-hidden selection:bg-primary/30 selection:text-primary">
      <WaitlistModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

      {/* NAVIGATION BAR */}
      <nav className="fixed top-0 w-full z-50 bg-black/20 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image src="/logo.svg" alt="Selorah Logo" width={45} height={45} />
            <span className="font-bold text-xl tracking-tight text-white">Selorah Health</span>
          </div>

          <div className="hidden lg:flex items-center gap-8 text-sm font-medium text-white/80">
            <Link href="#how-it-works" className="hover:text-white transition-colors">How It Works</Link>
            <button onClick={() => scrollToSection('hospitals')} className="hover:text-white transition-colors">For Hospitals</button>
            <button onClick={() => scrollToSection('researchers')} className="hover:text-white transition-colors">For Researchers</button>
            <button onClick={() => scrollToSection('insurers')} className="hover:text-white transition-colors">For Insurers</button>
            <Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link>
            <Link href="/login" className="px-6 py-2 rounded-full border border-white/20 hover:bg-white/10 transition-colors">Log in</Link>
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-primary text-white px-6 py-2 rounded-full font-bold hover:bg-primary-hover transition-colors"
            >
              Join Waitlist
            </button>
          </div>

          <button className="lg:hidden text-white" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <XMarkIcon className="w-6 h-6" /> : <Bars3Icon className="w-6 h-6" />}
          </button>
        </div>
      </nav>

      {/* MOBILE MENU */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-40 bg-[#0A0B14] pt-24 px-6 lg:hidden">
          <div className="flex flex-col gap-6 text-xl font-medium text-white/80">
            <Link href="#how-it-works" onClick={() => setIsMenuOpen(false)}>How It Works</Link>
            <button onClick={() => { scrollToSection('hospitals'); setIsMenuOpen(false); }} className="text-left">For Hospitals</button>
            <button onClick={() => { scrollToSection('researchers'); setIsMenuOpen(false); }} className="text-left">For Researchers</button>
            <button onClick={() => { scrollToSection('insurers'); setIsMenuOpen(false); }} className="text-left">For Insurers</button>
            <Link href="/pricing" onClick={() => setIsMenuOpen(false)}>Pricing</Link>
            <Link href="/login" className="text-primary" onClick={() => setIsMenuOpen(false)}>Log in</Link>
            <button
              onClick={() => { setIsModalOpen(true); setIsMenuOpen(false); }}
              className="bg-primary text-white py-4 rounded-xl font-bold"
            >
              Join Waitlist
            </button>
          </div>
        </div>
      )}

      {/* HERO SECTION */}
      <section className="relative w-full overflow-hidden bg-black" style={{ height: '100svh', minHeight: '700px' }}>
        {/* Background Video Carousel — full width */}
        {HERO_SLIDES.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
          >
            <video
              autoPlay
              muted
              loop
              playsInline
              className="absolute inset-0 w-full h-full object-cover opacity-60"
            >
              <source src={slide.video} type="video/mp4" />
            </video>

            {/* Hero content: vertically centered in left ~60% of screen, stopping above card */}
            {/* On desktop: card is 384px tall, content lives in (viewport - 384px), centered */}
            <div className="relative z-10 h-full flex flex-col">
              {/* Spacer for nav (80px) */}
              <div className="h-20 shrink-0" />

              {/* Content area above card — takes remaining height minus card (~384px) */}
              <div
                className="flex flex-col justify-center px-6 flex-1"
                style={{ paddingBottom: 'clamp(120px, 25vh, 400px)' }}
              >
                <div className="max-w-2xl space-y-6 mx-auto w-full lg:ml-[8%] lg:mr-auto">
                  <h1 className="text-5xl lg:text-6xl xl:text-7xl font-medium leading-[1.05] tracking-tight text-white">
                    {slide.title} {slide.subtitle && (
                      <span className="italic font-light">{slide.subtitle}</span>
                    )}
                  </h1>

                  <p className="text-base text-white/80 max-w-md leading-relaxed">
                    {slide.description}
                  </p>

                  <div className="pt-2">
                    <Link href={slide.buttonLink} className="inline-flex items-center gap-3 text-white font-bold tracking-widest border-b-2 border-white/20 pb-2 hover:border-primary transition-all group">
                      <ChevronRightIcon className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                      {slide.buttonText}
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Slide dots — sit in the middle of the bottom padding, centered over left content area */}
        {/* Desktop: content occupies (100vw - 380px) width; dots centered there */}
        {/* Mobile: centered over full width */}
        <div
          className="absolute z-20 hidden lg:flex gap-2"
          style={{
            bottom: 'calc(clamp(120px, 25vh, 400px) / 2)',
            left: 'calc((100% - 380px) / 2)',
            transform: 'translateX(-50%)',
          }}
        >
          {HERO_SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentSlide(i)}
              className={`h-1 rounded-full transition-all duration-500 ${i === currentSlide ? 'w-8 bg-primary' : 'w-2 bg-white/30'}`}
            />
          ))}
        </div>
        {/* Mobile dots */}
        <div
          className="absolute z-20 flex lg:hidden gap-2"
          style={{ bottom: '5rem', left: '50%', transform: 'translateX(-50%)' }}
        >
          {HERO_SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentSlide(i)}
              className={`h-1 rounded-full transition-all duration-500 ${i === currentSlide ? 'w-8 bg-primary' : 'w-2 bg-white/30'}`}
            />
          ))}
        </div>

        {/* NEXT SLIDE PREVIEW CARD — anchored bottom-right, fully visible */}
        <div
          className={`absolute bottom-0 right-0 z-20 w-[350px] 
            bg-white overflow-hidden shadow-2xl transition-all 
            duration-1000 delay-500 
            ${isLoaded ? 'translate-y-0  opacity-100' : 'translate-y-20 opacity-0'}`}
        >
          <div className="relative aspect-video">
            <video
              autoPlay
              muted
              loop
              playsInline
              className="w-full h-full object-cover"
            >
              <source src={HERO_SLIDES[nextSlide].video} type="video/mp4" />
            </video>
            <div className="absolute inset-0 bg-black/20"></div>
          </div>

          <div className="p-6 space-y-4">
            <h3 className="text-lg font-bold text-gray-900 leading-tight">
              {HERO_SLIDES[nextSlide].id === 2 ? '"Tired of Chasing Your Own Records?"' : 'Securing Health Records from Patient to Provider'}
            </h3>
            <p className="text-sm text-gray-500">
              {HERO_SLIDES[nextSlide].id === 2
                ? "Selorah Health gives you full ownership — encrypted, portable, private. Access your data anytime, anywhere, with anyone you trust."
                : "At Selorah Health, we transform how your medical history travels with you — putting ownership where it has always belonged: in your hands."}
            </p>
            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => setIsModalOpen(true)}
                className="text-primary text-sm font-bold flex items-center gap-1 group"
              >
                Join the Waitlist
                <ArrowRightIcon className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>
              <button
                onClick={handleNextSlide}
                className="text-[10px] font-black text-gray-400 tracking-widest uppercase flex items-center gap-2 group"
              >
                NEXT STORY
                <div className="w-6 h-6 rounded-full border-2 border-gray-200 flex items-center justify-center transition-colors group-hover:border-primary group-hover:bg-primary/5">
                  <ChevronRightIcon className="w-3 h-3 text-gray-400 group-hover:text-primary" />
                </div>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* AVATAR BADGE SECTION */}
      <section className="bg-white py-24 text-center px-6">
        <div className="max-w-4xl mx-auto flex flex-col items-center">
          <Image
            src="/assets/custom-avatar-badge.png"
            alt="User Avatars"
            width={400}
            height={80}
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

      {/* THE PROBLEM */}
      <section className="py-24 px-6 max-w-7xl mx-auto">
        <div className="mb-16">
          <p className="text-primary font-bold tracking-wider text-sm mb-4 uppercase">The Problem</p>
          <h2 className="text-4xl md:text-5xl font-bold max-w-3xl leading-tight">
            Nigerian patients carry their health history in their heads — or not at all.
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {[
            {
              quote: "Our friend had an accident, was rushed to the hospital where the nurses insisted that we purchase a card before they can touch her. We lost her between the nurses' reluctance and procuring the money",
              author: "Chisom, 34, Lagos"
            },
            {
              quote: "I wanted to have my baby in a different environment. Changing locations now seemed like a life-changing decision, because you would have to start over with a new doctor. New tests, injections, trying to connect or 'trust' the doctor. And I hated injections.",
              author: "Precious, 41, Ibadan"
            },
            {
              quote: "I travelled for surgery abroad. I spent two weeks gathering records from four hospitals before they would operate.",
              author: "Tunde, 38, Abuja"
            }
          ].map((item, i) => (
            <div key={i} className="bg-white border border-[var(--border)] p-8 rounded-2xl shadow-sm">
              <span className="text-primary text-6xl font-serif block mb-4 opacity-20">"</span>
              <p className="text-lg font-medium mb-6 leading-relaxed mt-[-2rem]">{item.quote}</p>
              <p className="text-muted text-sm">— {item.author}</p>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS — videos autoplay per step; scroll is locked until each video ends */}
      <section id="how-it-works" className="py-24 bg-gray-50 border-y border-[var(--border)]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <p className="text-primary font-bold tracking-wider text-sm mb-4 uppercase">How It Works</p>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Four steps. One QR. Complete control.</h2>
            <p className="text-xl text-muted">From uploading your first record to sharing it with a doctor across the country — the whole flow takes minutes.</p>
          </div>

          <div className="space-y-24">
            {[
              {
                step: "01",
                title: "Add Your Records",
                desc: "Scan a paper document, upload a file, or connect directly to a hospital on the Selorah network. Records are encrypted on your device before they leave it. We cannot read them.",
                video: "/assets/how-it-works-1.mp4"
              },
              {
                step: "02",
                title: "Your QR is Always Ready",
                desc: "Open Selorah. Tap Share. One QR. Any doctor, any hospital, any city, any country. You set how long they have access — one hour, one day, one week.",
                video: "/assets/how-it-works-2.mp4"
              },
              {
                step: "03",
                title: "Doctors See Your History",
                desc: "Lab results. Prescriptions. Diagnoses. Vaccinations. Each record labelled by its source. Verified records carry a green badge. Your doctor always knows what they're looking at.",
                video: "/assets/how-it-works-3.mp4"
              },
              {
                step: "04",
                title: "You See Who Looked",
                desc: "Every scan, every access — logged permanently on the blockchain. You can audit your own history at any time. You decide. You revoke. You're in control.",
                video: "/assets/how-it-works-4.mp4"
              }
            ].map((stepper, i) => (
              <div
                key={i}
                ref={(el: HTMLDivElement | null) => { stepRefs.current[i] = el; }}
                className={`flex flex-col ${i % 2 === 1 ? "md:flex-row-reverse" : "md:flex-row"} items-center gap-12`}
              >
                <div className="flex-1 space-y-6">
                  <div className="text-primary/20 text-6xl font-bold mb-2">{stepper.step}</div>
                  <h3 className="text-3xl font-bold">{stepper.title}</h3>
                  <p className="text-lg text-muted leading-relaxed">{stepper.desc}</p>
                  {!stepVideoEnded[i] && (
                    <div className="flex items-center gap-2 text-sm text-primary/70 font-medium">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                      <span>Watch to continue scrolling</span>
                    </div>
                  )}
                </div>
                <div className="flex-1 w-full relative">
                  <div className="aspect-[4/3] bg-gray-900 rounded-3xl border border-[var(--border)] overflow-hidden shadow-lg relative">
                    <video
                      ref={(el: HTMLVideoElement | null) => { stepVideoRefs.current[i] = el; }}
                      muted
                      playsInline
                      preload="auto"
                      onEnded={() => handleStepVideoEnd(i)}
                      className="absolute inset-0 w-full h-full object-cover"
                    >
                      <source src={stepper.video} type="video/mp4" />
                    </video>
                    {!stepVideoEnded[i] && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
                          <PlayIcon className="w-8 h-8 text-white ml-1" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BUILT FOR EVERYONE */}
      <section className="py-24 px-6 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <p className="text-primary font-bold tracking-wider text-sm mb-4 uppercase">Built for Everyone</p>
          <h2 className="text-4xl md:text-5xl font-bold mb-6">One platform. Every stakeholder.</h2>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {[
            {
              id: 'patients',
              icon: <UserCircleIcon className="w-12 h-12 text-primary" />,
              title: "For Patients",
              desc: "Take full ownership of your medical history. Share it instantly. Revoke access immediately. Earn from contributing your anonymised data to research.",
              features: ["Encrypted records on your device", "QR-based sharing with any provider", "Emergency profile always accessible", "Family health vault (up to 6 members)", "Monthly research earnings"]
            },
            {
              id: 'hospitals',
              icon: <BuildingOffice2Icon className="w-12 h-12 text-primary" />,
              title: "For Hospitals & Clinics",
              desc: "Stop asking patients for records they don't have. Scan a QR and see their verified history instantly — on any device, no installation required.",
              features: ["Instant QR scan access", "Verified record provenance badges", "Add & cosign records directly", "Staff roles & permissions", "FHIR R4 EMR integration"]
            },
            {
              id: 'researchers',
              icon: <BeakerIcon className="w-12 h-12 text-primary" />,
              title: "For Researchers & Insurers",
              desc: "Access consented, longitudinal African health data. 75% of every study budget goes directly to patients. The split is enforced by smart contract — immutable.",
              features: ["IRB-verified researchers only", "Differential privacy enforced", "Real-time cohort size estimates", "Automatic monthly patient payouts", "Fraud detection tools for insurers"]
            }
          ].map((card, i) => (
            <div id={card.id} key={i} className="bg-white border border-[var(--border)] rounded-3xl p-8 hover:shadow-xl transition-shadow flex flex-col h-full scroll-mt-24">
              <div className="mb-6">{card.icon}</div>
              <h3 className="text-2xl font-bold mb-4">{card.title}</h3>
              <p className="text-muted mb-8 flex-1">{card.desc}</p>
              <ul className="space-y-3">
                {card.features.map((feat, j) => (
                  <li key={j} className="flex items-start gap-3">
                    <CheckCircleIcon className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <span className="text-sm font-medium">{feat}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* PRIVACY ARCHITECTURE */}
      <section className="bg-[#0A0B14] text-white py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-16">
            <p className="text-primary font-bold tracking-wider text-sm mb-4 uppercase">The Architecture</p>
            <h2 className="text-4xl md:text-5xl font-bold max-w-3xl leading-tight mb-6">
              We built it so that even we can't see your data.
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm">
              <LockClosedIcon className="w-8 h-8 text-primary mb-4" />
              <h3 className="text-xl font-bold mb-4">Your Key. Your Phone.</h3>
              <p className="text-white/60 leading-relaxed">Records are encrypted on your device before uploading. Selorah's servers receive a locked file with no key.</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm">
              <XCircleIcon className="w-8 h-8 text-primary mb-4" />
              <h3 className="text-xl font-bold mb-4">Deletion is Real.</h3>
              <p className="text-white/60 leading-relaxed">When you delete a record, it is permanently removed from our servers and cryptographically erased.</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm">
              <ShieldCheckIcon className="w-8 h-8 text-primary mb-4" />
              <h3 className="text-xl font-bold mb-4">Revocation is Instant.</h3>
              <p className="text-white/60 leading-relaxed">When you revoke access, it is recorded on the blockchain immediately and irreversibly.</p>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#0A0B14] text-white pt-24 pb-12 px-6 border-t border-white/10 overflow-hidden relative">
        {/* Background Text from Image 4 */}
        <div className="absolute bottom-0 left-0 w-full opacity-5 pointer-events-none select-none">
          <h2 className="text-[20vw] font-black leading-none whitespace-nowrap -mb-8">selorahealth</h2>
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-24">
            <div className="lg:col-span-1">
              <div className="flex items-center mb-8">
                <Image src="/logo.svg" alt="Selorah Logo" width={45} height={45} />
              </div>
            </div>

            <div>
              <h4 className="font-bold text-gray-500 text-xs uppercase tracking-widest mb-6">Product</h4>
              <ul className="space-y-4 text-sm font-medium text-gray-300">
                <li><Link href="#" className="hover:text-white transition-colors">Patient App</Link></li>
                <li><button onClick={() => scrollToSection('hospitals')} className="hover:text-white transition-colors">Hospital Portal</button></li>
                <li><button onClick={() => scrollToSection('researchers')} className="hover:text-white transition-colors">Research Portal</button></li>
                <li><button onClick={() => scrollToSection('insurers')} className="hover:text-white transition-colors">Insurer Portal</button></li>
                <li><Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-gray-500 text-xs uppercase tracking-widest mb-6">Company</h4>
              <ul className="space-y-4 text-sm font-medium text-gray-300">
                <li><Link href="#" className="hover:text-white transition-colors">About</Link></li>
                <li><Link href="https://samuel-amanze.vercel.app/" className="hover:text-white transition-colors">Schedule a meeting</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Career</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-gray-500 text-xs uppercase tracking-widest mb-6">Legal</h4>
              <ul className="space-y-4 text-sm font-medium text-gray-300">
                <li><Link href="#" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Terms of use</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Cookie Policy</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Data Processing Agreement</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-gray-500 text-xs uppercase tracking-widest mb-6">Social</h4>
              <ul className="space-y-4 text-sm font-medium text-gray-300">
                <li><Link href="https://linkedin.com/company/selorahealth/" className="hover:text-white transition-colors">LinkedIn</Link></li>
                <li><Link href="https://x.com/selorahealth" className="hover:text-white transition-colors">X/Twitter</Link></li>
                <li><Link href="https://chat.whatsapp.com/JI2LK41IF8yHiJjEuWKk2M?mode=gi_t" className="hover:text-white transition-colors">WhatsApp Community</Link></li>
              </ul>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between pt-12 border-t border-white/5 gap-8">
            <div className="text-gray-500 text-xs flex flex-wrap justify-center gap-6">
              <span>Copyright (c) 2026, Selorah Health Limited. All rights reserved.</span>
            </div>

            <div className="flex-1 max-w-md w-full md:px-8">
              <button
                onClick={() => setIsModalOpen(true)}
                className="bg-primary text-white px-6 py-2 rounded-full font-bold hover:bg-primary-hover transition-colors"
              >
                Join Waitlist
              </button>
            </div>

            <div className="text-gray-500 text-xs flex gap-6">
              <Link href="#" className="hover:text-white transition-colors">Terms</Link>
              <Link href="#" className="hover:text-white transition-colors">Privacy Policy</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Sub-components to avoid missing imports
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

function XCircleIcon(props: any) {
  return (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}