import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import WaitlistModal from '../components/WaitlistModal';
import LanguageSelector from '../components/LanguageSelector';
import { useLanguage } from '../contexts/LanguageContext';
import { detectCurrency, CurrencyInfo } from '../lib/utils/currency';
import {
  ChevronRightIcon,
  Bars3Icon,
  XMarkIcon,
  CheckIcon
} from "@heroicons/react/24/solid";
import Header from '../components/Header';
import Footer from '../components/Footer';
import SEOTitle from '../components/SEOTitle';

export default function Pricing() {
  const { t } = useLanguage();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currency, setCurrency] = useState<CurrencyInfo>(() => {
    // Immediate guess based on browser locale to prevent flicker
    const locale = navigator.language || 'en-US';
    if (locale.includes('NG')) return { code: 'NGN', symbol: '₦', rate: 1500, countryName: 'Nigeria' };
    return { code: 'USD', symbol: '$', rate: 1, countryName: 'United States' };
  });

  useEffect(() => {
    detectCurrency().then(setCurrency);
  }, []);

  const formatPrice = (usdAmount: number) => {
    const localAmount = usdAmount * currency.rate;
    // Simple localized formatting
    const formattedAmount = localAmount.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
    return `${currency.symbol}${formattedAmount}`;
  };

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] font-sans selection:bg-primary/30 selection:text-primary overflow-x-hidden">
      <SEOTitle title="Pricing" />
      <Header />

      {/* HEADER SECTION */}
      <section className="pt-40 pb-20 px-12 max-w-7xl mx-auto text-center">
        <p className="text-primary font-bold tracking-wider text-sm mb-4 uppercase">Transparent Pricing</p>
        <h1 className="text-5xl md:text-6xl font-bold leading-tight mb-8">
          A sustainable model for<br />
          <span className="text-primary italic font-normal">health data ownership</span>
        </h1>
        <p className="text-xl text-muted leading-relaxed">
          Why do patients pay? Because when the product is free, you are the product.
          We charge a minimal subscription so your data remains entirely yours—encrypted, secure, and never sold to third parties without your explicit consent and compensation.
        </p>
      </section>

      {/* PRICING CARDS */}
      <section className="py-12 px-12 max-w-7xl mx-auto text-left">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Patient Tier */}
          <div className="bg-white border-2 border-primary rounded-3xl p-8 shadow-xl relative">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-white text-xs font-bold uppercase tracking-wider px-4 py-1 rounded-full">
              For Individuals
            </div>
            <h3 className="text-2xl font-bold mb-2 text-gray-900">Patient Premium</h3>
            <p className="text-muted mb-6 h-12">Full control over your medical history, forever.</p>
            <div className="mb-8">
              <span className="text-5xl font-bold text-gray-900">{formatPrice(3)}</span>
              <span className="text-muted font-medium"> / month</span>
              <p className="text-xs text-primary font-bold mt-2">
                *Early access pricing locked in forever
              </p>
            </div>
            <ul className="space-y-4 mb-8">
              {['Unlimited encrypted record storage', 'QR sharing with providers', 'Emergency profile', 'Family health vault (up to 6 members)', 'Opt-in research earnings (₦2k - ₦8k/mo)'].map((feat, i) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckIcon className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <span className="text-sm font-medium text-gray-700">{feat}</span>
                </li>
              ))}
            </ul>
            <Link to="/signup" className="w-full bg-primary text-white font-bold py-4 rounded-xl hover:bg-primary-hover transition-all block text-center shadow-lg shadow-primary/20">
              Get Started
            </Link>
          </div>

          {/* Hospital Tier */}
          <div className="bg-white border border-gray-100 rounded-3xl p-8 hover:shadow-lg transition-shadow">
            <h3 className="text-2xl font-bold mb-2 text-gray-900">Hospitals & Clinics</h3>
            <p className="text-muted mb-6 h-12">Pay only for the data you access.</p>
            <div className="mb-8">
              <span className="text-5xl font-bold text-gray-900">{formatPrice(0.35)}</span>
              <span className="text-muted font-medium"> / scan</span>
              <p className="text-xs text-muted mt-2">Zero setup fees. Zero maintenance.</p>
            </div>
            <ul className="space-y-4 mb-8">
              {['Instant QR scan access', 'Verified provenance badges', 'Add & cosign records', 'Unlimited staff accounts', 'FHIR R4 EMR Integration'].map((feat, i) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckIcon className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <span className="text-sm font-medium text-gray-700">{feat}</span>
                </li>
              ))}
            </ul>
            <button className="w-full bg-gray-100 text-gray-900 font-bold py-4 rounded-xl hover:bg-gray-200 transition-colors">
              Contact Sales
            </button>
          </div>

          {/* Researcher Tier */}
          <div className="bg-white border border-gray-100 rounded-3xl p-8 hover:shadow-lg transition-shadow">
            <h3 className="text-2xl font-bold mb-2 text-gray-900">Researchers & Insurers</h3>
            <p className="text-muted mb-6 h-12">Access consented, longitudinal African health data.</p>
            <div className="mb-8">
              <span className="text-5xl font-bold text-gray-900">Custom</span>
              <p className="text-xs text-muted mt-2">Priced per cohort size & data depth</p>
            </div>
            <ul className="space-y-4 mb-8">
              {['IRB-verified access only', 'Differential privacy enforced', 'Real-time cohort size estimates', 'Smart contract enforced payouts', 'Fraud detection & auditing'].map((feat, i) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckIcon className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <span className="text-sm font-medium text-gray-700">{feat}</span>
                </li>
              ))}
            </ul>
            <button className="w-full bg-gray-100 text-gray-900 font-bold py-4 rounded-xl hover:bg-gray-200 transition-colors">
              Request Demo
            </button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
