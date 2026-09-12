import { useState, useEffect, useRef } from 'react';
import {
  ShieldCheckIcon,
  CheckCircleIcon,
  LockClosedIcon,
  XCircleIcon,
  DocumentTextIcon,
  QrCodeIcon,
  HandRaisedIcon,
} from '@heroicons/react/24/outline';
import WaitlistModal, { type WaitlistRole } from '../components/WaitlistModal';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SEOTitle from '../components/SEOTitle';

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
      <Header />

      {/* HERO */}
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
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-medium text-white mb-5 sm:mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" aria-hidden />
              Health records for Africa
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-medium leading-[1.08] tracking-tighter text-white mb-6 sm:mb-8">
              Tired of chasing
              <br className="hidden sm:block" /> your own{' '}
              <span className="text-primary">records</span>?
            </h1>

            <p className="text-base sm:text-lg md:text-xl text-white/80 max-w-xl leading-relaxed mb-8 sm:mb-12 mx-auto">
              Selorah keeps your health history in your hands. Share with a clinic{' '}
              <em className="not-italic sm:italic text-white">when you choose</em>, not forever.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-stretch sm:items-center w-full sm:w-auto">
              <button
                type="button"
                onClick={() => openWaitlist('patient', 'hero')}
                className="order-1 sm:order-2 inline-flex items-center justify-center px-6 sm:px-8 py-3.5 sm:py-4 bg-primary sm:bg-transparent hover:bg-primary-hover sm:hover:bg-white/10 border-2 border-primary sm:border-white/80 text-white font-semibold rounded-full text-base sm:text-lg transition-all active:scale-[0.985] min-h-[48px]"
              >
                <span className="sm:hidden">Join waitlist</span>
                <span className="hidden sm:inline">Join the Waitlist</span>
              </button>
              <button
                type="button"
                onClick={() =>
                  document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })
                }
                className="order-2 sm:order-1 inline-flex items-center justify-center px-6 sm:px-8 py-3.5 sm:py-4 bg-transparent sm:bg-primary border-2 border-white/50 sm:border-transparent hover:bg-white/10 sm:hover:bg-primary-hover text-white font-semibold rounded-full text-base sm:text-lg transition-all active:scale-[0.985] min-h-[48px]"
              >
                <span className="sm:hidden">How it works</span>
                <span className="hidden sm:inline">How It Works</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Social proof */}
      <section className="bg-white py-12 sm:py-16 text-center px-4 sm:px-6 border-b border-[var(--border)]">
        <div className="max-w-3xl mx-auto flex flex-col items-center">
          <img
            src="/assets/custom-avatar-badge.png"
            alt="People joining Selorah across Africa"
            className="mb-5 w-full max-w-[240px] sm:max-w-[360px] h-auto"
            loading="lazy"
          />
          <p className="text-base sm:text-lg text-gray-700 font-medium max-w-lg">
            Patients and clinics across Africa are joining the waitlist for{' '}
            <em className="text-primary not-italic font-semibold">early access</em>.
          </p>
        </div>
      </section>

      {/* PROBLEM */}
      <section className="py-16 sm:py-20 md:py-24 px-4 sm:px-6 lg:px-12 max-w-7xl mx-auto">
        <div className="mb-10 sm:mb-16">
          <p className="text-primary font-bold tracking-wider text-sm mb-3 sm:mb-4 uppercase">
            The Problem
          </p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold max-w-3xl leading-tight">
            Patients still carry their history in their heads, or{' '}
            <span className="text-primary">not at all</span>.
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {[
            {
              title: 'Lost files, repeated stories',
              body: 'Every new hospital means starting over: tests, history, and time already spent.',
            },
            {
              title: 'Clinics work without context',
              body: 'Without a portable record, providers re-test or delay care when minutes matter.',
            },
            {
              title: 'No control over copies',
              body: 'Folders move. You rarely control who keeps a copy or for how long.',
            },
          ].map((item) => (
            <div
              key={item.title}
              className="bg-gray-50 border border-[var(--border)] rounded-2xl p-6 sm:p-8"
            >
              <h3 className="text-lg sm:text-xl font-bold mb-3">{item.title}</h3>
              <p className="text-muted text-sm sm:text-base leading-relaxed">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section
        id="how-it-works"
        className="py-16 sm:py-20 md:py-24 bg-gray-50 border-y border-[var(--border)] scroll-mt-24"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
          <div className="text-center mb-12 sm:mb-16">
            <p className="text-primary font-bold tracking-wider text-sm mb-3 uppercase">
              How it works
            </p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">
              Three steps. <span className="text-primary">You stay in control.</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {[
              {
                n: '1',
                icon: DocumentTextIcon,
                title: 'Save your records',
                body: 'Keep key history in one place on your phone, not scattered across hospital counters.',
              },
              {
                n: '2',
                icon: QrCodeIcon,
                title: 'Share with a code',
                body: 'When a clinic needs access, you show a time-limited code or link. Only what you allow.',
              },
              {
                n: '3',
                icon: HandRaisedIcon,
                title: 'Revoke anytime',
                body: 'Access ends when you say so. Your story does not live on their desk forever.',
              },
            ].map((step) => (
              <div
                key={step.n}
                className="bg-white rounded-3xl border border-[var(--border)] p-6 sm:p-8 flex flex-col"
              >
                <div className="flex items-center gap-3 mb-5">
                  <span className="w-10 h-10 rounded-full bg-primary text-white font-bold flex items-center justify-center text-lg">
                    {step.n}
                  </span>
                  <step.icon className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                <p className="text-muted text-sm sm:text-base leading-relaxed">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AUDIENCES */}
      <section className="py-16 sm:py-20 md:py-24 px-4 sm:px-6 lg:px-12 max-w-7xl mx-auto">
        <div className="mb-10 sm:mb-14 text-center max-w-2xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Built for the full <span className="text-primary">care journey</span>
          </h2>
          <p className="text-muted text-base sm:text-lg">
            One platform. Clear outcomes for patients, clinics, and partners.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              id: 'patients',
              role: 'patient' as WaitlistRole,
              title: 'For Patients',
              desc: 'Stop retelling your history at every hospital. Share when you need to. Revoke when you do not.',
              features: [
                'Records in your hands',
                'Share with a code at the clinic',
                'Emergency info when it counts',
              ],
            },
            {
              id: 'hospitals',
              role: 'hospital' as WaitlistRole,
              title: 'For Hospitals and Clinics',
              desc: 'Faster intake when patients bring a clear trail. Less missing paperwork at the desk.',
              features: [
                'Scan or open a patient share',
                'See what they authorised',
                'Built for busy front desks',
              ],
            },
            {
              id: 'researchers',
              role: 'other' as WaitlistRole,
              title: 'For Researchers and Partners',
              desc: 'Consent-first participation. Patients stay in control of what they share.',
              features: [
                'Clear consent paths',
                'Structured participation',
                'Respect for patient ownership',
              ],
            },
          ].map((card) => (
            <div
              id={card.id}
              key={card.id}
              className="bg-white border border-[var(--border)] rounded-3xl p-6 sm:p-8 flex flex-col h-full scroll-mt-24"
            >
              <h3 className="text-xl sm:text-2xl font-bold mb-3">{card.title}</h3>
              <p className="text-muted mb-6 flex-1 text-sm sm:text-base leading-relaxed">{card.desc}</p>
              <ul className="space-y-2.5 mb-8">
                {card.features.map((feat) => (
                  <li key={feat} className="flex items-start gap-2.5">
                    <CheckCircleIcon className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <span className="text-sm font-medium">{feat}</span>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() => openWaitlist(card.role, `audience-${card.id}`)}
                className="w-full min-h-[48px] rounded-full border-2 border-primary text-primary font-semibold hover:bg-primary hover:text-white transition-colors"
              >
                Join as {card.role === 'other' ? 'partner' : card.role}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* TRUST */}
      <section className="bg-[#0A0B14] text-white py-16 sm:py-20 md:py-24 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 sm:mb-16 max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Ownership you can <span className="text-primary">feel</span>
            </h2>
            <p className="text-white/60 text-base sm:text-lg">
              Why Selorah exists, and why the timing matters for patients across Africa.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 sm:p-8">
              <LockClosedIcon className="w-8 h-8 text-primary mb-4" />
              <h3 className="text-lg sm:text-xl font-bold mb-3">You control access</h3>
              <p className="text-white/60 text-sm sm:text-base leading-relaxed">
                Share with a clinic for a limited time. When you revoke, access stops.
              </p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 sm:p-8">
              <XCircleIcon className="w-8 h-8 text-primary mb-4" />
              <h3 className="text-lg sm:text-xl font-bold mb-3">Not for sale</h3>
              <p className="text-white/60 text-sm sm:text-base leading-relaxed">
                We do not sell your health information. Privacy is part of the product.
              </p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 sm:p-8">
              <ShieldCheckIcon className="w-8 h-8 text-primary mb-4" />
              <h3 className="text-lg sm:text-xl font-bold mb-3">Why now</h3>
              <p className="text-white/60 text-sm sm:text-base leading-relaxed">
                Paper folders still decide care for millions. Digital ownership should not wait another decade.
              </p>
            </div>
          </div>
          <p className="text-center text-white/40 text-sm mt-10">
            Built by Selorah Health Limited. Shipping with patients and clinics.
          </p>
        </div>
      </section>

      {/* ROADMAP */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-12 max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <p className="text-primary font-bold tracking-wider text-sm mb-3 uppercase">Roadmap</p>
          <h2 className="text-3xl sm:text-4xl font-bold mb-3">
            Coming <span className="text-primary">next</span>
          </h2>
          <p className="text-muted text-sm sm:text-base">
            Dates may shift. Waitlist members hear first.
          </p>
        </div>
        <ol className="space-y-4">
          {[
            { when: 'Now', what: 'Waitlist and pilot design with clinics and patients' },
            { when: 'Next', what: 'Patient app early access: save records and share with a code' },
            { when: 'Later', what: 'Hospital tools and consent-first research flows' },
          ].map((item) => (
            <li
              key={item.when}
              className="flex gap-4 items-start bg-gray-50 border border-[var(--border)] rounded-2xl p-5 sm:p-6"
            >
              <span className="shrink-0 text-xs font-bold uppercase tracking-widest text-primary bg-primary/10 px-3 py-1.5 rounded-full">
                {item.when}
              </span>
              <p className="text-sm sm:text-base font-medium text-gray-900 pt-0.5">{item.what}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* WHAT HAPPENS NEXT */}
      <section className="py-16 sm:py-20 bg-gray-50 border-y border-[var(--border)] px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-10 sm:mb-12">
            What happens after you <span className="text-primary">join</span>?
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              {
                n: '1',
                title: 'You are on the list',
                body: 'We confirm by email. No payment. No app install yet.',
              },
              {
                n: '2',
                title: 'We prioritise by need',
                body: 'Patients, clinics, and partners get invites in waves so support stays solid.',
              },
              {
                n: '3',
                title: 'Early access',
                body: 'First access to the patient app, priority for pilots, and a say in what we build next.',
              },
            ].map((s) => (
              <div
                key={s.n}
                className="bg-white rounded-2xl border border-[var(--border)] p-6 text-center"
              >
                <div className="w-10 h-10 rounded-full bg-primary text-white font-bold flex items-center justify-center mx-auto mb-4">
                  {s.n}
                </div>
                <h3 className="font-bold text-lg mb-2">{s.title}</h3>
                <p className="text-muted text-sm leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="bg-white py-16 sm:py-20 px-4 sm:px-6 lg:px-12">
        <div className="max-w-3xl mx-auto text-center flex flex-col items-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4 tracking-tight">
            Own your <span className="text-primary">health records</span>
          </h2>
          <p className="text-base sm:text-lg text-muted mb-8 max-w-xl">
            Join the early wave building health record ownership across Africa.
          </p>
          <button
            type="button"
            onClick={() => openWaitlist('patient', 'final-cta')}
            className="bg-primary text-white px-8 sm:px-12 py-4 sm:py-5 rounded-full text-lg sm:text-xl font-bold hover:bg-primary-hover transition-all shadow-xl shadow-primary/25 active:scale-95 min-h-[48px] w-full sm:w-auto max-w-sm"
          >
            Join the Waitlist
          </button>
          <p className="text-xs text-muted mt-4">Free to join. Access updates only. Your data stays yours.</p>
        </div>
      </section>

      <div ref={footerSentinelRef} aria-hidden className="h-px" />
      <Footer />

      {showStickyCta && (
        <div className="sm:hidden fixed bottom-0 inset-x-0 z-40 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] bg-white/95 backdrop-blur-md border-t border-gray-100 shadow-[0_-8px_30px_rgba(0,0,0,0.08)]">
          <button
            type="button"
            onClick={() => openWaitlist('patient', 'sticky-mobile')}
            className="w-full bg-primary text-white font-bold py-3.5 rounded-full min-h-[48px] text-base"
          >
            Join waitlist
          </button>
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
