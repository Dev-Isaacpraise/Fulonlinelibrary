import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { BookOpen, Menu, X, ChevronDown, Wallet, ShieldAlert, Sparkles, ExternalLink } from "lucide-react";
import { useWeb3 } from "../../context/Web3Context";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { truncateAddress } from "../../utils/bookCovers";

export const Navbar: React.FC = () => {
  const location = useLocation();
  const {
    account,
    role,
    memberData,
    config,
    connectMetaMask,
    switchAccount,
    disconnect,
    isMetaMaskAvailable,
    isCorrectNetwork,
    isDemoMode,
    switchToLocalNetwork,
    openConnectModal,
  } = useWeb3();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [accountDropdownOpen, setAccountDropdownOpen] = useState(false);

  const navLinks = [
    { label: "Overview", path: "/" },
    { label: "Catalogue", path: "/catalogue" },
    { label: "Dashboard", path: "/dashboard" },
    { label: "Ledger History", path: "/history" },
    { label: "Register", path: "/register" },
    { label: "Admin Console", path: "/admin" },
  ];

  const handleSwitch = async (addr: string, pk?: string) => {
    await switchAccount(addr, pk);
    setAccountDropdownOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-[#FFFFFF] border-b border-[#E5E5E5] transition-colors">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Left: Academic Institutional Wordmark */}
        <Link
          to="/"
          className="flex items-center gap-3 text-[#1A1A1A] hover:opacity-90 transition-opacity flex-shrink-0"
        >
          <div className="w-8 h-8 rounded-[4px] bg-[#FAFAFA] border border-[#E5E5E5] flex items-center justify-center text-[#0F766E]">
            <BookOpen className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-[#666666] uppercase tracking-wider font-medium leading-none">
              Federal University Lokoja
            </span>
            <span className="font-serif-academic text-base sm:text-lg font-medium tracking-tight text-[#1A1A1A] mt-0.5">
              University Library Ledger
            </span>
          </div>
        </Link>

        {/* Center: Desktop Nav Links (Proper University Navigation) */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-2">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`px-2.5 py-1.5 rounded-[3px] text-xs transition-colors ${
                  isActive
                    ? "text-[#1A1A1A] font-semibold bg-[#FAFAFA] border border-[#E5E5E5]"
                    : "text-[#666666] hover:text-[#1A1A1A] hover:bg-[#FAFAFA]"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Right: Actions & Identity */}
        <div className="flex items-center gap-2 sm:gap-3">
          {isDemoMode && (
            <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-[#E5E5E5] bg-[#FAFAFA] px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.12em] text-[#666666]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#0F766E]" />
              Demo Mode
            </span>
          )}

          {/* Wrong network alert banner button */}
          {!isCorrectNetwork && (
            <Button
              variant="danger"
              size="sm"
              onClick={switchToLocalNetwork}
              leftIcon={<ShieldAlert className="w-3.5 h-3.5" />}
              className="hidden lg:inline-flex text-xs"
            >
              Switch to 31337
            </Button>
          )}

          {/* Account Dropdown / Connect Chip */}
          {account ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setAccountDropdownOpen(!accountDropdownOpen)}
                className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-[4px] bg-[#FAFAFA] border border-[#E5E5E5] hover:border-[#1A1A1A] transition-colors text-xs text-[#1A1A1A] cursor-pointer"
              >
                <span className="w-2 h-2 rounded-full bg-[#0F766E]" />
                <span className="font-mono-ledger font-medium">{truncateAddress(account, 4)}</span>
                {role === "admin" && (
                  <span className="text-[10px] text-[#0F766E] font-medium hidden sm:inline">
                    · Admin
                  </span>
                )}
                <ChevronDown className="w-3 h-3 text-[#666666]" />
              </button>

              {/* Dropdown Menu */}
              {accountDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setAccountDropdownOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-72 rounded-[4px] bg-[#FFFFFF] border border-[#E5E5E5] shadow-lg p-3 z-50 text-xs">
                    <div className="px-2 py-1.5 border-b border-[#E5E5E5] mb-2">
                      <p className="font-medium text-[#1A1A1A]">
                        {memberData?.name || "Connected Identity"}
                      </p>
                      <p className="font-mono-ledger text-[10px] text-[#666666] mt-0.5 break-all">
                        {account}
                      </p>
                    </div>

                    <p className="px-2 py-1 text-[10px] font-semibold text-[#666666] uppercase tracking-wider">
                      University Test Profiles
                    </p>

                    <div className="space-y-1 max-h-52 overflow-y-auto">
                      {config?.sampleAccounts?.map((sa) => {
                        const isSelected = sa.address.toLowerCase() === account.toLowerCase();
                        return (
                          <button
                            key={sa.address}
                            type="button"
                            onClick={() => handleSwitch(sa.address, sa.privateKey)}
                            className={`w-full text-left px-2.5 py-2 rounded-[3px] transition-colors flex items-center justify-between cursor-pointer ${
                              isSelected
                                ? "bg-[#0F766E]/10 text-[#0F766E] font-medium border border-[#0F766E]/30"
                                : "hover:bg-[#FAFAFA] text-[#1A1A1A]"
                            }`}
                          >
                            <div className="truncate pr-2">
                              <p className="text-xs truncate font-medium">{sa.name}</p>
                              <p className="text-[10px] text-[#666666] font-mono-ledger">
                                {truncateAddress(sa.address, 4)} · {sa.role}
                              </p>
                            </div>
                            {isSelected && (
                              <span className="w-1.5 h-1.5 rounded-full bg-[#0F766E]" />
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {isMetaMaskAvailable && (
                      <div className="mt-2 pt-2 border-t border-[#E5E5E5]">
                        <button
                          type="button"
                          onClick={connectMetaMask}
                          className="w-full text-left px-2.5 py-1.5 rounded-[3px] text-xs text-[#0F766E] hover:bg-[#0F766E]/10 flex items-center justify-between cursor-pointer"
                        >
                          <span>Connect Browser MetaMask</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      </div>
                    )}

                    <div className="mt-2 pt-2 border-t border-[#E5E5E5]">
                      <button
                        type="button"
                        onClick={disconnect}
                        className="w-full text-left px-2.5 py-1.5 rounded-[3px] text-xs text-[#DC2626] hover:bg-[#DC2626]/10 cursor-pointer"
                      >
                        Disconnect Session
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <Button
              variant="primary"
              size="sm"
              onClick={openConnectModal}
              leftIcon={<Wallet className="w-3.5 h-3.5" />}
            >
              Connect Wallet
            </Button>
          )}

          {/* Mobile menu trigger */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
            className="md:hidden p-1.5 rounded-[4px] text-[#666666] hover:text-[#1A1A1A] hover:bg-[#FAFAFA] border border-[#E5E5E5] cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#E5E5E5] bg-[#FFFFFF] px-4 py-3 space-y-1">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2 rounded-[3px] text-xs font-medium transition-colors ${
                  isActive
                    ? "text-[#1A1A1A] bg-[#FAFAFA] font-semibold border-l-2 border-[#0F766E]"
                    : "text-[#666666] hover:text-[#1A1A1A]"
                }`}
              >
                {link.label}
              </Link>
            );
          })}

          {!account && (
            <div className="pt-2 border-t border-[#E5E5E5]">
              <Button
                variant="primary"
                size="sm"
                className="w-full"
                onClick={() => {
                  setMobileMenuOpen(false);
                  openConnectModal();
                }}
                leftIcon={<Wallet className="w-3.5 h-3.5" />}
              >
                Connect Wallet
              </Button>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
