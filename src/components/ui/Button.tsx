import React from "react";
import { Loader2 } from "lucide-react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "subtle" | "ghost" | "danger" | "teal";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = "primary",
  size = "md",
  isLoading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  className = "",
  ...props
}) => {
  const base =
    "inline-flex items-center justify-center font-medium rounded-[4px] transition-colors duration-150 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none focus:outline-none focus-visible:ring-1 focus-visible:ring-[#1A1A1A]";

  const sizes = {
    sm: "text-xs px-3 py-1.5 gap-1.5 min-h-[32px]",
    md: "text-xs sm:text-sm px-4 py-2 gap-2 min-h-[38px]",
    lg: "text-sm sm:text-base px-5 py-2.5 gap-2.5 min-h-[42px]",
  };

  // Primary: solid near-black (#1A1A1A) with white text (#FFFFFF)
  // Secondary: clean white with border (#E5E5E5)
  const variants = {
    primary:
      "bg-[#1A1A1A] text-[#FFFFFF] hover:bg-[#2E2E2E] active:bg-[#0A0A0A] border border-transparent shadow-[0_1px_2px_rgba(0,0,0,0.08)]",
    secondary:
      "bg-[#FFFFFF] text-[#1A1A1A] border border-[#E5E5E5] hover:bg-[#FAFAFA] hover:border-[#D4D4D4] shadow-[0_1px_2px_rgba(0,0,0,0.03)]",
    subtle:
      "bg-[#FAFAFA] text-[#1A1A1A] hover:bg-[#F0F0F0] border border-[#E5E5E5]",
    ghost:
      "bg-transparent text-[#666666] hover:text-[#1A1A1A] hover:bg-[#FAFAFA]",
    danger:
      "bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA] hover:bg-[#FEE2E2]",
    teal:
      "bg-[#F0FDFA] text-[#0F766E] border border-[#99F6E4] hover:bg-[#CCFBF1]",
  };

  return (
    <button
      disabled={disabled || isLoading}
      className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin text-current" />
      ) : (
        leftIcon
      )}
      <span className="whitespace-nowrap">{children}</span>
      {!isLoading && rightIcon}
    </button>
  );
};
