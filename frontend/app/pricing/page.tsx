"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import WaitlistModal from "@/components/WaitlistModal";
import {
  ChevronRightIcon,
  Bars3Icon,
  XMarkIcon
} from "@heroicons/react/24/solid";
import {
  CheckIcon,
  PlayIcon
} from "@heroicons/react/24/solid";

export default function PricingPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] font-sans">
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
            <Link href="/pricing" className="text-primary font-bold transition-colors">Pricing</Link>
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

      {/* HEADER SECTION */}
      <section className="pt-40 pb-20 px-6 max-w-4xl mx-auto text-center">
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
      <section className="py-12 px-6 max-w-7xl mx-auto">
        <div className="grid md:grid-cols-3 gap-8">

          {/* Patient Tier */}
          <div className="bg-white border-2 border-primary rounded-3xl p-8 shadow-xl relative">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-white text-xs font-bold uppercase tracking-wider px-4 py-1 rounded-full">
              For Individuals
            </div>
            <h3 className="text-2xl font-bold mb-2">Patient Premium</h3>
            <p className="text-muted mb-6 h-12">Full control over your medical history, forever.</p>
            <div className="mb-8">
              <span className="text-5xl font-bold text-foreground">₦4,500</span>
              <span className="text-muted font-medium"> / month</span>
              <p className="text-xs text-primary font-bold mt-2">*Early access pricing locked in forever</p>
            </div>
            <ul className="space-y-4 mb-8">
              {['Unlimited encrypted record storage', 'QR sharing with providers', 'Emergency profile', 'Family health vault (up to 6 members)', 'Opt-in research earnings (₦2k - ₦8k/mo)'].map((feat, i) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckIcon className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <span className="text-sm font-medium">{feat}</span>
                </li>
              ))}
            </ul>
            <button onClick={() => setIsModalOpen(true)} className="w-full bg-primary text-white font-bold py-4 rounded-xl hover:bg-primary-hover transition-colors">
              Join the Waitlist
            </button>
          </div>

          {/* Hospital Tier */}
          <div className="bg-white border border-[var(--border)] rounded-3xl p-8 hover:shadow-lg transition-shadow">
            <h3 className="text-2xl font-bold mb-2">Hospitals & Clinics</h3>
            <p className="text-muted mb-6 h-12">Pay only for the data you access.</p>
            <div className="mb-8">
              <span className="text-5xl font-bold text-foreground">₦500</span>
              <span className="text-muted font-medium"> / scan</span>
              <p className="text-xs text-muted mt-2">Zero setup fees. Zero maintenance.</p>
            </div>
            <ul className="space-y-4 mb-8">
              {['Instant QR scan access', 'Verified provenance badges', 'Add & cosign records', 'Unlimited staff accounts', 'FHIR R4 EMR Integration'].map((feat, i) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckIcon className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <span className="text-sm font-medium">{feat}</span>
                </li>
              ))}
            </ul>
            <button className="w-full bg-gray-100 text-foreground font-bold py-4 rounded-xl hover:bg-gray-200 transition-colors">
              Contact Sales
            </button>
          </div>

          {/* Researcher Tier */}
          <div className="bg-white border border-[var(--border)] rounded-3xl p-8 hover:shadow-lg transition-shadow">
            <h3 className="text-2xl font-bold mb-2">Researchers & Insurers</h3>
            <p className="text-muted mb-6 h-12">Access consented, longitudinal African health data.</p>
            <div className="mb-8">
              <span className="text-5xl font-bold text-foreground">Custom</span>
              <p className="text-xs text-muted mt-2">Priced per cohort size & data depth</p>
            </div>
            <ul className="space-y-4 mb-8">
              {['IRB-verified access only', 'Differential privacy enforced', 'Real-time cohort size estimates', 'Smart contract enforced payouts', 'Fraud detection & auditing'].map((feat, i) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckIcon className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <span className="text-sm font-medium">{feat}</span>
                </li>
              ))}
            </ul>
            <button className="w-full bg-gray-100 text-foreground font-bold py-4 rounded-xl hover:bg-gray-200 transition-colors">
              Request Demo
            </button>
          </div>

        </div>
      </section>

      {/* COMPARISON TABLE */}
      <section className="py-24 px-6 max-w-5xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center">Plan Comparison</h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-2 border-[var(--border)]">
                <th className="py-4 px-6 font-bold text-lg">Features</th>
                <th className="py-4 px-6 font-bold text-lg text-primary">Patient</th>
                <th className="py-4 px-6 font-bold text-lg">Hospital</th>
                <th className="py-4 px-6 font-bold text-lg">Researcher</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {[
                { feature: 'Encrypted Data Storage', patient: true, hospital: false, researcher: false },
                { feature: 'Data Ownership & Control', patient: true, hospital: false, researcher: false },
                { feature: 'Scan QR for Access', patient: false, hospital: true, researcher: false },
                { feature: 'Append New Records', patient: true, hospital: true, researcher: false },
                { feature: 'Earn from Data Sharing', patient: true, hospital: false, researcher: false },
                { feature: 'Purchase Consented Cohorts', patient: false, hospital: false, researcher: true },
                { feature: 'Staff Role Management', patient: false, hospital: true, researcher: true },
                { feature: 'Blockchain Audit Logs', patient: true, hospital: true, researcher: true },
              ].map((row, idx) => (
                <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                  <td className="py-4 px-6 font-medium text-muted">{row.feature}</td>
                  <td className="py-4 px-6">
                    {row.patient ? <CheckIcon className="w-6 h-6 text-primary" /> : <XMarkIcon className="w-6 h-6 text-gray-300" />}
                  </td>
                  <td className="py-4 px-6">
                    {row.hospital ? <CheckIcon className="w-6 h-6 text-foreground" /> : <XMarkIcon className="w-6 h-6 text-gray-300" />}
                  </td>
                  <td className="py-4 px-6">
                    {row.researcher ? <CheckIcon className="w-6 h-6 text-foreground" /> : <XMarkIcon className="w-6 h-6 text-gray-300" />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
