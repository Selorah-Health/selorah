import React from 'react';
import { PRIVACY_ARCHITECTURE_CARDS } from '../../constants/landing';
import { PrivacyArchitectureCard } from '../ui';

export default function PrivacyArchitecture() {
  return (
    <section id="privacy-architecture" className="py-24 bg-[#0A0B14] text-white">
      <div className="max-w-screen-2xl mx-auto px-6 lg:px-12">
        <p className="text-[11px] font-medium tracking-[0.12em] uppercase text-primary mb-3">
          The architecture
        </p>
        <h2 className="text-3xl md:text-4xl font-medium leading-snug max-w-xl">
          We built it so that even we can't see your data.
        </h2>
        <p className="mt-4 text-sm md:text-base text-white/50 leading-relaxed max-w-3xl">
          Privacy is not a feature bolted on later. It is the structure beneath every record, share, and deletion.
        </p>

        <div className="grid md:grid-cols-3 gap-3 mt-10">
          {PRIVACY_ARCHITECTURE_CARDS.map((card) => (
            <PrivacyArchitectureCard key={card.num} card={card} />
          ))}
        </div>
      </div>
    </section>
  );
}