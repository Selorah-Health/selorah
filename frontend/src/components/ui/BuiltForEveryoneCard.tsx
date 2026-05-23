import {
  ArrowRightIcon,
  BeakerIcon,
  BuildingOffice2Icon,
  CheckCircleIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';
import type { LandingFeatureCard } from '../../types/landing';

const CARD_CONFIG = {
  patient: {
    Icon: UserCircleIcon,
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-800',
    checkColor: 'text-blue-700',
    ctaColor: 'text-blue-700',
    badge: null,
  },
  hospital: {
    Icon: BuildingOffice2Icon,
    iconBg: 'bg-teal-50',
    iconColor: 'text-teal-800',
    checkColor: 'text-teal-700',
    ctaColor: 'text-teal-700',
    badge: null,
  },
  research: {
    Icon: BeakerIcon,
    iconBg: 'bg-amber-50',
    iconColor: 'text-amber-800',
    checkColor: 'text-amber-700',
    ctaColor: 'text-amber-700',
    badge: '75% to patients · enforced by smart contract',
  },
} as const;

type IconKey = keyof typeof CARD_CONFIG;

type BuiltForEveryoneCardProps = {
  card: LandingFeatureCard;
  className?: string;
};

export default function BuiltForEveryoneCard({
  card,
  className = '',
}: BuiltForEveryoneCardProps) {
  const config = CARD_CONFIG[(card.iconKey as IconKey) ?? 'patient'];
  const { Icon } = config;

  return (
    <article
      id={card.id}
      className={`relative flex flex-col justify-between bg-white border border-(--border) rounded-2xl p-7 overflow-hidden scroll-mt-24 ${className}`}
    >
      {/* Top shimmer line — matches TestimonialCard */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

      <div className="flex flex-col flex-1">
        {/* Icon */}
        <div className={`w-9 h-9 rounded-lg ${config.iconBg} flex items-center justify-center mb-4`}>
          <Icon className={`w-5 h-5 ${config.iconColor}`} />
        </div>

        {/* Title */}
        <h3 className="text-3xl md:text-[2rem] font-medium mb-1.5">{card.title}</h3>

        {/* Desc */}
        <p className="text-xs text-muted leading-relaxed mb-3.5 flex-1">{card.desc}</p>

        <hr className="border-border mb-3.5" />

        {/* Features */}
        <ul className="space-y-1.5 mb-5">
          {card.features.map((feature, index) => (
            <li key={index} className="flex items-start gap-1.5 text-xs leading-snug">
              <CheckCircleIcon className={`w-3.5 h-3.5 ${config.checkColor} shrink-0 mt-0.5`} />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Footer CTA — mirrors TestimonialCard's author row position */}
      <div className="flex items-center gap-2.5">
        <div className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${config.iconBg} shrink-0`}>
          <Icon className={`w-4 h-4 ${config.iconColor}`} />
        </div>
        <button
          type="button"
          className={`flex items-center gap-1 text-sm font-medium ${config.ctaColor} bg-transparent border-none p-0 cursor-pointer group transition-[gap] duration-150 hover:gap-2`}
        >
          Learn more
          <ArrowRightIcon className="w-3.5 h-3.5" />
        </button>
      </div>
    </article>
  );
}