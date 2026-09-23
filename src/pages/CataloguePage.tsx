import React, { useState, useMemo } from "react";
import { useWeb3 } from "../context/Web3Context";
import { BookCard } from "../components/books/BookCard";
import { Book } from "../types";
import { Chip } from "../components/ui/Chip";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import { Skeleton } from "../components/ui/Skeleton";
import { EmptyState } from "../components/ui/EmptyState";
import { HashChip } from "../components/ui/HashChip";
import { Badge } from "../components/ui/Badge";
import { formatUnixDate } from "../utils/bookCovers";
import {
  Search,
  LayoutGrid,
  List,
  BookOpen,
  Calendar,
  ShieldCheck,
  ArrowRight,
  AlertCircle,
} from "lucide-react";

export const CataloguePage: React.FC = () => {
  const {
    books,
    records,
    isLoadingBooks,
    account,
    role,
    memberData,
    borrowBook,
    activeLoans,
    openConnectModal,
    refreshData,
    registerMemberOnChain,
  } = useWeb3();

  const [searchQuery, setSearchQuery] = useState("");
  const [filterMode, setFilterMode] = useState<"all" | "available" | "on_loan">("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedBookToBorrow, setSelectedBookToBorrow] = useState<Book | null>(null);
  const [isSubmittingBorrow, setIsSubmittingBorrow] = useState(false);
  const [isRegisteringMember, setIsRegisteringMember] = useState(false);
  const [registrationMsg, setRegistrationMsg] = useState<string | null>(null);

  // Map active due dates from records
  const dueDatesMap = useMemo(() => {
    const map = new Map<number, number>();
    records.forEach((r) => {
      if (!r.returned) {
        map.set(r.bookId, r.dueDate);
      }
    });
    return map;
  }, [records]);

  // Filtered books
  const filteredBooks = useMemo(() => {
    return books.filter((b) => {
      const matchesSearch =
        b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(b.id) === searchQuery.trim();

      if (!matchesSearch) return false;

      if (filterMode === "available") return b.isAvailable;
      if (filterMode === "on_loan") return !b.isAvailable;
      return true;
    });
  }, [books, searchQuery, filterMode]);

  const availableCount = books.filter((b) => b.isAvailable).length;
  const onLoanCount = books.length - availableCount;

  const isMemberRegistered = Boolean(memberData?.isRegistered);

  const handleRegisterMember = async () => {
    if (!account) return;
    setIsRegisteringMember(true);
    setRegistrationMsg(null);
    try {
      const res = await fetch("/api/member/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberAddress: account,
          name: memberData?.name || "Library Member",
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        await registerMemberOnChain(account, memberData?.name || "Library Member");
      }
      setRegistrationMsg("Wallet registered as library member! You can now confirm borrowing.");
      await refreshData();
    } catch (err: any) {
      console.error("Auto registration error:", err);
      setRegistrationMsg(err.message || "Registration failed. Try again.");
    } finally {
      setIsRegisteringMember(false);
    }
  };

  const handleConfirmBorrow = async () => {
    if (!selectedBookToBorrow) return;
    setIsSubmittingBorrow(true);
    try {
      const res = await borrowBook(selectedBookToBorrow.id);
      if (res.success) {
        setSelectedBookToBorrow(null);
        setRegistrationMsg(null);
      }
    } finally {
      setIsSubmittingBorrow(false);
    }
  };

  const isAllowanceMaxed = (memberData?.currentBorrows || 0) >= (memberData?.maxBorrows || 3);

  return (
    <div className="space-y-8 py-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#E5E5E5] pb-6">
        <div>
          <h1 className="font-serif-academic text-3xl sm:text-4xl font-medium text-[#1A1A1A]">
            Library Catalogue
          </h1>
          <p className="text-sm text-[#666666] mt-1">
            Browse verified academic holdings. Borrow transactions are committed directly to the smart contract ledger.
          </p>
        </div>

        {/* User Borrowing Quota Chip */}
        {account && isMemberRegistered && memberData && (
          <div className="flex items-center gap-2 p-2 rounded-[4px] bg-[#FAFAFA] border border-[#E5E5E5] text-xs">
            <span className="text-[#666666]">Active Allowance:</span>
            <span className="font-mono-ledger font-medium text-[#1A1A1A]">
              {memberData.currentBorrows} / {memberData.maxBorrows} books
            </span>
            {isAllowanceMaxed && (
              <Badge variant="orange">Limit Reached</Badge>
            )}
          </div>
        )}
      </div>

      {/* Controls Bar: Search, Filters, Grid/List toggle */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Search input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[#666666] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title, author, or book ID..."
            className="w-full pl-9 pr-3 py-2 rounded-[4px] bg-[#FFFFFF] border border-[#E5E5E5] text-xs sm:text-sm text-[#1A1A1A] placeholder-[#666666] focus:outline-none focus:border-[#1A1A1A] transition-colors"
          />
        </div>

        {/* Filter Chips & View Mode Toggle */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <Chip
            label="All Volumes"
            selected={filterMode === "all"}
            count={books.length}
            onClick={() => setFilterMode("all")}
          />
          <Chip
            label="Available"
            selected={filterMode === "available"}
            count={availableCount}
            onClick={() => setFilterMode("available")}
          />
          <Chip
            label="Currently Borrowed"
            selected={filterMode === "on_loan"}
            count={onLoanCount}
            onClick={() => setFilterMode("on_loan")}
          />

          <div className="h-5 w-[1px] bg-[#E5E5E5] mx-1 hidden sm:block" />

          {/* Grid/List switch */}
          <div className="inline-flex rounded-[4px] bg-[#FAFAFA] border border-[#E5E5E5] p-0.5">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-[3px] transition-colors cursor-pointer ${
                viewMode === "grid"
                  ? "bg-[#FFFFFF] text-[#1A1A1A] shadow-xs"
                  : "text-[#666666]"
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-[3px] transition-colors cursor-pointer ${
                viewMode === "list"
                  ? "bg-[#FFFFFF] text-[#1A1A1A] shadow-xs"
                  : "text-[#666666]"
              }`}
              title="List View"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Book List / Grid */}
      {isLoadingBooks ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
            <div
              key={n}
              className="rounded-[4px] border border-[#E5E5E5] overflow-hidden bg-[#FFFFFF]"
              style={{ minHeight: "360px" }}
            >
              <Skeleton className="h-52 w-full rounded-none" />
              <div className="p-4 space-y-3">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-8 w-full mt-4" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredBooks.length === 0 ? (
        <EmptyState
          title="No books match your query"
          description={
            searchQuery
              ? `No catalog entries found for "${searchQuery}". Try searching for another subject, author, or reset your filters.`
              : "No books available in this filter."
          }
          actionLabel="Reset Search & Filters"
          onAction={() => {
            setSearchQuery("");
            setFilterMode("all");
          }}
          iconType="book"
        />
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredBooks.map((book) => (
            <BookCard
              key={book.id}
              book={book}
              dueDate={dueDatesMap.get(book.id)}
              onBorrowClick={(b) => {
                setSelectedBookToBorrow(b);
                setRegistrationMsg(null);
              }}
            />
          ))}
        </div>
      ) : (
        /* List View */
        <div className="rounded-[4px] border border-[#E5E5E5] bg-[#FFFFFF] divide-y divide-[#E5E5E5] overflow-hidden shadow-xs">
          {filteredBooks.map((book) => (
            <div
              key={book.id}
              className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-[#FAFAFA] transition-colors"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-14 rounded-[4px] flex-shrink-0 overflow-hidden border border-black/10 relative">
                  <img
                    src={book.coverImage || ""}
                    alt={`${book.title} cover`}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div>
                  <h4 className="font-serif-academic text-base font-medium text-[#1A1A1A]">
                    {book.title}
                  </h4>
                  <p className="text-xs text-[#666666]">
                    {book.author}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                {book.isAvailable ? (
                  <Badge variant="teal" dot>Available</Badge>
                ) : (
                  <Badge variant="outline">On loan</Badge>
                )}

                {book.isAvailable && (
                  !account ? (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={openConnectModal}
                    >
                      Connect
                    </Button>
                  ) : !isMemberRegistered ? (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        setSelectedBookToBorrow(book);
                        setRegistrationMsg(null);
                      }}
                    >
                      Register to Borrow
                    </Button>
                  ) : (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        setSelectedBookToBorrow(book);
                        setRegistrationMsg(null);
                      }}
                      disabled={isAllowanceMaxed}
                    >
                      Borrow
                    </Button>
                  )
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Borrow Confirmation Modal */}
      {selectedBookToBorrow && (
        <Modal
          isOpen={Boolean(selectedBookToBorrow)}
          onClose={() => {
            setSelectedBookToBorrow(null);
            setRegistrationMsg(null);
          }}
          title="Confirm Book Borrowing"
          subtitle="Smart contract loan verification"
        >
          <div className="space-y-5">
            {/* Book Summary Card */}
            <div className="p-4 rounded-[4px] bg-[#FAFAFA] border border-[#E5E5E5] flex items-start gap-3">
              <div className="w-12 h-16 rounded-[4px] overflow-hidden border border-black/10 flex-shrink-0">
                <img
                  src={selectedBookToBorrow.coverImage || ""}
                  alt={`${selectedBookToBorrow.title} cover`}
                  className="h-full w-full object-cover"
                />
              </div>
              <div>
                <h4 className="font-serif-academic text-base font-medium text-[#1A1A1A]">
                  {selectedBookToBorrow.title}
                </h4>
                <p className="text-xs text-[#666666]">
                  {selectedBookToBorrow.author}
                </p>
                <div className="flex items-center gap-1.5 mt-2 text-[11px] text-[#0F766E]">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Available on Hardhat Ledger</span>
                </div>
              </div>
            </div>

            {/* Terms & What will be written on-chain */}
            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between py-1.5 border-b border-[#E5E5E5]">
                <span className="text-[#666666]">Borrower Account</span>
                <HashChip value={account || ""} type="address" digits={4} />
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-[#E5E5E5]">
                <span className="text-[#666666]">Member Status</span>
                {isMemberRegistered ? (
                  <Badge variant="teal" dot>Registered Member</Badge>
                ) : (
                  <Badge variant="orange" dot>Unregistered Wallet</Badge>
                )}
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-[#E5E5E5]">
                <span className="text-[#666666]">Loan Duration</span>
                <span className="font-medium text-[#1A1A1A]">14 Days</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-[#E5E5E5]">
                <span className="text-[#666666]">Scheduled Due Date</span>
                <span className="font-medium text-[#1A1A1A]">
                  {formatUnixDate(Math.floor(Date.now() / 1000) + 14 * 86400)}
                </span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-[#E5E5E5]">
                <span className="text-[#666666]">Late Fine Rate</span>
                <span className="font-medium text-[#1A1A1A]">50 gwei / day overdue</span>
              </div>
            </div>

            {/* Warning or Registration Notice */}
            {!isMemberRegistered ? (
              <div className="p-3 rounded-[4px] bg-[#FFF7ED] border border-[#FED7AA] text-xs text-[#EA580C] space-y-2">
                <div className="flex items-center gap-2 font-medium">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>Registration required prior to borrowing</span>
                </div>
                <p className="text-[11px] text-[#666666] leading-relaxed">
                  This wallet isn't registered as a library member yet. Click below to register your account on the smart contract before borrowing.
                </p>
                {registrationMsg && (
                  <p className="text-xs font-medium text-[#0F766E] pt-1">
                    {registrationMsg}
                  </p>
                )}
              </div>
            ) : isAllowanceMaxed ? (
              <div className="p-3 rounded-[4px] bg-[#FFF7ED] border border-[#FED7AA] text-xs text-[#EA580C] flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>You have reached your maximum borrowing allowance of 3 books. Return an active loan to borrow more.</span>
              </div>
            ) : null}

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="secondary"
                size="md"
                onClick={() => {
                  setSelectedBookToBorrow(null);
                  setRegistrationMsg(null);
                }}
                disabled={isSubmittingBorrow || isRegisteringMember}
              >
                Cancel
              </Button>

              {!isMemberRegistered ? (
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleRegisterMember}
                  isLoading={isRegisteringMember}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Register as Library Member
                </Button>
              ) : (
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleConfirmBorrow}
                  isLoading={isSubmittingBorrow}
                  disabled={isAllowanceMaxed}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Confirm & Sign on Ledger
                </Button>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
