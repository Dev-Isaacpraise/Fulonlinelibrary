import React from "react";
import { Modal } from "./Modal";
import { useWeb3 } from "../../context/Web3Context";
import { Badge } from "./Badge";
import { Button } from "./Button";
import { HashChip } from "./HashChip";
import { truncateAddress } from "../../utils/bookCovers";
import {
  Wallet,
  Shield,
  ExternalLink,
  UserCheck,
  BookOpen,
  Lock,
  ArrowRight,
  Info,
} from "lucide-react";

export const ConnectWalletModal: React.FC = () => {
  const {
    isConnectModalOpen,
    closeConnectModal,
    isMetaMaskAvailable,
    connectMetaMask,
    isConnecting,
    config,
    switchAccount,
    account,
  } = useWeb3();

  const handleSelectAccount = async (address: string, privateKey?: string) => {
    await switchAccount(address, privateKey);
    closeConnectModal();
  };

  return (
    <Modal
      isOpen={isConnectModalOpen}
      onClose={closeConnectModal}
      title="Connect to Library Ledger"
      subtitle="Federal University Lokoja · On-Chain Circulation"
      maxWidth="max-w-lg"
    >
      <div className="space-y-6">
        {/* Info Banner */}
        <div className="p-3 rounded-[4px] bg-[#FAFAFA] border border-[#E5E5E5] flex items-start gap-3">
          <Info className="w-4 h-4 text-[#0F766E] flex-shrink-0 mt-0.5" />
          <p className="text-xs text-[#666666] leading-relaxed">
            Auto-login is disabled. Choose a verified university test profile or connect your browser wallet to check out books, view circulation records, or access library controls.
          </p>
        </div>

        {/* Option 1: Browser Web3 Wallet */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#666666]">
              Browser Web3 Wallet
            </span>
            {isMetaMaskAvailable ? (
              <span className="text-[11px] text-[#0F766E] font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0F766E]" />
                MetaMask Detected
              </span>
            ) : (
              <span className="text-[11px] text-[#666666]">
                Not Detected
              </span>
            )}
          </div>

          <div className="p-3.5 rounded-[4px] bg-[#FFFFFF] border border-[#E5E5E5] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-[4px] bg-[#EA580C]/10 border border-[#EA580C]/30 flex items-center justify-center text-[#EA580C]">
                <Wallet className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-medium text-[#1A1A1A]">
                  MetaMask Extension
                </p>
                <p className="text-[11px] text-[#666666]">
                  Connect with your browser Ethereum wallet
                </p>
              </div>
            </div>

            {isMetaMaskAvailable ? (
              <Button
                variant="primary"
                size="sm"
                onClick={connectMetaMask}
                isLoading={isConnecting}
                leftIcon={<Wallet className="w-3.5 h-3.5" />}
              >
                Connect MetaMask
              </Button>
            ) : (
              <span className="text-[11px] font-medium text-[#666666] bg-[#FAFAFA] px-2.5 py-1 rounded-[3px] border border-[#E5E5E5]">
                Extension not found
              </span>
            )}
          </div>
        </div>

        {/* Option 2: Pre-Configured University Accounts */}
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
            Select an official test profile to test borrowing, book circulation, and administrator verification:
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

        {/* Footer Note */}
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
