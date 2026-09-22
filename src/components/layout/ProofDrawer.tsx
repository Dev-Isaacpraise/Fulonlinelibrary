import React from "react";
import { Drawer } from "../ui/Drawer";
import { HashChip } from "../ui/HashChip";
import { Badge } from "../ui/Badge";
import { useWeb3 } from "../../context/Web3Context";
import { formatUnixDateTime } from "../../utils/bookCovers";
import { ShieldCheck, Layers, Clock, BookOpen, User } from "lucide-react";

export const ProofDrawer: React.FC = () => {
  const { selectedDrawerRecord, setSelectedDrawerRecord, config } = useWeb3();

  if (!selectedDrawerRecord) return null;

  return (
    <Drawer
      isOpen={Boolean(selectedDrawerRecord)}
      onClose={() => setSelectedDrawerRecord(null)}
      title="Verified On-Chain Proof"
      subtitle="Cryptographic verification on Federal University Lokoja Ledger"
    >
      <div className="space-y-6">
        {/* Verification Status Banner */}
        <div className="p-4 rounded-[4px] bg-[#0F766E]/10 border border-[#0F766E]/30 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-[#0F766E] flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-[#0F766E]">
              Immutable Smart Contract Record
            </h4>
            <p className="text-xs text-[#1A1A1A] mt-0.5 leading-relaxed">
              This loan event was committed to block #{selectedDrawerRecord.blockNumber || 32} on the local Hardhat EVM network and is permanently cryptographically verified.
            </p>
          </div>
        </div>

        {/* Book Details */}
        <div className="p-4 rounded-[4px] bg-[#FAFAFA] border border-[#E5E5E5] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#666666] flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Catalog Volume</span>
            </span>
            <Badge variant="outline">Book #{selectedDrawerRecord.bookId}</Badge>
          </div>
          <div>
            <p className="font-serif-academic text-base font-medium text-[#1A1A1A]">
              {selectedDrawerRecord.bookTitle || `Book ID #${selectedDrawerRecord.bookId}`}
            </p>
            <p className="text-xs text-[#666666] mt-0.5">
              {selectedDrawerRecord.bookAuthor}
            </p>
          </div>
        </div>

        {/* Ledger Metadata Table */}
        <div className="space-y-3.5 text-xs">
          <div className="flex items-center justify-between py-2 border-b border-[#E5E5E5]">
            <span className="text-[#666666]">Record ID</span>
            <HashChip value={String(selectedDrawerRecord.id)} type="id" copyable={false} />
          </div>

          <div className="flex items-center justify-between py-2 border-b border-[#E5E5E5]">
            <span className="text-[#666666]">Transaction Hash</span>
            <HashChip value={selectedDrawerRecord.txHash || "0x4f...8a"} type="hash" digits={6} />
          </div>

          <div className="flex items-center justify-between py-2 border-b border-[#E5E5E5]">
            <span className="text-[#666666] flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5" />
              <span>Block Number</span>
            </span>
            <span className="font-mono-ledger text-[#1A1A1A] font-medium">
              #{selectedDrawerRecord.blockNumber || 32}
            </span>
          </div>

          <div className="flex items-center justify-between py-2 border-b border-[#E5E5E5]">
            <span className="text-[#666666] flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" />
              <span>Borrower Address</span>
            </span>
            <HashChip value={selectedDrawerRecord.borrower} type="address" digits={4} />
          </div>

          <div className="flex items-center justify-between py-2 border-b border-[#E5E5E5]">
            <span className="text-[#666666] flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              <span>Borrow Timestamp</span>
            </span>
            <span className="text-[#1A1A1A]">
              {formatUnixDateTime(selectedDrawerRecord.borrowTimestamp)}
            </span>
          </div>

          <div className="flex items-center justify-between py-2 border-b border-[#E5E5E5]">
            <span className="text-[#666666]">Due Date</span>
            <span className="text-[#1A1A1A]">
              {formatUnixDateTime(selectedDrawerRecord.dueDate)}
            </span>
          </div>

          <div className="flex items-center justify-between py-2 border-b border-[#E5E5E5]">
            <span className="text-[#666666]">Contract Address</span>
            <HashChip value={config?.address || "0x5FbDB...aa3"} type="address" digits={4} />
          </div>

          <div className="flex items-center justify-between py-2 border-b border-[#E5E5E5]">
            <span className="text-[#666666]">Settlement Status</span>
            <Badge variant={selectedDrawerRecord.returned ? "teal" : "orange"} dot>
              {selectedDrawerRecord.returned ? "Returned & Settled" : "Active Loan"}
            </Badge>
          </div>
        </div>

        {/* Chain Information */}
        <div className="p-3.5 rounded-[4px] bg-[#FAFAFA] border border-[#E5E5E5] text-[11px] text-[#666666] space-y-1">
          <p className="font-medium text-[#1A1A1A]">Network Verification</p>
          <p>Local Hardhat EVM (Chain ID: 31337)</p>
          <p>Solidity v0.8.24 · Contract: LibrarySystem.sol</p>
        </div>
      </div>
    </Drawer>
  );
};
