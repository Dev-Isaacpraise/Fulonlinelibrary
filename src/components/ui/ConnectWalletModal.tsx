import React, { useEffect, useState } from "react";
import { Modal } from "./Modal";
import { useWeb3 } from "../../context/Web3Context";
import { Badge } from "./Badge";
import { Button } from "./Button";
import { HashChip } from "./HashChip";
import { truncateAddress } from "../../utils/bookCovers";
import {
  Wallet,
  BookOpen,
  Lock,
  ArrowRight,
  Info,
  CheckCircle2,
} from "lucide-react";

export const ConnectWalletModal: React.FC = () => {
  const {
    isConnectModalOpen,
    closeConnectModal,
    config,
    switchAccount,
    account,
  } = useWeb3();

  const [connectionStage, setConnectionStage] = useState<"idle" | "connecting" | "connected">("idle");

  useEffect(() => {
    if (!isConnectModalOpen) {
      setConnectionStage("idle");
    }
  }, [isConnectModalOpen]);

  const handleSelectAccount = async (address: string, privateKey?: string) => {
    await switchAccount(address, privateKey);
    closeConnectModal();
  };

  const handleDemoConnect = () => {
    const demoAccount = config?.sampleAccounts?.[0] || {
      address: "0x71C9B40D9A1455dA3879b5a3A0eF987F2C8D92A4",
      privateKey: "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
      name: "Demo Scholar",
    };

    setConnectionStage("connecting");

    window.setTimeout(() => {
      setConnectionStage("connected");

      window.setTimeout(() => {
        void switchAccount(demoAccount.address, demoAccount.privateKey);
      }, 1200);
    }, 1400);
  };

  const currentTitle =
    connectionStage === "connecting"
      ? "Connecting Wallet..."
      : connectionStage === "connected"
      ? "Wallet Connected"
      : "Connect to Library Ledger";

  const currentSubtitle =
    connectionStage === "connecting"
      ? "Preparing your demo session."
      : connectionStage === "connected"
      ? "Federal University Lokoja · Demo Mode"
      : "Federal University Lokoja · On-Chain Circulation";

  return (
    <Modal
      isOpen={isConnectModalOpen}
      onClose={closeConnectModal}
      title={currentTitle}
      subtitle={currentSubtitle}
      maxWidth="max-w-lg"
    >
      <div className="space-y-6">
        {connectionStage === "idle" && (
          <>
            <div className="p-3 rounded-[4px] bg-[#FAFAFA] border border-[#E5E5E5] flex items-start gap-3">
              <Info className="w-4 h-4 text-[#0F766E] flex-shrink-0 mt-0.5" />
              <p className="text-xs text-[#666666] leading-relaxed">
                This demo simulates a wallet connection so the library flow can be presented when a browser wallet extension is unavailable.
              </p>
            </div>

            <div className="p-3.5 rounded-[4px] bg-[#FFFFFF] border border-[#E5E5E5] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-[4px] bg-[#0F766E]/10 border border-[#0F766E]/30 flex items-center justify-center text-[#0F766E]">
                  <Wallet className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-medium text-[#1A1A1A]">
                    Library Demo Wallet
                  </p>
                  <p className="text-[11px] text-[#666666]">
                    Instant access for presentation flow
                  </p>
                </div>
              </div>

              <Button
                variant="primary"
                size="sm"
                onClick={handleDemoConnect}
                leftIcon={<Wallet className="w-3.5 h-3.5" />}
              >
                Connect Wallet
              </Button>
            </div>
          </>
        )}

        {connectionStage === "connecting" && (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[#E5E5E5] bg-[#FAFAFA]">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#0F766E]/20 border-t-[#0F766E]" />
            </div>
            <p className="mt-4 text-sm font-medium text-[#1A1A1A]">Connecting Wallet...</p>
            <p className="mt-1 text-xs text-[#666666]">Preparing your demo library session.</p>
          </div>
        )}

        {connectionStage === "connected" && (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#0F766E]/10 border border-[#0F766E]/20 text-[#0F766E]">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <p className="mt-4 text-sm font-medium text-[#1A1A1A]">Wallet Connected</p>
            <div className="mt-2 flex items-center gap-2 rounded-full border border-[#E5E5E5] bg-[#FAFAFA] px-3 py-1.5 text-xs text-[#1A1A1A]">
              <span className="font-mono-ledger text-[#666666]">
                {truncateAddress(config?.sampleAccounts?.[0]?.address || "0x71C9B40D9A1455dA3879b5a3A0eF987F2C8D92A4", 4)}
              </span>
              <span className="text-[10px] uppercase tracking-[0.12em] text-[#666666]">Demo</span>
            </div>
          </div>
        )}

        {connectionStage === "idle" && (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#666666]">
                University Test Profiles (Instant Access)
              </span>
              <span className="text-[11px] font-mono-ledger text-[#666666]">
                Chain 31337
              </span>
            </div>

            <p className="text-xs text-[#666666]">
              Select an official test profile to demonstrate borrowing, book circulation, and administrative verification:
            </p>

            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {config?.sampleAccounts?.map((sa) => {
                const isCurrent = account && sa.address.toLowerCase() === account.toLowerCase();
                const isAdmin = sa.role === "admin";

                return (
                  <button
                    key={sa.address}
                    type="button"
                    onClick={() => handleSelectAccount(sa.address, sa.privateKey)}
                    className={`w-full text-left p-2.5 rounded-[4px] border transition-colors flex items-center justify-between gap-3 group cursor-pointer ${
                      isCurrent
                        ? "bg-[#0F766E]/10 border-[#0F766E]/40"
                        : "bg-[#FFFFFF] border-[#E5E5E5] hover:border-[#1A1A1A] hover:bg-[#FAFAFA]"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-7 h-7 rounded-[3px] flex items-center justify-center flex-shrink-0 ${
                          isAdmin
                            ? "bg-[#0F766E]/15 text-[#0F766E]"
                            : "bg-[#FAFAFA] text-[#666666]"
                        }`}
                      >
                        {isAdmin ? <Lock className="w-3.5 h-3.5" /> : <BookOpen className="w-3.5 h-3.5" />}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-medium text-[#1A1A1A] truncate">
                            {sa.name}
                          </p>
                          {isAdmin ? (
                            <Badge variant="teal">Admin</Badge>
                          ) : (
                            <Badge variant="outline">Student</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-[#666666] mt-0.5">
                          <span className="font-mono-ledger">{truncateAddress(sa.address, 4)}</span>
                          {sa.status && <span>· {sa.status}</span>}
                        </div>
                      </div>
                    </div>

                    <div className="flex-shrink-0">
                      {isCurrent ? (
                        <span className="text-xs text-[#0F766E] font-medium flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-[#0F766E]" />
                          Connected
                        </span>
                      ) : (
                        <span className="text-xs text-[#0F766E] opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 font-medium">
                          Select <ArrowRight className="w-3.5 h-3.5" />
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="pt-3 border-t border-[#E5E5E5] flex items-center justify-between text-[11px] text-[#666666]">
          <span>Federal University Lokoja Library Ledger</span>
          <button
            type="button"
            onClick={closeConnectModal}
            className="hover:text-[#1A1A1A] cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  );
};
