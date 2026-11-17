import { m } from 'framer-motion';
import { ArrowRightIcon } from '@heroicons/react/24/outline';

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
  const sizes = {
    sm: 'min-h-[38px] px-3.5 py-2 text-sm',
    md: 'min-h-[44px] px-4 py-2.5 text-sm',
    lg: 'min-h-[48px] px-5 py-3 text-base',
  };

  const variants = {
    primary: 'bg-primary text-white hover:bg-primary-hover',
    outline: 'border border-[#D5DCE8] bg-white text-[#101217] hover:bg-[#F6F8FA]',
    white: 'border border-white/20 bg-white text-[#101217] hover:bg-[#F6F8FA]',
    dark: 'bg-[#101217] text-white hover:bg-[#020924]',
  };

  const base = `group inline-flex items-center justify-center gap-2 rounded-none font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${sizes[size]} ${variants[variant]} ${className}`;

  const content = (
    <>
      <span>{children}</span>
      <ArrowRightIcon
        className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
        strokeWidth={2}
      />
    </>
  );

  const motionProps = {
    whileHover: { y: -1 },
    whileTap: { scale: 0.985 },
    transition: { duration: 0.18, ease: 'easeOut' as const },
  };

  if (href) {
    return (
      <m.a href={href} className={base} {...motionProps}>
        {content}
      </m.a>
    );
  }

  return (
    <m.button type={type} onClick={onClick} className={base} {...motionProps}>
      {content}
    </m.button>
  );
}
