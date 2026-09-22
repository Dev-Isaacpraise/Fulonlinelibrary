import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useWeb3 } from "../context/Web3Context";
import { DueDateRing } from "../components/ui/DueDateRing";
import { VerifiedSeal } from "../components/ui/VerifiedSeal";
import { HashChip } from "../components/ui/HashChip";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { Modal } from "../components/ui/Modal";
import { EmptyState } from "../components/ui/EmptyState";
import { DeskStatusChecklist } from "../components/ui/DeskStatusChecklist";
import { formatUnixDate } from "../utils/bookCovers";
import { DeskCirculationStatus } from "../types";
import {
  BookOpen,
  Clock,
  ArrowRight,
  RotateCcw,
  FastForward,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Wallet,
} from "lucide-react";

export const MemberDashboardPage: React.FC = () => {
  const {
    account,
    role,
    memberData,
    activeLoans,
    records,
    returnBook,
    timeTravel,
    config,
    openConnectModal,
  } = useWeb3();

  const [selectedLoanToReturn, setSelectedLoanToReturn] = useState<number | null>(null);
  const [isReturning, setIsReturning] = useState(false);
  const [isTimeTraveling, setIsTimeTraveling] = useState(false);
  const [deskStatuses, setDeskStatuses] = useState<Record<number, DeskCirculationStatus>>({});

  useEffect(() => {
    fetch("/api/desk-status")
      .then((r) => r.json())
      .then((data) => {
        if (data.data) {
          const map: Record<number, DeskCirculationStatus> = {};
          data.data.forEach((d: DeskCirculationStatus) => {
            map[d.record_id] = d;
          });
          setDeskStatuses(map);
        }
      })
      .catch(() => {});
  }, []);

  const completedLoans = records.filter(
    (r) => account && r.borrower.toLowerCase() === account.toLowerCase() && r.returned
  );

  const currentBorrows = memberData?.currentBorrows || activeLoans.length;
  const maxBorrows = memberData?.maxBorrows || 3;
  const quotaPercent = Math.min(100, (currentBorrows / maxBorrows) * 100);

  const handleReturnConfirm = async () => {
    if (selectedLoanToReturn === null) return;
    setIsReturning(true);
    try {
      const res = await returnBook(selectedLoanToReturn);
      if (res.success) {
        // Also update desk return status
        fetch(`/api/desk-status/${selectedLoanToReturn}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            returned: true,
            picked_up: true,
            desk_notes: "Returned to library desk and confirmed on blockchain.",
          }),
        }).catch(() => {});

        setSelectedLoanToReturn(null);
      }
    } finally {
      setIsReturning(false);
    }
  };

  const handleAdvanceTime = async (days: number) => {
    setIsTimeTraveling(true);
    try {
      await timeTravel(days);
    } finally {
      setIsTimeTraveling(false);
    }
  };

  if (!account) {
    return (
      <div className="max-w-xl mx-auto py-16 px-4 space-y-6 text-center">
        <div className="w-12 h-12 rounded-[4px] bg-[#FAFAFA] border border-[#E5E5E5] flex items-center justify-center text-[#0F766E] mx-auto shadow-xs">
          <BookOpen className="w-6 h-6" />
        </div>
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-widest text-[#666666] font-medium">
            Authentication Required
          </p>
          <h2 className="font-serif-academic text-2xl sm:text-3xl font-medium text-[#1A1A1A]">
            Member Circulation Dashboard
          </h2>
          <p className="text-xs sm:text-sm text-[#666666] max-w-md mx-auto leading-relaxed">
            Please connect your wallet or select a verified university test identity to view your active book loans, return dates, and circulation history.
          </p>
        </div>
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button
            variant="primary"
            size="md"
            onClick={openConnectModal}
            leftIcon={<Wallet className="w-4 h-4" />}
          >
            Connect Identity
          </Button>
          <Link to="/catalogue">
            <Button variant="secondary" size="md">
              Browse Catalogue
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 py-6">
      {/* 1. Header & Greeting */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#E5E5E5]">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Badge variant="teal" dot>
              {role === "admin" ? "Library Administrator" : "Matriculated Member"}
            </Badge>
            {account && <HashChip value={account} type="address" digits={4} />}
          </div>
          <h1 className="font-serif-academic text-2xl sm:text-3xl font-medium text-[#1A1A1A]">
            {memberData?.name ? `Circulation Account: ${memberData.name}` : "Member Circulation Dashboard"}
          </h1>
          <p className="text-xs sm:text-sm text-[#666666] mt-1">
            Track active book loans, submit return receipts, and verify custody on the university ledger.
          </p>
        </div>

        <Link to="/catalogue">
          <Button variant="primary" size="md" rightIcon={<ArrowRight className="w-4 h-4" />}>
            Browse Catalogue
          </Button>
        </Link>
      </div>

      {/* 2. Top Stats Grid & Allowance Meter */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Allowance Meter */}
        <div className="rounded-[4px] bg-[#FFFFFF] border border-[#E5E5E5] p-5 space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#666666]">Borrowing Allowance</span>
            <span className="font-mono-ledger text-xs font-medium text-[#1A1A1A]">
              {currentBorrows} of {maxBorrows}
            </span>
          </div>

          <div className="h-1.5 w-full bg-[#FAFAFA] rounded-[2px] overflow-hidden border border-[#E5E5E5]">
            <div
              className={`h-full transition-all duration-300 ${
                currentBorrows >= maxBorrows
                  ? "bg-[#EA580C]"
                  : "bg-[#0F766E]"
              }`}
              style={{ width: `${quotaPercent}%` }}
            />
          </div>

          <p className="text-[11px] text-[#666666]">
            {maxBorrows - currentBorrows > 0
              ? `You can borrow ${maxBorrows - currentBorrows} more volume${maxBorrows - currentBorrows > 1 ? "s" : ""}.`
              : "Borrowing quota reached. Return active books to borrow more."}
          </p>
        </div>

        {/* Active Books Stat */}
        <div className="rounded-[4px] bg-[#FFFFFF] border border-[#E5E5E5] p-5 space-y-1 shadow-xs">
          <span className="text-xs text-[#666666]">Active Books in Custody</span>
          <p className="font-serif-academic text-2xl sm:text-3xl font-medium text-[#1A1A1A]">
            {activeLoans.length}
          </p>
          <p className="text-[11px] text-[#666666]">
            {activeLoans.some((l) => l.dueDate < Math.floor(Date.now() / 1000))
              ? "Notice: You have overdue books"
              : "All active books within borrowing window"}
          </p>
        </div>

        {/* Completed Returns Stat */}
        <div className="rounded-[4px] bg-[#FFFFFF] border border-[#E5E5E5] p-5 space-y-1 shadow-xs">
          <span className="text-xs text-[#666666]">Returned on Ledger</span>
          <p className="font-serif-academic text-2xl sm:text-3xl font-medium text-[#1A1A1A]">
            {completedLoans.length}
          </p>
          <p className="text-[11px] text-[#666666]">
            Permanent historical proof of return
          </p>
        </div>
      </div>

      {/* 3. EVM Time Simulator Tool */}
      <div className="p-4 sm:p-5 rounded-[4px] bg-[#FAFAFA] border border-[#E5E5E5] space-y-3 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <FastForward className="w-4 h-4 text-[#0F766E]" />
            <h3 className="text-xs sm:text-sm font-medium text-[#1A1A1A]">
              Local Hardhat EVM Time-Travel Simulator
            </h3>
          </div>
          <span className="text-[10px] text-[#666666] font-mono-ledger">
            evm_increaseTime & evm_mine
          </span>
        </div>

        <p className="text-xs text-[#666666] leading-relaxed">
          Fast-forward blockchain time to test overdue notifications and fine accruals in real-time without waiting days.
        </p>

        <div className="flex flex-wrap items-center gap-2 pt-1">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleAdvanceTime(1)}
            isLoading={isTimeTraveling}
          >
            +1 Day
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleAdvanceTime(7)}
            isLoading={isTimeTraveling}
          >
            +7 Days
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleAdvanceTime(18)}
            isLoading={isTimeTraveling}
          >
            +18 Days (Trigger Overdue & Fines)
          </Button>
        </div>
      </div>

      {/* 4. Active Books Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-serif-academic text-xl font-medium text-[#1A1A1A]">
            Active Books in Your Custody ({activeLoans.length})
          </h2>
          <span className="text-xs text-[#666666]">
            Recorded on Hardhat EVM
          </span>
        </div>

        {activeLoans.length === 0 ? (
          <EmptyState
            title="No Active Books"
            description="You currently hold no books from the library. Head over to the catalogue to borrow your next academic reading."
            actionLabel="Explore Catalogue"
            onAction={() => (window.location.href = "/catalogue")}
            iconType="book"
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {activeLoans.map((loan) => (
              <div
                key={loan.id}
                className="rounded-[4px] bg-[#FFFFFF] border border-[#E5E5E5] p-5 space-y-4 transition-colors hover:border-[#1A1A1A] shadow-xs"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-mono-ledger text-[#666666] uppercase tracking-wider">
                      Record #{loan.id} · Book #{loan.bookId}
                    </span>
                    <h3 className="font-serif-academic text-base sm:text-lg font-medium text-[#1A1A1A]">
                      {loan.bookTitle}
                    </h3>
                    <p className="text-xs text-[#666666]">
                      {loan.bookAuthor}
                    </p>
                  </div>
                  <VerifiedSeal record={loan} />
                </div>

                {/* Due Date Ring Indicator */}
                <div className="p-3 rounded-[4px] bg-[#FAFAFA] border border-[#E5E5E5]">
                  <DueDateRing
                    dueDate={loan.dueDate}
                    borrowTimestamp={loan.borrowTimestamp}
                    returned={loan.returned}
                    fineAmount={loan.fineAmount}
                    fineRatePerDay={config?.fineRatePerDay}
                  />
                </div>

                {/* Physical Pickup & Return Desk Checklist */}
                <DeskStatusChecklist
                  recordId={loan.id}
                  bookId={loan.bookId}
                  borrower={loan.borrower}
                  initialStatus={deskStatuses[loan.id]}
                  onStatusChange={(updated) => {
                    setDeskStatuses((prev) => ({ ...prev, [updated.record_id]: updated }));
                  }}
                />

                {/* Dates & Action */}
                <div className="flex items-center justify-between text-xs pt-2 border-t border-[#E5E5E5]">
                  <div>
                    <span className="text-[#666666] block text-[10px]">
                      Borrowed On
                    </span>
                    <span className="font-medium text-[#1A1A1A]">
                      {formatUnixDate(loan.borrowTimestamp)}
                    </span>
                  </div>

                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setSelectedLoanToReturn(loan.id)}
                    rightIcon={<RotateCcw className="w-3.5 h-3.5" />}
                  >
                    Return Book
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Return Confirmation Modal */}
      {selectedLoanToReturn !== null && (
        <Modal
          isOpen={selectedLoanToReturn !== null}
          onClose={() => setSelectedLoanToReturn(null)}
          title="Return Book to Ledger"
          subtitle="Smart contract settlement"
        >
          <div className="space-y-4">
            <p className="text-xs sm:text-sm text-[#1A1A1A] leading-relaxed">
              Returning this book will update its availability on the smart contract, clear it from your borrowed books, and calculate any accrued late fines according to blockchain timestamps.
            </p>

            <div className="p-3 rounded-[4px] bg-[#FAFAFA] border border-[#E5E5E5] text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[#666666]">Record ID:</span>
                <span className="font-mono-ledger font-medium text-[#1A1A1A]">#{selectedLoanToReturn}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#666666]">Borrower:</span>
                <HashChip value={account || ""} type="address" digits={4} />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3">
              <Button
                variant="secondary"
                size="md"
                onClick={() => setSelectedLoanToReturn(null)}
                disabled={isReturning}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={handleReturnConfirm}
                isLoading={isReturning}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Confirm Return On-Chain
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
