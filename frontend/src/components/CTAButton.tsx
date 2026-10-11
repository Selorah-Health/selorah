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
    sm: 'px-4 py-2 text-sm gap-2',
    md: 'px-5 py-3 text-base gap-2.5',
    lg: 'px-7 py-3.5 text-lg gap-3',
  };

  const circleSize = {
    sm: 'w-7 h-7',
    md: 'w-8 h-8',
    lg: 'w-9 h-9',
  };

  const iconSize = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-4.5 h-4.5',
  };

  const variants = {
    primary:
      'bg-gradient-to-r from-[#6183FF] to-[#4D6ED6] text-white border border-[#6183FF]/50 shadow-lg shadow-[#6183FF]/25 hover:shadow-[#6183FF]/40',
    outline:
      'bg-transparent text-white border-2 border-white/70 hover:bg-white/10',
    white:
      'bg-white text-[#020924] border border-white/30 hover:bg-gray-50 shadow-md',
    dark:
      'bg-[#020924] text-white border border-[#020924]/80 hover:bg-[#0a0f2e]',
  };

  const circle = {
    primary: 'bg-white text-[#6183FF]',
    outline: 'bg-white text-[#020924]',
    white: 'bg-[#6183FF] text-white',
    dark: 'bg-white text-[#020924]',
  };

  const base =
    'inline-flex items-center font-semibold rounded-full transition-all duration-300 active:scale-[0.98] group select-none';

  const content = (
    <>
      <span className="leading-none">{children}</span>
      <span
        className={`${circleSize[size]} rounded-full flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110 ${circle[variant]}`}
      >
        <ArrowUpRightIcon className={iconSize[size]} strokeWidth={2.5} />
      </span>
    </>
  );

  if (href) {
    return (
      <a
        href={href}
        className={`${base} ${sizeMap[size]} ${variants[variant]} ${className}`}
      >
        {content}
      </a>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      className={`${base} ${sizeMap[size]} ${variants[variant]} ${className}`}
    >
      {content}
    </button>
  );
}
