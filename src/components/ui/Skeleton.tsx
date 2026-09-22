import React from "react";

export const Skeleton: React.FC<{ className?: string }> = ({ className = "" }) => {
  return (
    <div
      className={`animate-pulse bg-[#FAFAFA] border border-[#E5E5E5] rounded-[8px] ${className}`}
    />
  );
};
