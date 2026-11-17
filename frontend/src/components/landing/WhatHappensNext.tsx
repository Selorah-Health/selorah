import { useSiteContent } from '../../contexts/SiteContentContext';
import Reveal from './Reveal';

export default function WhatHappensNext() {
  const { content } = useSiteContent();
  const section = content.next;

  if (!section.enabled || section.steps.length === 0) return null;

  return (
    <section
      id="what-happens-next"
      aria-labelledby="next-heading"
      className="scroll-mt-24 border-y border-[#E5E7EB] bg-white px-5 py-10 sm:px-8 sm:py-12 lg:px-10"
    >
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-sm">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-primary">
                {section.eyebrow}
              </p>
              <h2
                id="next-heading"
                className="mt-2 text-xl font-semibold tracking-[-0.02em] text-[#101217] sm:text-2xl"
              >
                {section.title}
              </h2>
            </div>

            <ol className="grid gap-4 sm:grid-cols-3 sm:gap-6 lg:flex-1 lg:justify-end">
              {section.steps.map((step, index) => (
                <li key={`${step.title}-${index}`} className="flex gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-primary/20 bg-primary/10 text-[10px] font-black text-primary">
                    {index + 1}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-[#101217]">{step.title}</p>
                    <p className="mt-1 text-xs leading-relaxed text-[#6B7280]">{step.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
