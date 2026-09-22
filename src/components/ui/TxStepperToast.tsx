import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Check, Loader2, AlertCircle, X, ExternalLink } from "lucide-react";
import { useWeb3 } from "../../context/Web3Context";
import { HashChip } from "./HashChip";

export const TxStepperToast: React.FC = () => {
  const { activeTx, clearActiveTx, setSelectedDrawerRecord, records } = useWeb3();

  if (activeTx.step === "idle") return null;

  const steps = [
    { id: "awaiting", label: "Awaiting signature" },
    { id: "confirming", label: "Confirming on chain" },
    { id: "recorded", label: "Recorded" },
  ];

  const currentStepIndex =
    activeTx.step === "awaiting"
      ? 0
      : activeTx.step === "confirming"
      ? 1
      : activeTx.step === "recorded"
      ? 2
      : -1;

  const handleViewReceipt = () => {
    if (activeTx.txHash) {
      const match = records.find((r) => r.txHash === activeTx.txHash) || {
        id: 0,
        bookId: 1,
        bookTitle: "On-Chain Transaction",
        bookAuthor: "Federal University Lokoja Library Ledger",
        borrower: "Current Wallet",
        borrowTimestamp: Math.floor(Date.now() / 1000),
        dueDate: Math.floor(Date.now() / 1000) + 14 * 86400,
        returnTimestamp: 0,
        fineAmount: "0",
        returned: false,
        txHash: activeTx.txHash,
        blockNumber: activeTx.blockNumber || 32,
      };
      setSelectedDrawerRecord(match);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full pointer-events-auto">
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.95 }}
          className="rounded-[8px] bg-[#FFFFFF] border border-[#E5E5E5] shadow-xl p-4 overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#E5E5E5]">
            <div className="flex items-center gap-2">
              {activeTx.step === "recorded" ? (
                <div className="w-5 h-5 rounded-full bg-[#0F766E]/15 text-[#0F766E] flex items-center justify-center">
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
              ) : activeTx.step === "error" ? (
                <div className="w-5 h-5 rounded-full bg-[#DC2626]/15 text-[#DC2626] flex items-center justify-center">
                  <AlertCircle className="w-3 h-3 stroke-[3]" />
                </div>
              ) : (
                <Loader2 className="w-4 h-4 animate-spin text-[#0F766E]" />
              )}
              <span className="font-serif-academic text-sm font-medium text-[#1A1A1A]">
                {activeTx.title || "Blockchain Transaction"}
              </span>
            </div>
            <button
              type="button"
              onClick={clearActiveTx}
              className="text-[#666666] hover:text-[#1A1A1A] p-1 rounded-full"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {activeTx.step === "error" ? (
            <div className="text-xs text-[#DC2626] bg-[#FEF2F2] p-2.5 rounded-[6px] border border-[#FECACA]">
              {activeTx.error || "Execution reverted on local Hardhat EVM."}
            </div>
          ) : (
            <>
              {/* Stepper Steps */}
              <div className="flex items-center justify-between mb-3 px-1">
                {steps.map((s, idx) => {
                  const isDone = currentStepIndex > idx || activeTx.step === "recorded";
                  const isCurrent = currentStepIndex === idx;

                  return (
                    <div key={s.id} className="flex flex-col items-center flex-1">
                      <div className="flex items-center w-full">
                        {idx > 0 && (
                          <div
                            className={`h-[2px] flex-1 ${
                              isDone || isCurrent
                                ? "bg-[#0F766E]"
                                : "bg-[#E5E5E5]"
                            }`}
                          />
                        )}
                        <div
                          className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono-ledger transition-colors ${
                            isDone
                              ? "bg-[#0F766E] text-white font-bold"
                              : isCurrent
                              ? "border-2 border-[#0F766E] text-[#0F766E] bg-transparent"
                              : "border border-[#E5E5E5] text-[#666666] bg-[#FAFAFA]"
                          }`}
                        >
                          {isDone ? <Check className="w-2.5 h-2.5 stroke-[3]" /> : idx + 1}
                        </div>
                        {idx < steps.length - 1 && (
                          <div
                            className={`h-[2px] flex-1 ${
                              isDone && currentStepIndex > idx
                                ? "bg-[#0F766E]"
                                : "bg-[#E5E5E5]"
                            }`}
                          />
                        )}
                      </div>
                      <span className="text-[10px] text-[#666666] mt-1.5 text-center line-clamp-1">
                        {s.label}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Receipt Footer */}
              {activeTx.step === "recorded" && (
                <div className="pt-2 border-t border-[#E5E5E5] flex items-center justify-between">
                  {activeTx.txHash && (
                    <HashChip value={activeTx.txHash} type="hash" digits={4} />
                  )}
                  <button
                    type="button"
                    onClick={handleViewReceipt}
                    className="inline-flex items-center gap-1 text-xs text-[#0F766E] hover:underline font-medium ml-auto"
                  >
                    <span>View proof</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              )}
            </>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
