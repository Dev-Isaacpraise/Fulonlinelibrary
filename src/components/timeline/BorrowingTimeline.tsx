import React from "react";
import { BorrowRecord } from "../../types";
import { DueDateRing } from "../ui/DueDateRing";
import { VerifiedSeal } from "../ui/VerifiedSeal";
import { HashChip } from "../ui/HashChip";
import { DeskStatusChecklist } from "../ui/DeskStatusChecklist";
import { formatUnixDate, formatUnixDateTime } from "../../utils/bookCovers";
import { Check, AlertTriangle, ArrowRight, BookOpen, Clock } from "lucide-react";
import { Button } from "../ui/Button";
import { useWeb3 } from "../../context/Web3Context";

interface BorrowingTimelineProps {
  records: BorrowRecord[];
  onReturnClick?: (recordId: number) => void;
  showReturnButton?: boolean;
}

export const BorrowingTimeline: React.FC<BorrowingTimelineProps> = ({
  records,
  onReturnClick,
  showReturnButton = true,
}) => {
  const { account, config } = useWeb3();

  if (!records || records.length === 0) {
    return null;
  }

  return (
    <div className="relative pl-6 sm:pl-8 space-y-8 before:absolute before:top-3 before:bottom-3 before:left-3 before:w-[1px] before:bg-[#E5E5E5]">
      {records.map((record, index) => {
        const isUserBorrower =
          account &&
          record.borrower &&
          account.toLowerCase() === record.borrower.toLowerCase();

        const isOverdue =
          !record.returned &&
          record.dueDate < Math.floor(Date.now() / 1000);

        const hasPaidFine = BigInt(record.fineAmount || "0") > 0n;

        return (
          <div key={record.id} className="relative group">
            {/* Block Node Indicator on connecting vertical line */}
            <div className="absolute -left-6 sm:-left-8 top-2 w-5 h-5 rounded-[2px] bg-[#FFFFFF] border border-[#E5E5E5] flex items-center justify-center z-10 shadow-xs">
              <div
                className={`w-2 h-2 rounded-[1px] ${
                  record.returned
                    ? "bg-[#0F766E]"
                    : isOverdue
                    ? "bg-[#DC2626]"
                    : "bg-[#EA580C]"
                }`}
              />
            </div>

            {/* Timeline Item Card */}
            <div className="rounded-[4px] bg-[#FFFFFF] border border-[#E5E5E5] p-5 transition-colors hover:border-[#1A1A1A] shadow-xs">
              {/* Header: Book Title, ID, and On-Chain Seal */}
              <div className="flex items-start justify-between gap-4 pb-3 border-b border-[#E5E5E5]">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[11px] font-mono-ledger text-[#666666]">
                      Record #{record.id}
                    </span>
                    <span className="text-[#E5E5E5]">·</span>
                    <span className="text-[11px] font-mono-ledger text-[#666666]">
                      Book #{record.bookId}
                    </span>
                  </div>
                  <h4 className="font-serif-academic text-base sm:text-lg font-medium text-[#1A1A1A]">
                    {record.bookTitle || `Book ID #${record.bookId}`}
                  </h4>
                  {record.bookAuthor && (
                    <p className="text-xs text-[#666666] mt-0.5">
                      {record.bookAuthor}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {/* Verified on-chain seal */}
                  <VerifiedSeal record={record} />
                </div>
              </div>

              {/* Loan Progression (Borrowed -> Due -> Returned) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-4 border-b border-[#E5E5E5] text-xs">
                {/* 1. Borrowed */}
                <div>
                  <span className="text-[#666666] block text-[11px] uppercase tracking-wider font-mono-ledger mb-1">
                    Borrowed
                  </span>
                  <div className="text-[#1A1A1A] font-medium">
                    {formatUnixDate(record.borrowTimestamp)}
                  </div>
                  <span className="text-[10px] text-[#666666] block font-mono-ledger mt-0.5">
                    Block #{record.blockNumber || 31}
                  </span>
                </div>

                {/* 2. Due Date with Ring */}
                <div>
                  <span className="text-[#666666] block text-[11px] uppercase tracking-wider font-mono-ledger mb-1">
                    Due Date
                  </span>
                  <DueDateRing
                    dueDate={record.dueDate}
                    borrowTimestamp={record.borrowTimestamp}
                    returned={record.returned}
                    fineAmount={record.fineAmount}
                    fineRatePerDay={config?.fineRatePerDay}
                  />
                </div>

                {/* 3. Returned / Settlement */}
                <div>
                  <span className="text-[#666666] block text-[11px] uppercase tracking-wider font-mono-ledger mb-1">
                    Settlement Status
                  </span>
                  {record.returned ? (
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5 text-[#0F766E] font-medium">
                        <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>Returned {formatUnixDate(record.returnTimestamp)}</span>
                      </div>
                      {hasPaidFine ? (
                        <p className="text-[11px] text-[#DC2626] font-mono-ledger">
                          Late Fine: {record.fineAmount} wei
                        </p>
                      ) : (
                        <p className="text-[11px] text-[#666666]">
                          Returned within 14 days
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-[#EA580C] font-medium">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Active Custody</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Physical Desk Verification Checklist */}
              <div className="py-2.5 border-b border-[#E5E5E5]">
                <DeskStatusChecklist
                  recordId={record.id}
                  bookId={record.bookId}
                  borrower={record.borrower}
                />
              </div>

              {/* Card Footer: Borrower Hash & Return Action */}
              <div className="pt-3 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-[#666666]">Borrower:</span>
                  <HashChip value={record.borrower} type="address" digits={4} />
                  {isUserBorrower && (
                    <span className="text-[11px] text-[#0F766E] font-medium">
                      (Your Address)
                    </span>
                  )}
                </div>

                {/* Return button if active loan and user is borrower */}
                {!record.returned && showReturnButton && isUserBorrower && onReturnClick && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => onReturnClick(record.id)}
                    rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                  >
                    Return Book to Library
                  </Button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
