import React from "react";

interface BadgeProps {
  variant?: "neutral" | "teal" | "orange" | "danger" | "outline";
  children: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = "neutral",
  children,
  icon,
  className = "",
  dot = false,
}) => {
  const variants = {
    neutral:
      "bg-[#FAFAFA] text-[#666666] border border-[#E5E5E5]",
    teal:
      "bg-[#F0FDFA] text-[#0F766E] border border-[#99F6E4]",
    orange:
      "bg-[#FFF7ED] text-[#EA580C] border border-[#FED7AA]",
    danger:
      "bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA]",
    outline:
      "bg-[#FFFFFF] text-[#666666] border border-[#E5E5E5]",
  };

  const dotColors = {
    neutral: "bg-[#666666]",
    teal: "bg-[#0F766E]",
    orange: "bg-[#EA580C]",
    danger: "bg-[#DC2626]",
    outline: "bg-[#666666]",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[3px] text-[11px] font-medium tracking-normal whitespace-nowrap select-none ${variants[variant]} ${className}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotColors[variant]}`} />}
      {icon && <span className="flex-shrink-0">{icon}</span>}
      <span>{children}</span>
    </span>
  );
};
