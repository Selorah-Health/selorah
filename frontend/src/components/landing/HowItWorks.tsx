import React, { useEffect, useRef, useState } from "react";
import { PlayIcon } from "@heroicons/react/24/outline";
import { HOW_IT_WORKS_STEPS } from "../../constants/landing/howItWorks";

export default function HowItWorks() {
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);
  const stepVideoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const [stepVideoEnded, setStepVideoEnded] = useState<boolean[]>(
    Array(HOW_IT_WORKS_STEPS.length).fill(false)
  );

  const handleStepVideoEnd = (i: number) => {
    setStepVideoEnded((prev) => {
      const next = [...prev];
      next[i] = true;
      return next;
    });
  };

  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    const timers: (number | undefined)[] = [];

    stepRefs.current.forEach((ref, i) => {
      if (!ref) return;

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting && !stepVideoEnded[i]) {
              const video = stepVideoRefs.current[i];
              if (video) {
                video.currentTime = 0;
                video
                  .play()
                  .then(() => {
                    const timer = window.setTimeout(() => {
                      video.pause();
                      handleStepVideoEnd(i);
                      const next = stepRefs.current[i + 1];
                      if (next) next.scrollIntoView({ behavior: "smooth" });
                    }, 5000);

                    timers[i] = timer;
                    video.onpause = () => {
                      if (timers[i]) clearTimeout(timers[i]);
                    };
                  })
                  .catch(() => {});
              }
            }
          });
        },
        { threshold: 0.3 }
      );

      observer.observe(ref);
      observers.push(observer);
    });

    return () => {
      observers.forEach((o) => o.disconnect());
      timers.forEach((t) => t && clearTimeout(t));
    };
  }, [stepVideoEnded]);

  return (
    <section
      id="how-it-works"
      className="py-24 bg-gray-50  border-y border-(--border)"
    >
      <div className="max-w-screen-2xl mx-auto px-6 lg:px-12">
        {/* Header */}
        <div className="mx-auto mb-20">
          <p className="text-primary font-semibold tracking-widest text-xs mb-4 uppercase">
            How It Works
          </p>
          <h2 className="text-3xl md:text-[2.75rem] font-semibold leading-[1.5] tracking-tight text-foreground mb-5">
            Four steps. One QR. Complete control.
          </h2>
          <p className="text-md text-muted leading-relaxed">
            From uploading your first record to sharing it with a doctor across
            the country — the whole flow takes minutes.
          </p>
        </div>

        {/* Steps */}
        <div className="space-y-28">
          {HOW_IT_WORKS_STEPS.map((stepper, i) => (
            <div
              key={i}
              ref={(el: HTMLDivElement | null) => {
                stepRefs.current[i] = el;
              }}
              className={`flex flex-col ${
                i % 2 === 1 ? "md:flex-row-reverse" : "md:flex-row"
              } items-center gap-12`}
            >
              {/* Text side */}
              <div className="flex-1 w-full">
                {/* Step number — watermark that bleeds into title */}
                <span className="block text-[8.5rem] font-semibold leading-none text-primary/10 select-none mb-[2.5rem]">
                  {stepper.step}
                </span>

                <div className="space-y-4">
                  <h3 className="text-3xl md:text-[2rem] font-semibold tracking-tight text-foreground leading-[1.15]">
                    {stepper.title}
                  </h3>

                  <p className="text-base font-md text-foreground/70 leading-relaxed">
                    {stepper.desc}
                  </p>

                  {!stepVideoEnded[i] && (
                    <div className="inline-flex items-center gap-2 bg-primary/6 border border-primary/15 rounded-full px-4 py-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shrink-0" />
                      <span className="text-xs font-semibold text-primary uppercase tracking-widest">
                        Watch to continue
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Video side */}
              <div className="flex-1 w-full">
                <div className="aspect-4/3 bg-gray-900 rounded-2xl border border-(--border) overflow-hidden shadow-sm relative">
                  <video
                    ref={(el: HTMLVideoElement | null) => {
                      stepVideoRefs.current[i] = el;
                    }}
                    muted
                    playsInline
                    preload="auto"
                    poster={stepper.poster}
                    onEnded={() => handleStepVideoEnd(i)}
                    className="absolute inset-0 w-full h-full object-cover"
                  >
                    <source src={stepper.video} type="video/mp4" />
                  </video>

                  {/* Play overlay */}
                  {!stepVideoEnded[i] && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none">
                      <div className="w-16 h-16 rounded-full bg-white/15 backdrop-blur-md border border-white/25 flex items-center justify-center">
                        <PlayIcon className="w-7 h-7 text-white ml-0.5" />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
