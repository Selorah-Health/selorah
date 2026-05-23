import React from "react";
import Marquee from "react-fast-marquee";
import { TESTIMONIALS } from "../../constants/landing/testimonials";
import TestimonialCard from "../ui/TestimonialCard";

export default function Problem() {
  return (
    <section className="py-24 max-w-screen-2xl mx-auto">
      {/* Header */}
      <div className="px-6 lg:px-12">
        <p className="text-primary font-semibold tracking-widest text-xs mb-4 uppercase">
          The Problem
        </p>
        <h2 className="text-3xl md:text-[2.75rem] font-semibold max-w-3xl tracking-tight leading-[1.5] text-foreground">
          Nigerian patients carry their health history in their heads — or not
          at all.
        </h2>

        <div className="mt-8">
          {/* Desktop — horizontal marquee (left → right) */}
          <div className="hidden md:block">
            <Marquee
              speed={40}
              gradient
              gradientColor="white"
              gradientWidth={80}
              pauseOnHover
            >
              {TESTIMONIALS.map((item, i) => (
                <TestimonialCard
                  key={i}
                  item={item}
                  className="w-[340px] mx-3 shrink-0"
                />
              ))}
            </Marquee>
          </div>

          {/* Mobile — horizontal marquee (left → right) */}
          <div className="flex md:hidden justify-center">
            <Marquee
              speed={35}
              gradient
              gradientColor="white"
              gradientWidth={60}
              pauseOnHover
            >
              {TESTIMONIALS.map((item, i) => (
                <div key={i} className="py-2.5">
                  <TestimonialCard
                    item={item}
                    className="w-[350px] mx-2 shrink-0"
                    quoteMarkClassName="absolute top-5 right-6 text-[6rem] leading-none font-serif text-primary/8 select-none pointer-events-none"
                  />
                </div>
              ))}
            </Marquee>
          </div>
        </div>
      </div>
    </section>
  );
}
