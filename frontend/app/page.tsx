"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";

export default function LandingPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Mocking auth check for UI display
  useEffect(() => {
    // If we have a role stored or user is considered logged in, switch to true.
    // For now, toggle this flag to see the profile icon switch.
    setIsLoggedIn(true); 
  }, []);
  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] font-sans overflow-x-hidden selection:bg-primary/30 selection:text-primary">
      
      {/* NAVIGATION BAR */}
      <nav className="fixed top-0 w-full z-50 bg-[var(--background)]/80 backdrop-blur-md border-b border-[var(--border)]">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-primary flex items-center justify-center text-white font-bold text-xl">S</div>
            <span className="font-bold text-lg tracking-tight">Selorah Health</span>
          </div>
          
          <div className="hidden lg:flex items-center gap-8 text-sm font-medium text-muted hover:text-foreground transition-colors">
            <Link href="#how-it-works" className="hover:text-foreground transition-colors">How It Works</Link>
            <Link href="#hospitals" className="hover:text-foreground transition-colors">For Hospitals</Link>
            <Link href="#researchers" className="hover:text-foreground transition-colors">For Researchers</Link>
            <Link href="#insurers" className="hover:text-foreground transition-colors">For Insurers</Link>
            <Link href="/pricing" className="hover:text-foreground transition-colors">Pricing</Link>
          </div>
          
          <div className="flex items-center gap-4">
            {isLoggedIn ? (
              <Link href="/patient" className="flex items-center justify-center p-1 rounded-full hover:bg-[var(--border)] transition-colors border border-[rgba(97,131,255,0.2)]">
                <Image 
                  src="/assets/custom-avatar-badge.png" 
                  alt="Dashboard Profile" 
                  width={36} 
                  height={36} 
                  className="rounded-full"
                />
              </Link>
            ) : (
              <>
                <Link href="/login" className="text-sm font-medium hover:text-primary transition-colors hidden sm:block">Log in</Link>
                <Link href="/waitlist" className="group flex items-center gap-2 bg-foreground text-background px-5 py-2.5 rounded-full text-sm font-medium hover:bg-foreground/90 transition-colors">
                  Join Waitlist
                  <span className="inline-block transition-transform duration-200 group-hover:translate-x-1">→</span>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 px-6 max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16">
        <div className="flex-1 space-y-8 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold border border-primary/20">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
            Now in Early Access · Nigeria, Ghana & Kenya
          </div>
          
          <h1 className="text-5xl lg:text-7xl font-bold leading-[1.1] tracking-tight">
            Securing Health Records<br />
            <span className="italic font-normal text-primary">from Patient to Provider</span>
          </h1>
          
          <p className="text-lg text-muted max-w-xl leading-relaxed">
            At Selorah Health, we transform how your medical history travels with you — putting ownership where it has always belonged: in your hands.
          </p>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pt-4">
            <Link href="/waitlist" className="w-full sm:w-auto text-center bg-primary text-white px-8 py-4 rounded-full font-medium hover:bg-primary-hover transition-colors shadow-lg shadow-primary/25">
              Join the Waitlist — It's Free
            </Link>
            <Link href="#how-it-works" className="group flex items-center gap-2 w-full sm:w-auto text-center px-8 py-4 font-medium hover:text-primary transition-colors">
              <span className="inline-block transition-transform duration-200 group-hover:translate-x-1">→</span>
              Here's How It Works
            </Link>
          </div>
          
          <div className="flex items-center gap-6 pt-8 text-sm font-medium text-muted">
            <div className="flex items-center gap-2"><span className="text-lg">🔐</span> NDPR Compliant</div>
            <div className="flex items-center gap-2"><span className="text-lg">🔒</span> End-to-end encrypted</div>
            <div className="flex items-center gap-2"><span className="text-lg">✓</span> HL7 FHIR R4 Ready</div>
          </div>
        </div>
        
        <div className="flex-1 w-full lg:w-auto relative">
          <div className="relative bg-white border border-[var(--border)] rounded-3xl p-8 shadow-xl shadow-black/5 rotate-2 hover:rotate-0 transition-transform duration-500">
            <div className="aspect-video bg-gray-100 rounded-xl mb-6 overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-transparent"></div>
              {/* Actual image placeholder */}
              <div className="w-full h-full flex items-center justify-center text-muted/30">Community healthcare photo</div>
            </div>
            <h3 className="text-xl font-bold mb-3">"Tired of Chasing Your Own Records?"</h3>
            <p className="text-muted mb-6">Selorah Health gives you full ownership — encrypted, portable, private.</p>
            <div className="flex items-center justify-between">
              <Link href="/waitlist" className="text-primary font-medium flex items-center gap-2 group">
                Join the Waitlist <span className="transition-transform group-hover:translate-x-1">→</span>
              </Link>
              <span className="text-xs font-bold text-muted tracking-wider">NEXT STORY →</span>
            </div>
          </div>
        </div>
      </section>

      {/* SOCIAL PROOF */}
      <section className="bg-white border-y border-[var(--border)] py-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-center gap-6 text-center sm:text-left">
          <div className="flex -space-x-4">
            {[1,2,3,4,5].map((i) => (
              <div key={i} className="w-12 h-12 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center text-xs overflow-hidden shadow-sm">
                <span className="text-muted/50">👤</span>
              </div>
            ))}
          </div>
          <div className="text-lg font-medium text-muted">
            "Building across Africa — join the early wave"
          </div>
          <div className="pl-4 border-l border-[var(--border)] hidden sm:block">
            <Link href="/waitlist" className="font-semibold text-primary hover:underline">Join the Waitlist</Link>
          </div>
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
              author: "Blessing, 41, Ibadan"
            },
            {
              quote: "I travelled for surgery abroad. I spent two weeks gathering records from four hospitals before they would operate.",
              author: "Tunde, 38, Abuja"
            }
          ].map((item, i) => (
            <div key={i} className="bg-white border border-[var(--border)] p-8 rounded-2xl shadow-sm">
              <div className="text-primary text-4xl mb-4">"</div>
              <p className="text-lg font-medium mb-6 leading-relaxed">{item.quote}</p>
              <p className="text-muted text-sm">— {item.author}</p>
            </div>
          ))}
        </div>
        
        <div className="text-center max-w-4xl mx-auto space-y-6">
          <p className="text-3xl md:text-4xl italic font-normal text-primary">
            "This is a solvable problem. It has been a solvable problem for years."
          </p>
          <p className="text-xl text-muted">
            The reason it hasn't been solved is that health records have always belonged to hospitals. Selorah changes that.
          </p>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="py-24 bg-white/50 border-y border-[var(--border)]">
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
                desc: "Scan a paper document, upload a file, or connect directly to a hospital on the Selorah network. Records are encrypted on your device before they leave it. We cannot read them."
              },
              {
                step: "02",
                title: "Your QR is Always Ready",
                desc: "Open Selorah. Tap Share. One QR. Any doctor, any hospital, any city, any country. You set how long they have access — one hour, one day, one week."
              },
              {
                step: "03",
                title: "Doctors See Your History",
                desc: "Lab results. Prescriptions. Diagnoses. Vaccinations. Each record labelled by its source. Verified records carry a green badge. Your doctor always knows what they're looking at."
              },
              {
                step: "04",
                title: "You See Who Looked",
                desc: "Every scan, every access — logged permanently on the blockchain. You can audit your own history at any time. You decide. You revoke. You're in control."
              }
            ].map((stepper, i) => (
              <div key={i} className={`flex flex-col ${i % 2 === 1 ? 'md:flex-row-reverse' : 'md:flex-row'} items-center gap-12`}>
                <div className="flex-1 space-y-6">
                  <div className="text-primary/20 text-6xl font-bold mb-2">{stepper.step}</div>
                  <h3 className="text-3xl font-bold">{stepper.title}</h3>
                  <p className="text-lg text-muted leading-relaxed">{stepper.desc}</p>
                </div>
                <div className="flex-1 w-full relative">
                  <div className="aspect-[4/3] bg-gray-100 rounded-3xl border border-[var(--border)] overflow-hidden shadow-lg flex items-center justify-center text-muted/30">
                    Interactive UI mockup here
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
           <p className="text-xl text-muted">Whether you're a patient managing your family's health, a hospital streamlining records, or a researcher seeking consented data — Selorah is built for you.</p>
        </div>
        
        <div className="grid lg:grid-cols-3 gap-8">
          {[
            {
              icon: "🧬",
              title: "For Patients",
              desc: "Take full ownership of your medical history. Share it instantly. Revoke access immediately. Earn from contributing your anonymised data to research.",
              features: ["Encrypted records on your device", "QR-based sharing with any provider", "Emergency profile always accessible", "Family health vault (up to 6 members)", "Monthly research earnings"]
            },
            {
              icon: "🏥",
              title: "For Hospitals & Clinics",
              desc: "Stop asking patients for records they don't have. Scan a QR and see their verified history instantly — on any device, no installation required.",
              features: ["Instant QR scan access", "Verified record provenance badges", "Add & cosign records directly", "Staff roles & permissions", "FHIR R4 EMR integration"]
            },
            {
              icon: "🔬",
              title: "For Researchers & Insurers",
              desc: "Access consented, longitudinal African health data. 75% of every study budget goes directly to patients. The split is enforced by smart contract — immutable.",
              features: ["IRB-verified researchers only", "Differential privacy enforced", "Real-time cohort size estimates", "Automatic monthly patient payouts", "Fraud detection tools for insurers"]
            }
          ].map((card, i) => (
            <div key={i} className="bg-white border border-[var(--border)] rounded-3xl p-8 hover:shadow-xl transition-shadow flex flex-col h-full">
              <div className="text-5xl mb-6">{card.icon}</div>
              <h3 className="text-2xl font-bold mb-4">{card.title}</h3>
              <p className="text-muted mb-8 flex-1">{card.desc}</p>
              <ul className="space-y-3">
                {card.features.map((feat, j) => (
                  <li key={j} className="flex items-start gap-3">
                    <span className="text-primary font-bold mt-1">✓</span>
                    <span className="text-sm font-medium">{feat}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* PRIVACY ARCHITECTURE */}
      <section className="bg-[#0a0a3a] text-white py-24 selection:bg-white/20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-16">
            <p className="text-primary font-bold tracking-wider text-sm mb-4 uppercase">The Architecture</p>
            <h2 className="text-4xl md:text-5xl font-bold max-w-3xl leading-tight mb-6">
              We built it so that even we can't see your data.
            </h2>
            <p className="text-xl text-blue-200/80 max-w-2xl">
              This is not a feature. It is the foundation. Every design decision flows from one principle: your health data belongs to you.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm">
              <h3 className="text-xl font-bold mb-4">Your Key. Your Phone.</h3>
              <p className="text-blue-200/70 leading-relaxed">Records are encrypted on your device before uploading. Selorah's servers receive a locked file with no key. If we were breached, the attacker would find nothing readable.</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm">
              <h3 className="text-xl font-bold mb-4">Deletion is Real.</h3>
              <p className="text-blue-200/70 leading-relaxed">When you delete a record, it is permanently removed from our servers and cryptographically erased. You receive a proof of deletion on the blockchain. Gone means gone.</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm">
              <h3 className="text-xl font-bold mb-4">Revocation is Instant.</h3>
              <p className="text-blue-200/70 leading-relaxed">When you revoke a doctor's access, it is recorded on the blockchain immediately and irreversibly. Not after a delay. Not pending review. The instant you tap Revoke, it is over.</p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-4 text-xs font-bold tracking-wider text-blue-300">
            <div className="px-4 py-2 rounded border border-blue-500/30 bg-blue-500/10 uppercase">NDPR Compliant</div>
            <div className="px-4 py-2 rounded border border-blue-500/30 bg-blue-500/10 uppercase">GDPR-Aligned</div>
            <div className="px-4 py-2 rounded border border-blue-500/30 bg-blue-500/10 uppercase">HL7 FHIR R4 Ready</div>
            <div className="px-4 py-2 rounded border border-blue-500/30 bg-blue-500/10 uppercase">AES-256-GCM Encrypted</div>
          </div>
        </div>
      </section>

      {/* EARNINGS */}
      <section className="py-24 px-6 max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-16">
        <div className="flex-1 space-y-8">
           <p className="text-primary font-bold tracking-wider text-sm uppercase">Earn from your data</p>
           <h2 className="text-4xl md:text-5xl font-bold leading-tight">Your data has value. You should be the one getting paid.</h2>
           <p className="text-xl text-muted">When you opt into research, you receive a monthly payment for contributing your anonymised health data to approved studies. Your identity is never shared. Opt out at any time.</p>
           
           <div className="space-y-4 font-medium text-lg pt-4">
             <div className="flex items-center gap-3"><span className="text-2xl">🔒</span> Anonymised before sharing</div>
             <div className="flex items-center gap-3"><span className="text-2xl">✅</span> You choose which studies</div>
             <div className="flex items-center gap-3"><span className="text-2xl">💸</span> Paid to OPay, MTN, or your bank</div>
           </div>
           
           <div className="pt-6">
              <Link href="/waitlist" className="group inline-flex items-center gap-2 font-bold text-primary hover:text-primary-hover text-lg">
                Opt in takes 30 seconds <span className="transition-transform group-hover:translate-x-1">→</span>
              </Link>
           </div>
        </div>
        
        <div className="flex-1 w-full max-w-md">
          <div className="bg-white border border-[var(--border)] rounded-3xl p-8 shadow-xl">
             <p className="text-sm font-semibold text-muted mb-2 uppercase tracking-wider">Estimated monthly earnings</p>
             <div className="text-5xl font-bold text-foreground mb-4">₦2,400 <span className="text-muted text-3xl font-medium">— ₦8,500</span></div>
             <p className="text-sm text-muted">Based on similar profiles in our early cohort</p>
             
             <div className="mt-8 pt-8 border-t border-[var(--border)] space-y-4">
               <div className="flex items-center justify-between text-sm">
                 <span className="font-medium">Cardiovascular Study 2026</span>
                 <span className="text-primary font-bold">✓ Active</span>
               </div>
               <div className="flex items-center justify-between text-sm">
                 <span className="font-medium">Regional Allergy Tracking</span>
                 <span className="text-primary font-bold">✓ Active</span>
               </div>
             </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="bg-white border-y border-[var(--border)] py-24">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-primary font-bold tracking-wider text-sm uppercase mb-4">What early access members say</p>
          <h2 className="text-4xl md:text-5xl font-bold mb-16">Built around real experiences.</h2>
          
          <div className="grid md:grid-cols-3 gap-8 text-left">
             <div className="bg-[var(--background)] p-8 rounded-2xl">
               <p className="text-lg font-medium mb-6 leading-relaxed">"Now, with Selorah, all I have to do is present my QR-code to my new doctor so that they now have access to my medical history. I don&apos;t have to store and try to remember card numbers again."</p>
               <p className="text-sm font-bold text-muted">— Chisom, 34, Enugu</p>
             </div>
             <div className="bg-[var(--background)] p-8 rounded-2xl">
               <p className="text-lg font-medium mb-6 leading-relaxed">"This is a masterpiece, I&apos;d say. This will reduce the mortality rate in Nigeria. Now parents can get to start storing their kids medical data, so that they have to go through the hassle we went through."</p>
               <p className="text-sm font-bold text-muted">— Biodun, 41, Ibadan</p>
             </div>
             <div className="bg-[var(--background)] p-8 rounded-2xl">
               <p className="text-lg font-medium mb-6 leading-relaxed">"Not only do I get to carry my medical records around, I also earn from it! This is incredible, honestly. You should try it."</p>
               <p className="text-sm font-bold text-muted">— Tunde, 38, Lagos</p>
             </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="bg-primary text-white py-24 px-6 text-center">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl md:text-6xl font-bold leading-tight mb-6">
            You deserve to know your own health history. <br className="hidden md:block"/>
            <span className="opacity-90">And so does every doctor who treats you.</span>
          </h2>
          <p className="text-xl text-white/80 font-medium mb-12">Free. No card required. 90 seconds.</p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/waitlist" className="w-full sm:w-auto bg-white text-primary font-bold text-lg px-8 py-4 rounded-full hover:bg-gray-100 transition-colors shadow-xl group">
              Join the Waitlist <span className="inline-block transition-transform duration-200 group-hover:translate-x-1">→</span>
            </Link>
            <Link href="/hospitals" className="w-full sm:w-auto bg-primary border-2 border-white/20 text-white font-bold text-lg px-8 py-4 rounded-full hover:bg-white/10 transition-colors group">
              I represent a hospital or institution <span className="inline-block transition-transform duration-200 group-hover:translate-x-1">→</span>
            </Link>
          </div>
          <p className="mt-8 text-sm font-medium text-white/70">Early access members lock in Premium pricing forever at ₦900/month</p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#0F0F1A] text-white pt-20 pb-10 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-16">
          <div className="lg:col-span-2 space-y-6">
            <div className="text-2xl font-bold flex items-center gap-2">
              <div className="w-8 h-8 rounded bg-primary flex items-center justify-center text-white font-bold text-xl">S</div>
              Selorah Health
            </div>
            <p className="text-gray-400 text-lg pr-8">Your health record. In your pocket. Encrypted, portable, and permanently yours.</p>
            <p className="text-gray-500 font-medium">Lagos, Nigeria · hello@selorah.health</p>
          </div>
          
          <div>
            <h4 className="font-bold text-lg mb-6">Product</h4>
            <ul className="space-y-4 text-gray-400 font-medium">
              <li><Link href="#" className="hover:text-white transition-colors">Patient App</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Hospital Portal</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Research Portal</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Insurer Portal</Link></li>
              <li><Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-bold text-lg mb-6">Company</h4>
            <ul className="space-y-4 text-gray-400 font-medium">
              <li><Link href="/about" className="hover:text-white transition-colors">About</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Blog</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Careers</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Press</Link></li>
              <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-bold text-lg mb-6">Legal</h4>
            <ul className="space-y-4 text-gray-400 font-medium">
              <li><Link href="#" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Terms of Service</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Data Processing Agreement</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Cookie Policy</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-500 font-medium">
          <div>© 2026 Selorah Health Ltd. All rights reserved.</div>
          <div className="flex items-center gap-4">
            <span>[NDPR Compliant]</span>
            <span>[AES-256 Encrypted]</span>
            <span>[We never sell your data]</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
