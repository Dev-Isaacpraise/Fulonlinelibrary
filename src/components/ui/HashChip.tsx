import React, { useState } from "react";
import { Copy, Check } from "lucide-react";
import { truncateAddress } from "../../utils/bookCovers";

interface HashChipProps {
  value: string;
  type?: "address" | "hash" | "id";
  digits?: number;
  className?: string;
  copyable?: boolean;
}

export const HashChip: React.FC<HashChipProps> = ({
  value,
  type = "address",
  digits = 4,
  className = "",
  copyable = true,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!value) return;
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const displayText =
    type === "id"
      ? `#${value}`
      : type === "hash"
      ? truncateAddress(value, 6)
      : truncateAddress(value, digits);

  return (
    <span
      onClick={copyable ? handleCopy : undefined}
      title={copyable ? `Click to copy: ${value}` : value}
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[6px] bg-[#FAFAFA] border border-[#E5E5E5] font-mono-ledger text-xs text-[#1A1A1A] ${
        copyable ? "cursor-pointer hover:border-[#1A1A1A] transition-colors" : ""
      } ${className}`}
    >
      <span>{displayText}</span>
      {copyable && (
        <span className="text-[#666666]">
          {copied ? (
            <Check className="w-3 h-3 text-[#0F766E]" />
          ) : (
            <Copy className="w-3 h-3" />
          )}
        </span>
      )}
    </span>
  );
};
