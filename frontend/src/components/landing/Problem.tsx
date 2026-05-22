import React from "react";
import { TESTIMONIALS } from "../../constants/landing/testimonials";

export default function Problem() {
  return (
    <section className="py-24 px-6 lg:px-12 max-w-screen-2xl mx-auto">
      {/* Header */}
      <div className="mb-14">
        <p className="text-primary font-semibold tracking-widest text-xs mb-4 uppercase">
          The Problem
        </p>
        <h2 className="text-3xl md:text-[2.75rem] font-semibold max-w-3xl leading-[1.15] tracking-tight text-foreground">
          Nigerian patients carry their health history in their heads — or not
          at all.
        </h2>
      </div>

      {/* Testimonial cards */}
      <div className="grid md:grid-cols-3 gap-5">
        {TESTIMONIALS.map((item, i) => (
          <div
            key={i}
            className="group relative flex flex-col justify-between bg-white border border-(--border) rounded-2xl p-7 overflow-hidden transition-shadow duration-300 hover:shadow-md"
          >
            {/* Subtle top accent */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

            {/* Large decorative quote mark */}
            <span
              className="absolute top-5 right-6 text-[6rem] leading-none font-serif text-primary/8 select-none pointer-events-none"
              aria-hidden="true"
            >
              &ldquo;
            </span>

            {/* Quote */}
            <p className="relative text-base font-medium leading-relaxed text-foreground/85 mb-8">
              {item.quote}
            </p>

            {/* Author */}
            <div className="flex items-center gap-2.5">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary text-xs font-semibold shrink-0">
                {item.author
                  .split(" ")
                  .map((n: string) => n[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </span>
              <div>
                <p className="text-sm font-medium text-foreground/90">
                  {item.author}
                </p>
                <p className="text-xs text-muted/70">
                  {item.age} · {item.location}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}