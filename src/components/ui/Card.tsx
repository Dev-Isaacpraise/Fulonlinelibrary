import React from "react";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "surface" | "raised" | "ghost";
  hoverEffect?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = "raised",
  hoverEffect = false,
  className = "",
  ...props
}) => {
  const variants = {
    raised:
      "bg-[#FFFFFF] border border-[#E5E5E5] shadow-xs",
    surface:
      "bg-[#FAFAFA] border border-[#E5E5E5]",
    ghost:
      "bg-transparent border border-[#E5E5E5]",
  };

  const hoverClass = hoverEffect
    ? "transition-all duration-200 hover:-translate-y-[2px] hover:border-[#1A1A1A] cursor-pointer"
    : "";

  return (
    <div
      className={`rounded-[12px] p-5 sm:p-6 ${variants[variant]} ${hoverClass} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
