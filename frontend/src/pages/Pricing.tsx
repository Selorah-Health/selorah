import { useState } from 'react';
import { CheckIcon } from '@heroicons/react/24/solid';
import Header from '../components/Header';
import CTAButton from '../components/CTAButton';
import Footer from '../components/Footer';
import SEOTitle from '../components/SEOTitle';
import WaitlistModal from '../components/WaitlistModal';

const NGN_RATE = 1400; // ₦ per $1

function formatNaira(usd: number) {
  const ngn = usd * NGN_RATE;
  return `₦${ngn.toLocaleString('en-NG', { maximumFractionDigits: 0 })}`;
}

function formatUsd(usd: number) {
  return `$${usd.toLocaleString('en-US', { minimumFractionDigits: usd % 1 === 0 ? 0 : 2, maximumFractionDigits: 2 })}`;
}

export default function Pricing() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] font-sans selection:bg-primary/30 selection:text-primary overflow-x-hidden">
      <SEOTitle title="Pricing" />
      <Header />

      {/* HERO — same background treatment as landing hero */}
      <section className="relative w-full overflow-hidden bg-black min-h-[42vh] sm:min-h-[48vh] flex items-center pt-20 sm:pt-24">
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

        <div className="relative z-10 max-w-6xl mx-auto px-5 sm:px-8 lg:px-10 py-16 sm:py-20 text-center">
          <p className="text-[#6183FF] font-bold tracking-wider text-sm mb-4 uppercase">
            Transparent Pricing
          </p>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-tight mb-6 text-white">
            A sustainable model for
            <br />
            <span className="text-[#6183FF] italic font-normal">health data ownership</span>
          </h1>
          <p className="text-base sm:text-lg text-white/75 leading-relaxed max-w-2xl mx-auto">
            Why do patients pay? Because when the product is free, you are the product. We charge a
            minimal subscription so your data remains entirely yours—encrypted, secure, and never
            sold without your explicit consent and compensation.
          </p>
        </div>
      </section>

      {/* PRICING CARDS */}
      <section className="py-12 sm:py-16 px-5 sm:px-8 lg:px-10 max-w-6xl mx-auto">
        <div className="grid md:grid-cols-3 gap-6 sm:gap-8">
          {/* Patient Tier */}
          <div className="bg-white border-2 border-[#6183FF] rounded-3xl p-6 sm:p-8 shadow-xl relative flex flex-col">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#6183FF] text-white text-xs font-bold uppercase tracking-wider px-4 py-1 rounded-full">
              For Individuals
            </div>
            <h3 className="text-2xl font-bold mb-2 text-gray-900 mt-2">Patient Premium</h3>
            <p className="text-muted mb-6 min-h-[3rem]">Full control over your medical history, forever.</p>
            <div className="mb-8">
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-4xl sm:text-5xl font-bold text-gray-900">{formatNaira(3)}</span>
                <span className="text-muted font-medium">/ month</span>
              </div>
              <p className="text-sm text-muted mt-1">≈ {formatUsd(3)} USD</p>
              <p className="text-xs text-[#6183FF] font-bold mt-2">
                *Early access pricing locked in forever
              </p>
            </div>
            <ul className="space-y-3 mb-8 flex-1">
              {[
                'Unlimited encrypted record storage',
                'QR sharing with providers',
                'Emergency profile',
                'Family health vault (up to 6 members)',
                'Opt-in research earnings (₦2k – ₦8k/mo)',
              ].map((feat) => (
                <li key={feat} className="flex items-start gap-3">
                  <CheckIcon className="w-5 h-5 text-[#6183FF] shrink-0 mt-0.5" />
                  <span className="text-sm font-medium text-gray-700">{feat}</span>
                </li>
              ))}
            </ul>
            <CTAButton href="/signup" className="w-full" size="md">
              Get Started
            </CTAButton>
          </div>

          {/* Hospital Tier */}
          <div className="bg-white border border-gray-100 rounded-3xl p-6 sm:p-8 hover:shadow-lg transition-shadow flex flex-col">
            <h3 className="text-2xl font-bold mb-2 text-gray-900">Hospitals & Clinics</h3>
            <p className="text-muted mb-6 min-h-[3rem]">Pay only for the data you access.</p>
            <div className="mb-8">
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-4xl sm:text-5xl font-bold text-gray-900">{formatNaira(0.35)}</span>
                <span className="text-muted font-medium">/ scan</span>
              </div>
              <p className="text-sm text-muted mt-1">≈ {formatUsd(0.35)} USD</p>
              <p className="text-xs text-muted mt-2">Zero setup fees. Zero maintenance.</p>
            </div>
            <ul className="space-y-3 mb-8 flex-1">
              {[
                'Instant QR scan access',
                'Verified provenance badges',
                'Add & cosign records',
                'Unlimited staff accounts',
                'FHIR R4 EMR Integration',
              ].map((feat) => (
                <li key={feat} className="flex items-start gap-3">
                  <CheckIcon className="w-5 h-5 text-[#6183FF] shrink-0 mt-0.5" />
                  <span className="text-sm font-medium text-gray-700">{feat}</span>
                </li>
              ))}
            </ul>
            <CTAButton
              variant="dark"
              className="w-full"
              size="md"
              onClick={() => setIsModalOpen(true)}
            >
              Contact Sales
            </CTAButton>
          </div>

          {/* Researcher Tier */}
          <div className="bg-white border border-gray-100 rounded-3xl p-6 sm:p-8 hover:shadow-lg transition-shadow flex flex-col">
            <h3 className="text-2xl font-bold mb-2 text-gray-900">Researchers & Insurers</h3>
            <p className="text-muted mb-6 min-h-[3rem]">
              Access consented, longitudinal African health data.
            </p>
            <div className="mb-8">
              <span className="text-4xl sm:text-5xl font-bold text-gray-900">Custom</span>
              <p className="text-sm text-muted mt-2">Priced per cohort size & data depth</p>
              <p className="text-xs text-muted mt-1">Quoted in ₦ and USD</p>
            </div>
            <ul className="space-y-3 mb-8 flex-1">
              {[
                'IRB-verified access only',
                'Differential privacy enforced',
                'Real-time cohort size estimates',
                'Smart contract enforced payouts',
                'Fraud detection & auditing',
              ].map((feat) => (
                <li key={feat} className="flex items-start gap-3">
                  <CheckIcon className="w-5 h-5 text-[#6183FF] shrink-0 mt-0.5" />
                  <span className="text-sm font-medium text-gray-700">{feat}</span>
                </li>
              ))}
            </ul>
            <CTAButton
              variant="dark"
              className="w-full"
              size="md"
              onClick={() => setIsModalOpen(true)}
            >
              Request Demo
            </CTAButton>
          </div>
        </div>
      </section>

      <Footer />
      <WaitlistModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
