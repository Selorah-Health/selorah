import React from "react";

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg" | "xl";
  icon?: React.ReactNode;
  className?: string;
  text?: string; // Optional text prop for accessibility when using icon-only buttons
  theme?: "dark" | "light";
};

export default function Button({
  children,
  variant = "primary",
  size = "md",
  icon,
  text,
  className = "",
  theme = "dark",
  ...rest
}: ButtonProps) {
  const sizeClasses =
    size === "sm"
      ? "px-3 py-2 text-sm"
      : size === "md"
      ? "px-5 py-2 text-base"
      : size === "lg"
      ? "px-7 py-3 text-base"
      : size === "xl"
      ? "px-9 py-3 text-lg"
      : "px-5 py-2 text-base";

  const variantClasses = (() => {
    if (variant === "ghost") return "bg-transparent border-transparent text-current hover:opacity-90";

    if (variant === "secondary") {
      return theme === "dark"
        ? "bg-transparent border-white/20 text-white hover:bg-white/6"
        : "bg-transparent border-gray-200 text-gray-900 hover:bg-gray-50";
    }

    // primary (hover uses a lighter blue)
    return theme === "dark"
      ? "bg-[#6183FF] text-white border-transparent hover:bg-[#7FA6FF]"
      : "bg-[#4262FF] text-white border-transparent hover:bg-[#5B7DFF]";
  })();

  return (
    <button
      {...rest}
      className={`inline-flex items-center justify-center gap-2 rounded-full transition-colors ${sizeClasses} ${variantClasses} ${className}`}
    >
      {icon && <span className="flex items-center">{icon}</span>}
      {text && <span>{text}</span>}
      {children}
    </button>
  );
}
