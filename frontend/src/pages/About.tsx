import { ShieldCheckIcon, GlobeAltIcon, UserGroupIcon, RocketLaunchIcon, ArrowRightIcon, BeakerIcon } from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SEOTitle from '../components/SEOTitle';

export default function About() {
  return (
    <div className="min-h-screen bg-white font-sora selection:bg-primary/30">
      <SEOTitle title="About Us" />
      <Header theme="light" />
      <div className="h-20 shrink-0" /> {/* Spacer for fixed nav */}

      {/* Hero Section */}
      <section className="relative h-[60vh] min-h-[500px] flex items-center justify-center overflow-hidden bg-[#101217]">
        <img 
          src="/assets/hero-bg-image-1.jpg" 
          alt="Selorah Team" 
          className="absolute inset-0 w-full h-full object-cover opacity-50"
        />
        <div className="relative z-10 text-center px-12 max-w-4xl">
          <h1 className="text-5xl md:text-7xl font-black text-white mb-6 tracking-tight">
            Democratizing <span className="text-[#6183FF]">Health Data</span>
          </h1>
          <p className="text-xl text-white/80 font-medium leading-relaxed max-w-2xl mx-auto">
            We are building the sovereign infrastructure for African medical history. Putting ownership back where it belongs: in your hands.
          </p>
        </div>
      </section>

      {/* Our Mission */}
      <section className="py-24 px-12 max-w-full mx-auto">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-full text-[#6183FF] text-xs font-black uppercase tracking-widest mb-6">
              <RocketLaunchIcon className="w-4 h-4" /> Our Mission
            </div>
            <h2 className="text-4xl font-black text-[#101217] mb-8 leading-tight">
              A world where your health history travels with you, securely.
            </h2>
            <div className="space-y-6 text-gray-500 font-medium text-lg leading-relaxed">
              <p>
                In Africa today, medical records are fragmented, paper-based, or locked in proprietary hospital systems. When a patient moves, their history stays behind.
              </p>
              <p>
                Selorah is changing that. We provide a decentralized, secure, and user-friendly platform where patients can consolidate their records, share them instantly, and even earn rewards for contributing anonymized data to research.
              </p>
            </div>
          </div>
          <div className="relative">
            <img 
              src="/assets/hero-bg-image-2.jpg" 
              alt="Mission Data" 
              className="rounded-[48px] shadow-2xl relative z-10"
            />
            <div className="absolute -bottom-6 -right-6 w-64 h-64 bg-[#6183FF]/10 rounded-[48px] -z-0"></div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-24 bg-gray-50 px-12">
        <div className="max-w-full mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-4xl font-black text-[#101217] mb-6">Built on Trust</h2>
            <p className="text-xl text-gray-400 font-medium">Our core values guide every line of code we write.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { 
                title: 'Absolute Privacy', 
                desc: 'We use client-side encryption. Even we cannot see your medical records without your explicit permission.',
                icon: ShieldCheckIcon,
                color: 'text-blue-500',
                bg: 'bg-blue-50'
              },
              { 
                title: 'Data Sovereignty', 
                desc: 'You own your data. You decide who sees it, for how long, and you can revoke access at any time.',
                icon: GlobeAltIcon,
                color: 'text-purple-500',
                bg: 'bg-purple-50'
              },
              { 
                title: 'Community First', 
                desc: 'We ensure that patients are rewarded for their participation in clinical research, fairly and transparently.',
                icon: UserGroupIcon,
                color: 'text-green-500',
                bg: 'bg-green-50'
              }
            ].map((value, i) => (
              <div key={i} className="bg-white p-10 rounded-[40px] border border-gray-100 hover:shadow-xl transition-all group">
                <div className={`w-14 h-14 ${value.bg} rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform`}>
                  <value.icon className={`w-7 h-7 ${value.color}`} />
                </div>
                <h3 className="text-2xl font-bold text-[#101217] mb-4">{value.title}</h3>
                <p className="text-gray-400 font-medium leading-relaxed">{value.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-12 text-center max-w-4xl mx-auto">
        <h2 className="text-4xl md:text-5xl font-black text-[#101217] mb-8 leading-tight">
          Ready to join the future of healthcare?
        </h2>
        <div className="flex flex-col md:flex-row items-center justify-center gap-6">
          <Link 
            to="/signup" 
            className="w-full md:w-auto bg-[#6183FF] text-white px-10 py-5 rounded-2xl font-bold text-lg hover:bg-[#4E6EEF] transition-all shadow-xl shadow-blue-500/20 flex items-center justify-center gap-2"
          >
            Get Started Now <ArrowRightIcon className="w-5 h-5" />
          </Link>
          <Link 
            to="/careers" 
            className="w-full md:w-auto border border-gray-200 text-[#101217] px-10 py-5 rounded-2xl font-bold text-lg hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
          >
            View Openings <BeakerIcon className="w-5 h-5" />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}

