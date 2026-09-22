import React from "react";

interface ChipProps {
  label: string;
  selected?: boolean;
  count?: number;
  onClick?: () => void;
  className?: string;
  icon?: React.ReactNode;
}

export const Chip: React.FC<ChipProps> = ({
  label,
  selected = false,
  count,
  onClick,
  className = "",
  icon,
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[4px] text-xs font-medium transition-colors duration-150 whitespace-nowrap cursor-pointer select-none border ${
        selected
          ? "bg-[#1A1A1A] text-[#FFFFFF] border-[#1A1A1A] shadow-xs"
          : "bg-[#FFFFFF] text-[#666666] border-[#E5E5E5] hover:border-[#CCCCCC] hover:text-[#1A1A1A] hover:bg-[#FAFAFA]"
      } ${className}`}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      <span>{label}</span>
      {typeof count === "number" && (
        <span
          className={`text-[10px] px-1.5 py-0.2 rounded-[3px] font-medium ${
            selected
              ? "bg-white/20 text-white"
              : "bg-[#FAFAFA] text-[#666666] border border-[#E5E5E5]"
          }`}
        >
          {count}
        </span>
      )}
    </button>
  );
};
