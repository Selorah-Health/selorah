import type { Testimonial } from "../../types/landing/testimonials";

type TestimonialCardProps = {
  item: Testimonial;
  className?: string;
  quoteMarkClassName?: string;
};

export default function TestimonialCard({
  item,
  className = "",
  quoteMarkClassName = "absolute top-2 left-0 text-[6rem] leading-none font-serif text-primary/8 select-none pointer-events-none",
}: TestimonialCardProps) {
  return (
    <div
      className={`relative flex h-[350px] flex-col justify-between bg-white border border-(--border) rounded-2xl p-7 overflow-hidden ${className}`}
    >
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

      <span className={quoteMarkClassName} aria-hidden="true">
        &ldquo;
      </span>

      <p className="relative text-base font-light leading-relaxed text-foreground/85 mb-8 overflow-hidden">
        {item.quote}
      </p>

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
          <p className="text-sm font-medium text-foreground/90">{item.author}</p>
          <p className="text-xs text-muted/70">
            {item.age} · {item.location}
          </p>
        </div>
      </div>
    </div>
  );
}
