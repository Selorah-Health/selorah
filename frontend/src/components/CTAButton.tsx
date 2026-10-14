import { ArrowUpRightIcon } from '@heroicons/react/24/outline';

interface CTAButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  href?: string;
  variant?: 'primary' | 'outline' | 'white' | 'dark';
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  type?: 'button' | 'submit';
}

export default function CTAButton({
  children,
  onClick,
  href,
  variant = 'primary',
  className = '',
  size = 'md',
  type = 'button',
}: CTAButtonProps) {
  const sizeMap = {
    sm: { pad: 'pl-4 pr-1.5 py-1.5 text-sm', circle: 'w-7 h-7', icon: 'w-3.5 h-3.5' },
    md: { pad: 'pl-5 pr-1.5 py-1.5 text-base', circle: 'w-8 h-8', icon: 'w-4 h-4' },
    lg: { pad: 'pl-6 pr-2 py-2 text-lg', circle: 'w-9 h-9', icon: 'w-4.5 h-4.5' },
  };

  const s = sizeMap[size];

  const variants = {
    primary: {
      wrap: 'bg-gradient-to-r from-[#6183FF] to-[#4D6ED6] text-white border border-[#6183FF]/40 shadow-lg shadow-[#6183FF]/20',
      circle: 'bg-white text-[#6183FF]',
    },
    outline: {
      wrap: 'bg-transparent text-white border-2 border-white/70',
      circle: 'bg-white text-[#020924]',
    },
    white: {
      wrap: 'bg-white text-[#020924] border border-white/20 shadow-sm',
      circle: 'bg-[#020924] text-white',
    },
    dark: {
      wrap: 'bg-[#020924] text-white border border-[#020924]',
      circle: 'bg-white text-[#020924]',
    },
  };

  const v = variants[variant];

  const content = (
    <>
      <span className="leading-none font-semibold text-left">{children}</span>
      <span
        className={`${s.circle} rounded-full flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110 ${v.circle}`}
      >
        <ArrowUpRightIcon className={s.icon} strokeWidth={2.5} />
      </span>
    </>
  );

  const base = `inline-flex items-center justify-between gap-3 rounded-full transition-all duration-300 active:scale-[0.98] group select-none ${s.pad} ${v.wrap} ${className}`;

  if (href) {
    return (
      <a href={href} className={base}>
        {content}
      </a>
    );
  }

  return (
    <button type={type} onClick={onClick} className={base}>
      {content}
    </button>
  );
}
