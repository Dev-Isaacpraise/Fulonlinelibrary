import React from "react";
import { ethers } from "ethers";

interface DueDateRingProps {
  dueDate: number; // unix timestamp seconds
  borrowTimestamp: number;
  returned?: boolean;
  fineAmount?: string;
  fineRatePerDay?: string;
}

export const DueDateRing: React.FC<DueDateRingProps> = ({
  dueDate,
  borrowTimestamp,
  returned = false,
  fineAmount = "0",
  fineRatePerDay = "50000000000",
}) => {
  const now = Math.floor(Date.now() / 1000);

  if (returned) {
    const isOverdueReturned = BigInt(fineAmount || "0") > 0n;
    return (
      <div className="flex items-center gap-2.5">
        <div className="relative w-8 h-8 flex items-center justify-center">
          <svg className="w-8 h-8 -rotate-90" viewBox="0 0 36 36">
            <circle
              cx="18"
              cy="18"
              r="14"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              className={isOverdueReturned ? "text-[#DC2626]/20" : "text-[#0F766E]/20"}
            />
            <circle
              cx="18"
              cy="18"
              r="14"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeDasharray="88"
              strokeDashoffset="0"
              className={isOverdueReturned ? "text-[#DC2626]" : "text-[#0F766E]"}
            />
          </svg>
        </div>
        <div>
          <p className="text-xs font-medium text-[#1A1A1A]">
            {isOverdueReturned ? "Returned (Overdue)" : "Returned On-Time"}
          </p>
          <p className="text-[11px] text-[#666666]">
            {isOverdueReturned
              ? `Fine assessed: ${ethers.formatUnits(fineAmount, "gwei")} gwei`
              : "Zero fines · Ledger settled"}
          </p>
        </div>
      </div>
    );
  }

  // Active Loan
  const totalLoanPeriod = Math.max(1, dueDate - borrowTimestamp);
  const secondsRemaining = dueDate - now;
  const daysRemaining = Math.ceil(secondsRemaining / 86400);

  // Status calculation
  let status: "safe" | "dueSoon" | "overdue" = "safe";
  let strokeColor = "#0F766E"; // light teal default
  let ringBg = "text-[#0F766E]/20";
  let statusText = "";
  let subText = "";

  if (secondsRemaining < 0) {
    // Overdue
    status = "overdue";
    strokeColor = "#DC2626"; // red
    ringBg = "text-[#DC2626]/20";
    const overdueSeconds = Math.abs(secondsRemaining);
    const overdueDays = Math.ceil(overdueSeconds / 86400);
    const estimatedFine = BigInt(overdueDays) * BigInt(fineRatePerDay);
    const fineGwei = ethers.formatUnits(estimatedFine, "gwei");

    statusText = `${overdueDays} day${overdueDays > 1 ? "s" : ""} overdue`;
    subText = `Accruing fine: ${fineGwei} gwei`;
  } else if (daysRemaining <= 3) {
    // Due soon
    status = "dueSoon";
    strokeColor = "#EA580C"; // orange
    ringBg = "text-[#EA580C]/20";
    statusText = daysRemaining === 0 ? "Due today" : `Due in ${daysRemaining} day${daysRemaining > 1 ? "s" : ""}`;
    subText = "Return soon to prevent late fees";
  } else {
    // Safe
    status = "safe";
    statusText = `Due in ${daysRemaining} days`;
    subText = "Within standard borrowing period";
  }

  // Progress percentage (1 to 0 as time runs out)
  const progressRatio = Math.max(0, Math.min(1, secondsRemaining / totalLoanPeriod));
  const dashOffset = 88 - progressRatio * 88;

  return (
    <div className="flex items-center gap-3">
      <div className="relative w-8 h-8 flex items-center justify-center flex-shrink-0">
        <svg className="w-8 h-8 -rotate-90" viewBox="0 0 36 36">
          <circle
            cx="18"
            cy="18"
            r="14"
            fill="none"
            stroke="currentColor"
            strokeWidth="3.2"
            className={ringBg}
          />
          <circle
            cx="18"
            cy="18"
            r="14"
            fill="none"
            stroke={
              status === "safe"
                ? "var(--accent-teal)"
                : status === "dueSoon"
                ? "var(--status-due-soon)"
                : "var(--status-danger)"
            }
            strokeWidth="3.2"
            strokeDasharray="88"
            strokeDashoffset={status === "overdue" ? 0 : dashOffset}
            strokeLinecap="round"
          />
        </svg>
      </div>
      <div>
        <p
          className={`text-xs font-medium ${
            status === "overdue"
              ? "text-[#DC2626]"
              : status === "dueSoon"
              ? "text-[#EA580C]"
              : "text-[#0F766E]"
          }`}
        >
          {statusText}
        </p>
        <p className="text-[11px] text-[#666666] mt-0.5">
          {subText}
        </p>
      </div>
    </div>
  );
};
