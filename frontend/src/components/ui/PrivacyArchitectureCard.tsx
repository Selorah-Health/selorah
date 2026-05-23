import type { PrivacyArchitectureCard as PrivacyArchitectureCardData } from "../../types/landing/privacyArchitecture";

type PrivacyArchitectureCardProps = {
  card: PrivacyArchitectureCardData;
  className?: string;
};

export default function PrivacyArchitectureCard({
  card,
  className = "",
}: PrivacyArchitectureCardProps) {
  const { Icon, num, title, body } = card;

  return (
    <article
      className={`relative flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] p-6 transition-colors duration-200 hover:border-white/20 ${className}`}
    >
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

      <div className="flex flex-col flex-1">
        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
          <Icon className="w-5 h-5 text-primary/70" />
        </div>

        <p className="text-[11px] font-medium tracking-widest text-primary/60 mb-1.5">
          {num}
        </p>

        <h3 className="text-[15px] font-medium text-white mb-2">
          {title}
        </h3>

        <p className="text-sm text-white/50 leading-relaxed flex-1">{body}</p>
      </div>
    </article>
  );
}