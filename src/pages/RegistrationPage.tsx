import React, { useState } from "react";
import { useWeb3 } from "../context/Web3Context";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { HashChip } from "../components/ui/HashChip";
import {
  UserCheck,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  Lock,
  Wallet,
  AlertCircle,
} from "lucide-react";

export const RegistrationPage: React.FC = () => {
  const { account, openConnectModal, role, memberData } = useWeb3();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [name, setName] = useState("");
  const [matricNumber, setMatricNumber] = useState("");
  const [faculty, setFaculty] = useState("Faculty of Science (Computer Science)");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedStatus, setSubmittedStatus] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const faculties = [
    "Faculty of Science (Computer Science)",
    "Faculty of Science (Physics)",
    "Faculty of Science (Mathematics)",
    "Faculty of Arts & Humanities (History)",
    "Faculty of Arts & Humanities (English)",
    "Faculty of Social Sciences (Economics)",
    "College of Health Sciences (Medicine)",
    "Faculty of Education",
  ];

  const handleSubmitRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!account) {
      setErrorMsg("Please connect your wallet first.");
      return;
    }
    if (!name.trim() || !matricNumber.trim()) {
      setErrorMsg("Please complete all required fields.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/identity/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wallet_address: account,
          matric_number: matricNumber.trim(),
          name: name.trim(),
          faculty,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSubmittedStatus(data);
        setStep(3);
      } else {
        setErrorMsg(data.error || "Registration submission failed.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Network error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // If user is already registered on-chain
  if (role === "member" && memberData?.isRegistered) {
    return (
      <div className="max-w-xl mx-auto py-12 text-center space-y-6">
        <div className="w-12 h-12 rounded-[4px] bg-[#0F766E]/10 border border-[#0F766E]/30 flex items-center justify-center mx-auto text-[#0F766E]">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <div>
          <h2 className="font-serif-academic text-2xl font-medium text-[#1A1A1A]">
            Wallet Already Registered
          </h2>
          <p className="text-xs sm:text-sm text-[#666666] mt-1.5 max-w-md mx-auto">
            Your connected wallet ({account}) is an active, verified member of the Federal University Lokoja Library Ledger.
          </p>
        </div>

        <div className="p-4 rounded-[4px] bg-[#FAFAFA] border border-[#E5E5E5] text-xs space-y-2 max-w-sm mx-auto shadow-xs">
          <div className="flex justify-between">
            <span className="text-[#666666]">Member Name:</span>
            <span className="font-medium text-[#1A1A1A]">{memberData.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#666666]">Current Loans:</span>
            <span className="font-mono-ledger font-medium">{memberData.currentBorrows} / {memberData.maxBorrows}</span>
          </div>
        </div>

        <Button variant="primary" size="md" onClick={() => (window.location.href = "/catalogue")}>
          Go to Catalogue
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <p className="text-xs uppercase tracking-widest text-[#666666] font-medium">
          Circulation Privileges
        </p>
        <h1 className="font-serif-academic text-3xl sm:text-4xl font-medium text-[#1A1A1A]">
          Member Registration
        </h1>
        <p className="text-xs sm:text-sm text-[#666666] max-w-md mx-auto">
          Submit your university details for off-chain administrative verification. Once approved, your wallet is enabled for smart contract borrowing.
        </p>
      </div>

      {/* Stepper Header */}
      <div className="flex items-center justify-between px-4 pb-4 border-b border-[#E5E5E5]">
        <div className={`flex items-center gap-2 text-xs ${step >= 1 ? "text-[#0F766E] font-medium" : "text-[#666666]"}`}>
          <span className="w-5 h-5 rounded-[2px] border border-current flex items-center justify-center font-mono-ledger text-[10px]">1</span>
          <span>Academic Details</span>
        </div>
        <div className="h-[1px] w-8 bg-[#E5E5E5]" />
        <div className={`flex items-center gap-2 text-xs ${step >= 2 ? "text-[#0F766E] font-medium" : "text-[#666666]"}`}>
          <span className="w-5 h-5 rounded-[2px] border border-current flex items-center justify-center font-mono-ledger text-[10px]">2</span>
          <span>Wallet Binding</span>
        </div>
        <div className="h-[1px] w-8 bg-[#E5E5E5]" />
        <div className={`flex items-center gap-2 text-xs ${step >= 3 ? "text-[#0F766E] font-medium" : "text-[#666666]"}`}>
          <span className="w-5 h-5 rounded-[2px] border border-current flex items-center justify-center font-mono-ledger text-[10px]">3</span>
          <span>Status</span>
        </div>
      </div>

      {/* Step 1: Academic Form */}
      {step === 1 && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!name.trim() || !matricNumber.trim()) {
              setErrorMsg("Please fill in both full name and matric number.");
              return;
            }
            setErrorMsg(null);
            setStep(2);
          }}
          className="space-y-5 rounded-[4px] bg-[#FFFFFF] border border-[#E5E5E5] p-6 shadow-xs"
        >
          {errorMsg && (
            <div className="p-3 rounded-[4px] bg-[#DC2626]/10 text-xs text-[#DC2626] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-[#1A1A1A]">
              Full Student Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Amina Bello"
              className="w-full px-3 py-2 rounded-[4px] bg-[#FAFAFA] border border-[#E5E5E5] text-xs sm:text-sm text-[#1A1A1A] focus:outline-none focus:border-[#1A1A1A] focus:bg-[#FFFFFF]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-[#1A1A1A]">
              Matriculation Number
            </label>
            <input
              type="text"
              required
              value={matricNumber}
              onChange={(e) => setMatricNumber(e.target.value)}
              placeholder="e.g. FUL/2022/CMP/042"
              className="w-full px-3 py-2 rounded-[4px] bg-[#FAFAFA] border border-[#E5E5E5] text-xs sm:text-sm text-[#1A1A1A] focus:outline-none focus:border-[#1A1A1A] focus:bg-[#FFFFFF] font-mono-ledger"
            />
            <p className="text-[11px] text-[#666666]">
              Hashed with SHA-256 + cryptographic salt before storage.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-[#1A1A1A]">
              Faculty / Department
            </label>
            <select
              value={faculty}
              onChange={(e) => setFaculty(e.target.value)}
              className="w-full px-3 py-2 rounded-[4px] bg-[#FAFAFA] border border-[#E5E5E5] text-xs sm:text-sm text-[#1A1A1A] focus:outline-none focus:border-[#1A1A1A] focus:bg-[#FFFFFF]"
            >
              {faculties.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>

          {/* Privacy Note */}
          <div className="p-3 rounded-[4px] bg-[#FAFAFA] border border-[#E5E5E5] text-xs text-[#666666] flex items-start gap-2.5">
            <Lock className="w-4 h-4 text-[#0F766E] flex-shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Off-chain Zero Knowledge Guarantee:</strong> Raw matriculation credentials are never broadcast to the public blockchain or saved in plain text.
            </p>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              variant="primary"
              size="md"
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Continue to Wallet Binding
            </Button>
          </div>
        </form>
      )}

      {/* Step 2: Wallet Binding */}
      {step === 2 && (
        <div className="space-y-6 rounded-[4px] bg-[#FFFFFF] border border-[#E5E5E5] p-6 shadow-xs">
          <div className="space-y-1">
            <h3 className="font-serif-academic text-lg font-medium text-[#1A1A1A]">
              Bind Ethereum Wallet
            </h3>
            <p className="text-xs text-[#666666]">
              This address will hold your library credentials and sign borrow transactions on the smart contract.
            </p>
          </div>

          {account ? (
            <div className="p-3.5 rounded-[4px] bg-[#FAFAFA] border border-[#E5E5E5] space-y-2">
              <span className="text-[11px] text-[#666666] uppercase tracking-wider block">
                Connected Signing Address
              </span>
              <div className="flex items-center justify-between">
                <HashChip value={account} type="address" digits={6} />
                <Badge variant="teal" dot>
                  Ready to bind
                </Badge>
              </div>
            </div>
          ) : (
            <div className="p-3.5 rounded-[4px] bg-[#FFF7ED] border border-[#FED7AA] text-xs space-y-3">
              <p className="text-[#EA580C]">
                No wallet is connected. Connect MetaMask or select an applicant test account.
              </p>
              <Button
                variant="primary"
                size="sm"
                onClick={openConnectModal}
                leftIcon={<Wallet className="w-3.5 h-3.5" />}
              >
                Connect Wallet
              </Button>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 rounded-[4px] bg-[#DC2626]/10 text-xs text-[#DC2626]">
              {errorMsg}
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-[#E5E5E5]">
            <Button variant="secondary" size="md" onClick={() => setStep(1)}>
              Back
            </Button>
            <Button
              variant="primary"
              size="md"
              disabled={!account}
              isLoading={isSubmitting}
              onClick={handleSubmitRegistration}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Submit for Admin Review
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Pending / Submitted Screen */}
      {step === 3 && (
        <div className="rounded-[4px] bg-[#FFFFFF] border border-[#E5E5E5] p-8 text-center space-y-5 shadow-xs">
          <div className="w-12 h-12 rounded-[4px] bg-[#0F766E]/10 border border-[#0F766E]/30 flex items-center justify-center mx-auto text-[#0F766E]">
            <CheckCircle2 className="w-6 h-6" />
          </div>

          <div className="space-y-1">
            <h3 className="font-serif-academic text-2xl font-medium text-[#1A1A1A]">
              Registration Submitted
            </h3>
            <p className="text-xs sm:text-sm text-[#666666] max-w-sm mx-auto">
              Your application has been logged off-chain with status <strong>&quot;Pending Admin Approval&quot;</strong>.
            </p>
          </div>

          <div className="p-3.5 rounded-[4px] bg-[#FAFAFA] border border-[#E5E5E5] text-xs text-left space-y-2 max-w-sm mx-auto shadow-xs">
            <div className="flex justify-between">
              <span className="text-[#666666]">Applicant:</span>
              <span className="font-medium text-[#1A1A1A]">{name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#666666]">Faculty:</span>
              <span className="font-medium text-[#1A1A1A] truncate max-w-[180px]">{faculty}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#666666]">Matric Hash:</span>
              <HashChip
                value={submittedStatus?.matric_hash || "334c48f4e922..."}
                type="hash"
                digits={4}
              />
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#666666]">Approval Status:</span>
              <Badge variant="orange" dot>
                Pending Admin
              </Badge>
            </div>
          </div>

          <div className="pt-3 flex flex-wrap items-center justify-center gap-3">
            <Button
              variant="secondary"
              size="md"
              onClick={() => (window.location.href = "/catalogue")}
            >
              Browse Catalogue (View-only)
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={() => (window.location.href = "/admin")}
            >
              Open Admin Console to Approve
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
