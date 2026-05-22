import React from "react";

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  icon?: React.ReactNode;
  className?: string;
};

export default function Button({
  children,
  variant = "primary",
  size = "md",
  icon,
  className = "",
  ...rest
}: ButtonProps) {
  const sizeClasses =
    size === "sm" ? "px-3 py-1 text-sm" : size === "lg" ? "px-7 py-3 text-base" : "px-5 py-2 text-sm";

  const variantClasses =
    variant === "secondary"
      ? "border-gray-200 bg-transparent text-current hover:bg-gray-50"
      : variant === "ghost"
      ? "bg-transparent border-transparent text-current hover:opacity-90"
      : "border-white/20 bg-transparent text-current hover:bg-white/10";

  return (
    <button
      {...rest}
      className={`inline-flex items-center justify-center gap-2 rounded-full transition-colors ${sizeClasses} ${variantClasses} ${className}`}
    >
      {icon && <span className="flex items-center">{icon}</span>}
      {children}
    </button>
  );
}
