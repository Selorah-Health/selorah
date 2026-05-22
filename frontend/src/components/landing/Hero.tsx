import React, { useEffect, useRef, useState } from "react";
import { HERO_CONTENT } from "../../constants/landing";
import Button from "../ui/Button";

export default function Hero() {
  const [mounted, setMounted] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Trigger staggered animation after mount
    const timer = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const handleScrollToHowItWorks = () => {
    document.getElementById("how-it-works")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  return (
    <section
      className="relative w-full overflow-hidden bg-black min-h-svh flex items-center pt-20"
      aria-label="Hero"
    >
      {/* Background Video */}
      <video
        ref={videoRef}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        className="absolute inset-0 w-full h-full object-cover"
        style={{ opacity: 0.35 }}
        aria-hidden="true"
      >
        <source src={HERO_CONTENT.backgroundVideo} type="video/mp4" />
      </video>

      {/* Layered overlays for depth */}
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 40%, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.65) 100%)",
        }}
      />
      {/* Vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(ellipse 120% 100% at 50% 50%, transparent 40%, rgba(0,0,0,0.8) 100%)",
        }}
      />

      {/* Content */}
      <div className="relative z-10 w-full max-w-5xl mx-auto px-6 lg:px-12 pt-12 pb-20 text-center">
        <div className="max-w-3xl mx-auto flex flex-col items-center">
          {/* Tag pill — animates in first */}
          <div
            className="transition-all duration-700 ease-out"
            style={{
              opacity: mounted ? 1 : 0,
              transform: mounted ? "translateY(0)" : "translateY(12px)",
              transitionDelay: "0ms",
            }}
          >
            <div className="inline-flex items-center gap-1.5 bg-white/8 backdrop-blur-sm border border-white/12 rounded-full pl-1.5 pr-4 py-1 mb-5 select-none">
              {/* Pulsing dot + emoji */}
              <span className="relative flex items-center justify-center w-6 h-6 shrink-0">
                <span className="absolute inline-flex h-full w-full rounded-full bg-primary/40 animate-ping opacity-60" />
                <span className="relative text-sm leading-none">🌍</span>
              </span>

              {/* Divider */}
              <span
                className="w-px h-3 bg-white/20 shrink-0"
                aria-hidden="true"
              />

              {/* Label */}
              <span className="text-xs font-medium tracking-wide text-white/80">
                {HERO_CONTENT.tag}
              </span>
            </div>
          </div>

          {/* Heading — animates in second */}
          <div
            className="transition-all duration-700 ease-out"
            style={{
              opacity: mounted ? 1 : 0,
              transform: mounted ? "translateY(0)" : "translateY(16px)",
              transitionDelay: "120ms",
            }}
          >
            <h1 className="text-4xl lg:text-[4.75vw] font-semibold leading-[1.06] tracking-tight text-white mb-5">
              {HERO_CONTENT.title}
            </h1>
          </div>

          {/* Description — animates in third */}
          <div
            className="transition-all duration-700 ease-out"
            style={{
              opacity: mounted ? 1 : 0,
              transform: mounted ? "translateY(0)" : "translateY(16px)",
              transitionDelay: "220ms",
            }}
          >
            <p className="text-md lg:text-xl mt-4 text-white/70 max-w-[20rem] md:max-w-[90rem]  mx-auto leading-relaxed mb-8">
              {HERO_CONTENT.description}
            </p>
          </div>

          {/* CTAs — animate in last */}
          <div
            className="transition-all duration-700 ease-out"
            style={{
              opacity: mounted ? 1 : 0,
              transform: mounted ? "translateY(0)" : "translateY(16px)",
              transitionDelay: "330ms",
            }}
          >
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 space-y-4 sm:space-y-0 justify-center items-center">
              <Button
                onClick={() => (window.location.href = HERO_CONTENT.primaryCta.href)}
                className={`group relative overflow-hidden transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-black`}
                size="md"
                variant="primary"
              >
                <span className="relative z-10">{HERO_CONTENT.primaryCta.label}</span>
                <span
                  className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-500 ease-in-out"
                  style={{
                    background:
                      "linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)",
                  }}
                  aria-hidden="true"
                />
              </Button>

              <Button
                onClick={handleScrollToHowItWorks}
                variant="secondary"
                size="md"
                className="inline-flex items-center gap-2 border-white/25 border backdrop-blur-sm"
              >
                {HERO_CONTENT.secondaryCta.label}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="translate-y-px transition-transform duration-200 group-hover:translate-y-1"
                  aria-hidden="true"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom gradient fade */}
      <div
        className="absolute bottom-0 left-0 right-0 h-56 pointer-events-none"
        aria-hidden="true"
        style={{
          background: "linear-gradient(to top, #000 0%, transparent 100%)",
        }}
      />

      {/* Reduced-motion override */}
      <style>{`
        @media (prefers-reduced-motion: reduce) {
          * { transition-duration: 0ms !important; animation: none !important; }
        }
      `}</style>
    </section>
  );
}
