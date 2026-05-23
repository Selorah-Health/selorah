import React from "react";
import { BUILT_FOR_EVERYONE_CARDS } from "../../constants/landing";
import { BuiltForEveryoneCard } from "../ui";

export default function BuiltForEveryone() {
  return (
    <section
      id="built-for-everyone"
      className="py-24 bg-gray-50  border-y border-(--border)"
    >
      {/* Header */}
      <div className="max-w-screen-2xl mx-auto px-6 lg:px-12">
        <p className="text-primary font-semibold tracking-widest text-xs mb-4 uppercase">
          Built for everyone
        </p>
        <h2 className="text-3xl md:text-[2.75rem] font-semibold leading-[1.5] tracking-tight text-foreground mb-5">
          One platform.
          <br />
          Every stakeholder.
        </h2>
        <p className="text-md text-muted leading-relaxed">
          Whether you're a patient navigating care, a hospital managing
          operations, or a researcher pushing boundaries — we built this for
          you.
        </p>
        <div className="grid lg:grid-cols-3 gap-3 mt-10">
          {BUILT_FOR_EVERYONE_CARDS.map((card) => (
            <BuiltForEveryoneCard key={card.id} card={card} />
          ))}
        </div>
      </div>
    </section>
  );
}
