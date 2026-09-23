import React from "react";
import { Book } from "../../types";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { truncateAddress, formatUnixDate, DEMO_CATALOG_COVER } from "../../utils/bookCovers";
import { useWeb3 } from "../../context/Web3Context";
import { BookOpen, Check, ArrowRight } from "lucide-react";

interface BookCardProps {
  book: Book;
  onBorrowClick?: (book: Book) => void;
  dueDate?: number;
}

export const BookCard: React.FC<BookCardProps> = ({
  book,
  onBorrowClick,
  dueDate,
}) => {
  const { account, role, openConnectModal } = useWeb3();
  const theme = book.coverTheme;
  const coverImage = book.coverImage || DEMO_CATALOG_COVER;

  const isCurrentBorrower =
    account &&
    book.currentBorrower &&
    account.toLowerCase() === book.currentBorrower.toLowerCase();

  return (
    <div
      className="group relative flex flex-col rounded-[4px] bg-[#FFFFFF] border border-[#E5E5E5] overflow-hidden transition-colors duration-150 hover:border-[#1A1A1A] shadow-xs"
      style={{ minHeight: "360px" }}
    >
      <div
        className="relative h-52 overflow-hidden select-none border-b border-[#E5E5E5]"
        style={{
          backgroundColor: theme?.bg || "#1C1C1E",
          color: theme?.text || "#F5F5F4",
        }}
      >
        <img
          src={coverImage}
          alt={`${book.title} cover`}
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/15 via-black/5 to-black/60" />

        <div className="absolute inset-x-0 top-0 bottom-0 left-3 w-[2px] opacity-40"
          style={{ backgroundColor: theme?.spine || "#333A42" }}
        />

        <div className="absolute inset-0 p-6 flex flex-col justify-between relative z-10">
          <div className="flex items-center justify-between text-[11px] font-mono-ledger opacity-80 pl-3 text-white">
            <span>FUL · LEDGER #{book.id}</span>
            <BookOpen className="w-3.5 h-3.5" />
          </div>

          <div className="pl-3 my-auto py-2">
            <h3 className="font-serif-academic text-base sm:text-lg font-medium leading-snug line-clamp-3 text-white drop-shadow-sm">
              {book.title}
            </h3>
            <p
              className="text-xs mt-1.5 line-clamp-1 font-sans opacity-90"
              style={{ color: theme?.subtext || "#E2E8F0" }}
            >
              {book.author}
            </p>
          </div>

          <div className="pl-3 flex items-center justify-between text-[10px] font-mono-ledger opacity-80 uppercase tracking-wider text-white">
            <span>Official Catalog</span>
            <span>Dept. of CS</span>
          </div>
        </div>
      </div>

      {/* Card Body / Details */}
      <div className="p-4 flex-1 flex flex-col justify-between gap-3 bg-[#FFFFFF]">
        <div className="flex items-center justify-between gap-2">
          {/* Availability Chip */}
          {book.isAvailable ? (
            <Badge variant="teal" dot>
              Available
            </Badge>
          ) : (
            <Badge variant="outline" dot>
              {dueDate ? `Borrowed · due ${formatUnixDate(dueDate)}` : "Borrowed"}
            </Badge>
          )}

          {/* Current Borrower (if on loan) */}
          {!book.isAvailable && book.currentBorrower && (
            <span className="text-[11px] font-mono-ledger text-[#666666]">
              {isCurrentBorrower ? "Borrowed by you" : truncateAddress(book.currentBorrower, 3)}
            </span>
          )}
        </div>

        <div className="pt-2 border-t border-[#E5E5E5] flex items-center justify-between gap-2">
          <span className="text-[11px] text-[#666666]">
            {book.isAvailable ? "Ready to borrow" : "Active loan recorded"}
          </span>

          {book.isAvailable ? (
            <Button
              variant={account ? "primary" : "secondary"}
              size="sm"
              onClick={() => {
                if (!account) {
                  openConnectModal();
                } else if (onBorrowClick) {
                  onBorrowClick(book);
                }
              }}
              rightIcon={<ArrowRight className="w-3 h-3" />}
            >
              {!account
                ? "Connect"
                : role === "unregistered"
                ? "Register to Borrow"
                : "Borrow"}
            </Button>
          ) : isCurrentBorrower ? (
            <Badge variant="teal" icon={<Check className="w-3 h-3" />}>
              In your custody
            </Badge>
          ) : (
            <span className="text-xs text-[#666666]">
              In circulation
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
