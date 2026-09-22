import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { useWeb3 } from "../context/Web3Context";
import {
  ArrowRight,
  ShieldAlert,
  BookCheck,
  Scale,
  Award,
} from "lucide-react";

export const LandingPage: React.FC = () => {
  const { account, openConnectModal, isCorrectNetwork, switchToLocalNetwork } = useWeb3();
  const navigate = useNavigate();

  return (
    <div className="space-y-20 sm:space-y-28 py-6 sm:py-12">
      {/* 1. Hero Section: Clean Editorial Academic Composition */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
        {/* Left Column: Heading, Academic Statement & Actions */}
        <div className="lg:col-span-7 space-y-6">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-widest text-[#666666] font-medium">
              University Library Digital Archive
            </p>
            <h1 className="font-serif-academic text-3xl sm:text-5xl lg:text-[3.25rem] font-medium tracking-tight text-[#1A1A1A] leading-[1.12]">
              Every book, permanently on record.
            </h1>
          </div>

          <p className="text-sm sm:text-base text-[#666666] max-w-xl leading-relaxed">
            The Federal University Lokoja Central Library operates a verified digital circulation ledger. Borrowing transactions, custody transfers, and holding records are maintained through tamper-evident distributed ledger infrastructure to ensure accountable access across all academic collections.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            {account ? (
              <Button
                variant="primary"
                size="md"
                onClick={() => navigate("/catalogue")}
                rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
              >
                Browse Catalogue
              </Button>
            ) : (
              <Button
                variant="primary"
                size="md"
                onClick={openConnectModal}
                rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
              >
                Connect Wallet
              </Button>
            )}

            <Button
              variant="secondary"
              size="md"
              onClick={() => {
                const el = document.getElementById("how-it-works");
                el?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              How it works
            </Button>
          </div>

          {/* Network alert banner if not on port 8545 / 31337 */}
          {!isCorrectNetwork && (
            <div className="p-3 rounded-[4px] bg-[#FFF7ED] border border-[#FED7AA] text-xs text-[#EA580C] flex items-center justify-between">
              <span>Your wallet is connected to an external chain. Switch to local Hardhat node?</span>
              <button
                type="button"
                onClick={switchToLocalNetwork}
                className="font-medium underline ml-2 hover:opacity-80 cursor-pointer"
              >
                Switch Network
              </button>
            </div>
          )}

          {/* Clean Typography-Based Statistics (No Pill Containers, No Boxed Cards) */}
          <div className="pt-8 border-t border-[#E5E5E5]">
            <div className="grid grid-cols-3 gap-6 sm:gap-8">
              <div>
                <p className="font-serif-academic text-2xl sm:text-3xl font-medium text-[#1A1A1A] tracking-tight">
                  30+
                </p>
                <p className="text-[11px] sm:text-xs text-[#666666] mt-1 font-normal uppercase tracking-wider">
                  Volumes Catalogued
                </p>
              </div>
              <div>
                <p className="font-serif-academic text-2xl sm:text-3xl font-medium text-[#1A1A1A] tracking-tight">
                  14 Days
                </p>
                <p className="text-[11px] sm:text-xs text-[#666666] mt-1 font-normal uppercase tracking-wider">
                  Standard Loan Window
                </p>
              </div>
              <div>
                <p className="font-serif-academic text-2xl sm:text-3xl font-medium text-[#1A1A1A] tracking-tight">
                  100%
                </p>
                <p className="text-[11px] sm:text-xs text-[#666666] mt-1 font-normal uppercase tracking-wider">
                  Verifiable On-Chain
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Editorial Library Photograph with Academic Caption */}
        <div className="lg:col-span-5">
          <figure className="space-y-2.5">
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[4px] border border-[#E5E5E5] bg-[#FAFAFA]">
              <img
                src="/src/assets/images/university_library_reading_room_1789861136286.jpg"
                alt="Federal University Lokoja Central Library Reading Room"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover grayscale-[15%] contrast-[1.02]"
              />
            </div>
            <figcaption className="flex items-baseline justify-between text-xs text-[#666666] pt-1">
              <span className="font-medium text-[#1A1A1A]">
                Federal University Lokoja Central Library
              </span>
              <span className="text-[11px]">
                Main Campus, Lokoja, Kogi State
              </span>
            </figcaption>
          </figure>
        </div>
      </section>

      {/* 2. How the Ledger Works: Clean Academic Numbered Process */}
      <section id="how-it-works" className="space-y-10 scroll-mt-24 pt-8 border-t border-[#E5E5E5]">
        <div className="max-w-2xl space-y-2">
          <p className="text-xs uppercase tracking-widest text-[#666666] font-medium">
            Circulation Protocol
          </p>
          <h2 className="font-serif-academic text-2xl sm:text-3xl font-medium text-[#1A1A1A] tracking-tight">
            How the Ledger Works
          </h2>
          <p className="text-sm text-[#666666] leading-relaxed">
            The library circulation process connects physical library desk operations with immutable blockchain state verification.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-10 pt-4">
          {/* Step 1 */}
          <div className="space-y-3 border-t border-[#E5E5E5] pt-5">
            <span className="font-mono-ledger text-xs font-semibold text-[#0F766E] tracking-wider">
              01 / ACCREDITATION
            </span>
            <h3 className="font-serif-academic text-lg font-medium text-[#1A1A1A]">
              Member Registration
            </h3>
            <p className="text-xs sm:text-sm text-[#666666] leading-relaxed">
              Students and academic staff register their university matric credentials. The Chief Librarian verifies identity details and authorizes the member account on the smart contract.
            </p>
          </div>

          {/* Step 2 */}
          <div className="space-y-3 border-t border-[#E5E5E5] pt-5">
            <span className="font-mono-ledger text-xs font-semibold text-[#0F766E] tracking-wider">
              02 / DISPATCH
            </span>
            <h3 className="font-serif-academic text-lg font-medium text-[#1A1A1A]">
              Digital Checkout
            </h3>
            <p className="text-xs sm:text-sm text-[#666666] leading-relaxed">
              Members authenticate with their connected wallet to check out available volumes. The ledger enforces a 14-day borrowing window and caps active loans at three volumes per borrower.
            </p>
          </div>

          {/* Step 3 */}
          <div className="space-y-3 border-t border-[#E5E5E5] pt-5">
            <span className="font-mono-ledger text-xs font-semibold text-[#0F766E] tracking-wider">
              03 / RECONCILIATION
            </span>
            <h3 className="font-serif-academic text-lg font-medium text-[#1A1A1A]">
              Return & Verification Proof
            </h3>
            <p className="text-xs sm:text-sm text-[#666666] leading-relaxed">
              Upon physical return to the desk, the ledger logs an immutable return receipt. Any overdue duration is calculated deterministically on-chain, preserving an unalterable audit trail.
            </p>
          </div>
        </div>
      </section>

      {/* 3. Why Blockchain for University Circulation: Restrained 3-Column Institutional Benefits */}
      <section className="space-y-10 pt-8 border-t border-[#E5E5E5]">
        <div className="max-w-2xl space-y-2">
          <p className="text-xs uppercase tracking-widest text-[#666666] font-medium">
            Institutional Rationale
          </p>
          <h2 className="font-serif-academic text-2xl sm:text-3xl font-medium text-[#1A1A1A] tracking-tight">
            Why Distributed Infrastructure for University Circulation?
          </h2>
          <p className="text-sm text-[#666666] leading-relaxed">
            Replacing paper logbooks and fragile centralized databases with cryptographically verified institutional records.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-10">
          <div className="space-y-3">
            <div className="w-8 h-8 rounded-[4px] bg-[#FAFAFA] border border-[#E5E5E5] flex items-center justify-center text-[#0F766E]">
              <BookCheck className="w-4 h-4" />
            </div>
            <h3 className="font-serif-academic text-base sm:text-lg font-medium text-[#1A1A1A]">
              Permanent Auditability
            </h3>
            <p className="text-xs sm:text-sm text-[#666666] leading-relaxed">
              Neither students nor library desk staff can erase past borrow entries, backdate returns, or alter holding histories. Every transaction is permanently timestamped in block headers.
            </p>
          </div>

          <div className="space-y-3">
            <div className="w-8 h-8 rounded-[4px] bg-[#FAFAFA] border border-[#E5E5E5] flex items-center justify-center text-[#0F766E]">
              <Scale className="w-4 h-4" />
            </div>
            <h3 className="font-serif-academic text-base sm:text-lg font-medium text-[#1A1A1A]">
              Objective Policy Enforcement
            </h3>
            <p className="text-xs sm:text-sm text-[#666666] leading-relaxed">
              Circulation parameters—such as the 14-day borrowing threshold and fine schedule—are executed programmatically by smart contract code, eliminating administrative bias and record loss.
            </p>
          </div>

          <div className="space-y-3">
            <div className="w-8 h-8 rounded-[4px] bg-[#FAFAFA] border border-[#E5E5E5] flex items-center justify-center text-[#0F766E]">
              <Award className="w-4 h-4" />
            </div>
            <h3 className="font-serif-academic text-base sm:text-lg font-medium text-[#1A1A1A]">
              Verifiable Academic Clearance
            </h3>
            <p className="text-xs sm:text-sm text-[#666666] leading-relaxed">
              Prior to graduation or departmental clearance, students can present immutable on-chain proof of zero outstanding library liabilities without manual cross-referencing across departments.
            </p>
          </div>
        </div>
      </section>

      {/* 4. Academic Demonstration Environment: Clean Minimalist Callout */}
      <section className="p-6 sm:p-8 rounded-[4px] bg-[#FAFAFA] border border-[#E5E5E5] flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xs">
        <div className="space-y-1.5 max-w-xl">
          <p className="text-[11px] font-mono-ledger uppercase text-[#0F766E] font-medium tracking-wider">
            Evaluation Environment
          </p>
          <h3 className="font-serif-academic text-xl font-medium text-[#1A1A1A]">
            Pre-Configured University Signers
          </h3>
          <p className="text-xs sm:text-sm text-[#666666] leading-relaxed">
            The ledger includes pre-funded accounts for system evaluation. Use the identity selector in the top navigation bar to switch between the Chief Librarian, registered students, or prospective applicants.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Link to="/catalogue" className="w-full sm:w-auto">
            <Button variant="secondary" size="md" className="w-full sm:w-auto">
              View Catalogue
            </Button>
          </Link>
          <Link to="/admin" className="w-full sm:w-auto">
            <Button variant="primary" size="md" className="w-full sm:w-auto">
              Admin Console
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
};
