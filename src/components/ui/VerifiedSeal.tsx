import React from "react";
import { Check } from "lucide-react";
import { useWeb3 } from "../../context/Web3Context";
import { BorrowRecord } from "../../types";

interface VerifiedSealProps {
  record?: BorrowRecord;
  size?: "sm" | "md";
  className?: string;
}

export const VerifiedSeal: React.FC<VerifiedSealProps> = ({
  record,
  size = "md",
  className = "",
}) => {
  const { setSelectedDrawerRecord } = useWeb3();

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (record) {
      setSelectedDrawerRecord(record);
    }
  };

  const dim = size === "sm" ? "w-5 h-5" : "w-6 h-6";
  const iconDim = size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5";

  return (
    <button
      type="button"
      onClick={handleClick}
      title="Verified On-Chain on Hardhat Ledger · Click for transaction proof"
      className={`inline-flex items-center justify-center rounded-[2px] bg-[#F0FDFA] border border-[#99F6E4] text-[#0F766E] hover:bg-[#CCFBF1] transition-colors cursor-pointer ${dim} ${className}`}
    >
      <Check className={`${iconDim} stroke-[2.5]`} />
    </button>
  );
};
