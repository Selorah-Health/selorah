import React, { useState } from "react";
import WaitlistModal from "../WaitlistModal";

export default function AvatarBadge() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <section className="bg-white py-24 px-6 lg:px-12">
      <div className="max-w-screen-2xl mx-auto flex flex-col items-center text-center">
        {/* Avatar image */}
        <img
          src="/assets/custom-avatar-badge.png"
          alt="Early users joining Selorah across Africa"
          className="w-64 md:w-96 h-auto mb-10 select-none"
          draggable={false}
        />

        {/* Heading */}
        <h2 className="text-3xl md:text-[2.75rem] font-semibold tracking-tight leading-[1.15] text-foreground max-w-2xl mb-4">
          Building across Africa —{" "}
          <span className="text-primary">join the early wave</span>
        </h2>

        {/* Subtext */}
        <p className="text-base text-foreground/60 max-w-md leading-relaxed mb-10">
          Be among the first to take control of your health records. No credit
          card. No commitment.
        </p>

        {/* CTA */}
        <button
          onClick={() => setIsModalOpen(true)}
          className="group relative inline-flex items-center justify-center px-10 py-4 rounded-full bg-primary text-white text-base font-semibold overflow-hidden transition-all duration-200 hover:brightness-110 hover:scale-[1.02] active:scale-[0.975] shadow-lg shadow-primary/20"
        >
          <span className="relative z-10">Join the Waitlist</span>
          {/* Shimmer sweep */}
          <span
            className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-500 ease-in-out"
            style={{
              background:
                "linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)",
            }}
            aria-hidden="true"
          />
        </button>
      </div>

      <WaitlistModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </section>
  );
}