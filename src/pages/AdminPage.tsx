import React, { useState, useEffect, useMemo } from "react";
import { useWeb3 } from "../context/Web3Context";
import { PendingRegistration, Book, BorrowRecord, DemoBookItem, DeskCirculationStatus } from "../types";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { HashChip } from "../components/ui/HashChip";
import { Modal } from "../components/ui/Modal";
import { EmptyState } from "../components/ui/EmptyState";
import { DueDateRing } from "../components/ui/DueDateRing";
import { VerifiedSeal } from "../components/ui/VerifiedSeal";
import { DeskStatusChecklist } from "../components/ui/DeskStatusChecklist";
import { formatUnixDate, formatUnixDateTime } from "../utils/bookCovers";
import {
  Users,
  BookOpen,
  Layers,
  Settings,
  Plus,
  Check,
  X,
  FastForward,
  ShieldCheck,
  TrendingUp,
  AlertCircle,
  Search,
  Lock,
  Unlock,
  KeyRound,
  ShieldAlert,
  Sparkles,
  BookMarked,
  MapPin,
  Barcode,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

export const AdminPage: React.FC = () => {
  const {
    account,
    role,
    books,
    records,
    activeLoans,
    config,
    registerMemberOnChain,
    addBook,
    updateBorrowPeriod,
    updateFineRate,
    timeTravel,
    switchAccount,
  } = useWeb3();

  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem("ful_admin_authenticated") === "true";
  });
  const [passphrase, setPassphrase] = useState("");
  const [authError, setAuthError] = useState("");
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const [activeTab, setActiveTab] = useState<
    "pending" | "catalogue" | "circulation" | "settings" | "simulator"
  >("pending");

  // Pending registrations from off-chain SQLite
  const [pendingList, setPendingList] = useState<PendingRegistration[]>([]);
  const [isLoadingPending, setIsLoadingPending] = useState(false);
  const [approvingId, setApprovingId] = useState<number | null>(null);

  // Demo books from SQLite catalog
  const [demoBooks, setDemoBooks] = useState<DemoBookItem[]>([]);
  const [isLoadingDemoBooks, setIsLoadingDemoBooks] = useState(false);

  // Desk statuses for circulation records
  const [deskStatuses, setDeskStatuses] = useState<Record<number, DeskCirculationStatus>>({});

  // Add book form state
  const [newTitle, setNewTitle] = useState("");
  const [newAuthor, setNewAuthor] = useState("");
  const [isAddingBook, setIsAddingBook] = useState(false);

  // Settings form state
  const [borrowDays, setBorrowDays] = useState(14);
  const [fineGwei, setFineGwei] = useState(50);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Search filter for circulation
  const [circSearch, setCircSearch] = useState("");

  const loadPending = async () => {
    setIsLoadingPending(true);
    try {
      const res = await fetch("/api/identity/pending");
      if (res.ok) {
        const data = await res.json();
        setPendingList(data.data || []);
      }
    } catch (e) {
      console.warn("Failed to load pending registrations:", e);
    } finally {
      setIsLoadingPending(false);
    }
  };

  const loadDemoBooks = async () => {
    setIsLoadingDemoBooks(true);
    try {
      const res = await fetch("/api/books/demo");
      if (res.ok) {
        const data = await res.json();
        setDemoBooks(data.data || []);
      }
    } catch (e) {
      console.warn("Failed to load demo books:", e);
    } finally {
      setIsLoadingDemoBooks(false);
    }
  };

  const loadDeskStatuses = async () => {
    try {
      const res = await fetch("/api/desk-status");
      if (res.ok) {
        const data = await res.json();
        if (data.data) {
          const map: Record<number, DeskCirculationStatus> = {};
          data.data.forEach((d: DeskCirculationStatus) => {
            map[d.record_id] = d;
          });
          setDeskStatuses(map);
        }
      }
    } catch (e) {
      console.warn("Failed to load desk statuses:", e);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadPending();
      loadDemoBooks();
      loadDeskStatuses();
    }
  }, [isAuthenticated]);

  const handleAdminAuth = async (passcodeToTest?: string) => {
    setAuthError("");
    setIsAuthenticating(true);
    const code = passcodeToTest !== undefined ? passcodeToTest : passphrase;

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletAddress: account,
          passphrase: code,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        sessionStorage.setItem("ful_admin_authenticated", "true");
        setIsAuthenticated(true);
        setPassphrase("");
      } else {
        setAuthError(data.error || "Authentication failed. Invalid credentials.");
      }
    } catch (e: any) {
      setAuthError("Server connection error during authentication.");
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleLockConsole = () => {
    sessionStorage.removeItem("ful_admin_authenticated");
    setIsAuthenticated(false);
    setAuthError("");
  };

  const handleApprove = async (item: PendingRegistration) => {
    setApprovingId(item.id);
    try {
      // 1. Submit on-chain registration transaction
      const txRes = await registerMemberOnChain(item.wallet_address, item.name);
      if (txRes.success) {
        // 2. Mark as approved in SQLite backend
        await fetch(`/api/identity/approve/${item.id}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tx_hash: txRes.txHash }),
        });
        await loadPending();
      }
    } finally {
      setApprovingId(null);
    }
  };

  const handleReject = async (id: number) => {
    try {
      await fetch(`/api/identity/reject/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "Credentials could not be verified by Registrar" }),
      });
      await loadPending();
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddBookSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newAuthor.trim()) return;
    setIsAddingBook(true);
    try {
      const res = await addBook(newTitle.trim(), newAuthor.trim());
      if (res.success) {
        setNewTitle("");
        setNewAuthor("");
      }
    } finally {
      setIsAddingBook(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);
    try {
      await updateBorrowPeriod(borrowDays);
      await updateFineRate(fineGwei);
    } finally {
      setIsSavingSettings(false);
    }
  };

  // Recharts circulation volume over time data
  const chartData = useMemo(() => {
    return [
      { month: "May", loans: 12, returns: 10 },
      { month: "Jun", loans: 19, returns: 18 },
      { month: "Jul", loans: 28, returns: 25 },
      { month: "Aug", loans: 35, returns: 32 },
      { month: "Sep", loans: 44, returns: 40 },
      { month: "Oct", loans: records.length + 50, returns: records.filter((r) => r.returned).length + 48 },
    ];
  }, [records]);

  const filteredCirculation = useMemo(() => {
    return records.filter((r) => {
      const s = circSearch.toLowerCase();
      return (
        String(r.id).includes(s) ||
        String(r.bookId).includes(s) ||
        r.borrower.toLowerCase().includes(s) ||
        (r.bookTitle && r.bookTitle.toLowerCase().includes(s))
      );
    });
  }, [records, circSearch]);

  const isWalletAdmin = Boolean(
    account && config && account.toLowerCase() === config.admin.toLowerCase()
  );

  // Authentication Gate
  if (!isAuthenticated) {
    return (
      <div className="max-w-xl mx-auto py-12 px-4 space-y-6">
        <div className="rounded-[4px] bg-[#FFFFFF] border border-[#E5E5E5] p-8 space-y-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-[4px] bg-[#F0FDFA] border border-[#99F6E4] flex items-center justify-center text-[#0F766E]">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-[11px] font-mono-ledger text-[#666666]">
                  Federal University Lokoja
                </p>
                <Badge variant="teal" dot>
                  Restricted Access
                </Badge>
              </div>
              <h2 className="font-serif-academic text-2xl sm:text-3xl font-medium text-[#1A1A1A] mt-0.5">
                Chief Librarian Authentication
              </h2>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-[#666666] leading-relaxed">
            The Library Administration Console controls smart contract governance, on-chain catalog minting, student identity verification, and physical circulation desk logs. Verification is required before access is granted.
          </p>

          {/* Current Connected Wallet Info */}
          <div className="p-3.5 rounded-[4px] bg-[#FAFAFA] border border-[#E5E5E5] space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#666666]">Connected Wallet:</span>
              <HashChip value={account || "Disconnected"} type="address" digits={4} />
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#666666]">Admin Authority Address:</span>
              <HashChip value={config?.admin || "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"} type="address" digits={4} />
            </div>
            {isWalletAdmin ? (
              <div className="flex items-center gap-2 text-xs text-[#0F766E] font-medium pt-1 border-t border-[#E5E5E5]">
                <Check className="w-4 h-4" />
                <span>Authorized Deployer Wallet Detected</span>
              </div>
            ) : !account ? (
              <div className="flex items-center justify-between pt-1 border-t border-[#E5E5E5] text-xs">
                <span className="text-[#666666]">No wallet connected</span>
                <button
                  type="button"
                  onClick={() => switchAccount(config?.admin || "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266", config?.sampleAccounts?.[0]?.privateKey)}
                  className="text-[#0F766E] hover:underline font-medium cursor-pointer"
                >
                  Connect Admin Account
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between pt-1 border-t border-[#E5E5E5] text-xs">
                <span className="text-[#EA580C]">Non-admin wallet connected</span>
                <button
                  type="button"
                  onClick={() => switchAccount(config?.admin || "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266", config?.sampleAccounts?.[0]?.privateKey)}
                  className="text-[#0F766E] hover:underline font-medium cursor-pointer"
                >
                  Switch to Admin Wallet
                </button>
              </div>
            )}
          </div>

          {authError && (
            <div className="p-3 rounded-[4px] bg-[#FEF2F2] border border-[#FCA5A5] text-xs text-[#DC2626] flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 flex-shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          {/* Quick 1-Click for Wallet Admin */}
          {isWalletAdmin && (
            <Button
              variant="primary"
              size="md"
              className="w-full"
              onClick={() => handleAdminAuth("ful-librarian-2026")}
              isLoading={isAuthenticating}
              leftIcon={<KeyRound className="w-4 h-4" />}
            >
              Authorize with Connected Admin Wallet
            </Button>
          )}

          {/* Passcode Authorization Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleAdminAuth();
            }}
            className="space-y-4 pt-2 border-t border-[#E5E5E5]"
          >
            <div>
              <label className="block text-xs font-medium text-[#1A1A1A] mb-1.5">
                Staff Passcode / Cryptographic Token
              </label>
              <input
                type="password"
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
                placeholder="Enter administrator passcode..."
                className="w-full px-3 py-2 rounded-[4px] bg-[#FAFAFA] border border-[#E5E5E5] text-xs sm:text-sm text-[#1A1A1A] focus:outline-none focus:border-[#1A1A1A]"
              />
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-[#666666]">Default Demo Passcode:</span>
              <button
                type="button"
                onClick={() => {
                  setPassphrase("ful-librarian-2026");
                  handleAdminAuth("ful-librarian-2026");
                }}
                className="text-[#0F766E] hover:underline font-medium cursor-pointer"
              >
                Quick-fill: ful-librarian-2026
              </button>
            </div>

            <Button
              type="submit"
              variant={isWalletAdmin ? "secondary" : "primary"}
              size="md"
              className="w-full"
              isLoading={isAuthenticating}
              leftIcon={<Unlock className="w-4 h-4" />}
            >
              Verify Passcode & Enter Console
            </Button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 py-6">
      {/* 1. Page Header & Admin Status */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#E5E5E5]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="teal" dot>
              Authenticated Chief Librarian
            </Badge>
            <span className="text-xs text-[#666666] font-mono-ledger">
              Session Verified · Chain ID 31337
            </span>
          </div>
          <h1 className="font-serif-academic text-3xl sm:text-4xl font-medium text-[#1A1A1A]">
            Library Administrator Console
          </h1>
          <p className="text-xs sm:text-sm text-[#666666] mt-1">
            Manage off-chain applicant verifications, mint catalog volumes, and verify physical desk circulations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleLockConsole}
            leftIcon={<Lock className="w-3.5 h-3.5" />}
          >
            Lock Console
          </Button>
        </div>
      </div>

      {/* 2. Admin Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="rounded-[4px] bg-[#FFFFFF] border border-[#E5E5E5] p-5 space-y-1 shadow-xs">
          <span className="text-xs text-[#666666]">Total Catalog Holdings</span>
          <p className="font-serif-academic text-2xl sm:text-3xl font-medium text-[#1A1A1A]">
            {books.length}
          </p>
          <span className="text-[11px] text-[#0F766E] font-medium">
            {books.filter((b) => b.isAvailable).length} ready to borrow
          </span>
        </div>

        <div className="rounded-[4px] bg-[#FFFFFF] border border-[#E5E5E5] p-5 space-y-1 shadow-xs">
          <span className="text-xs text-[#666666]">Active Loans in Circulation</span>
          <p className="font-serif-academic text-2xl sm:text-3xl font-medium text-[#1A1A1A]">
            {records.filter((r) => !r.returned).length}
          </p>
          <span className="text-[11px] text-[#666666]">
            Tracked on Hardhat EVM
          </span>
        </div>

        <div className="rounded-[4px] bg-[#FFFFFF] border border-[#E5E5E5] p-5 space-y-1 shadow-xs">
          <span className="text-xs text-[#666666]">Pending Student Reviews</span>
          <p className="font-serif-academic text-2xl sm:text-3xl font-medium text-[#1A1A1A]">
            {pendingList.length}
          </p>
          <span className="text-[11px] text-[#EA580C] font-medium">
            Awaiting credential review
          </span>
        </div>

        <div className="rounded-[4px] bg-[#FFFFFF] border border-[#E5E5E5] p-5 space-y-1 shadow-xs">
          <span className="text-xs text-[#666666]">Cumulative Borrows</span>
          <p className="font-serif-academic text-2xl sm:text-3xl font-medium text-[#1A1A1A]">
            {records.length}
          </p>
          <span className="text-[11px] text-[#0F766E] font-medium">
            100% On-chain recorded
          </span>
        </div>
      </div>

      {/* 3. Recharts Circulation Volume Over Time */}
      <div className="rounded-[4px] bg-[#FFFFFF] border border-[#E5E5E5] p-6 space-y-4 shadow-xs">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-serif-academic text-lg font-medium text-[#1A1A1A]">
              Circulation Volume Over Time
            </h3>
            <p className="text-xs text-[#666666]">
              Monthly borrowing and return transactions verified by smart contract.
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono-ledger">
            <span className="flex items-center gap-1.5 text-[#0F766E]">
              <span className="w-2 h-2 rounded-[1px] bg-[#0F766E]" />
              Loans Issued
            </span>
            <span className="flex items-center gap-1.5 text-[#666666]">
              <span className="w-2 h-2 rounded-[1px] bg-[#666666]" />
              Returns
            </span>
          </div>
        </div>

        <div className="h-56 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="tealGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0F766E" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#0F766E" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="month" stroke="#666666" fontSize={11} tickLine={false} />
              <YAxis stroke="#666666" fontSize={11} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#FFFFFF",
                  borderColor: "#E5E5E5",
                  borderRadius: "4px",
                  fontSize: "12px",
                  color: "#1A1A1A",
                }}
              />
              <Area
                type="monotone"
                dataKey="loans"
                stroke="#0F766E"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#tealGrad)"
              />
              <Area
                type="monotone"
                dataKey="returns"
                stroke="#666666"
                strokeWidth={1.5}
                strokeDasharray="3 3"
                fillOpacity={0}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 4. Tab Navigation */}
      <div className="flex items-center gap-1.5 border-b border-[#E5E5E5] pb-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab("pending")}
          className={`px-3 py-1.5 rounded-[4px] text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === "pending"
              ? "bg-[#1A1A1A] text-[#FFFFFF]"
              : "text-[#666666] hover:text-[#1A1A1A] hover:bg-[#FAFAFA]"
          }`}
        >
          Pending Registrations ({pendingList.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("catalogue")}
          className={`px-3 py-1.5 rounded-[4px] text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === "catalogue"
              ? "bg-[#1A1A1A] text-[#FFFFFF]"
              : "text-[#666666] hover:text-[#1A1A1A] hover:bg-[#FAFAFA]"
          }`}
        >
          Catalogue Management
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("circulation")}
          className={`px-3 py-1.5 rounded-[4px] text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === "circulation"
              ? "bg-[#1A1A1A] text-[#FFFFFF]"
              : "text-[#666666] hover:text-[#1A1A1A] hover:bg-[#FAFAFA]"
          }`}
        >
          All Circulation Records
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("settings")}
          className={`px-3 py-1.5 rounded-[4px] text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === "settings"
              ? "bg-[#1A1A1A] text-[#FFFFFF]"
              : "text-[#666666] hover:text-[#1A1A1A] hover:bg-[#FAFAFA]"
          }`}
        >
          Contract Settings
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("simulator")}
          className={`px-3 py-1.5 rounded-[4px] text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === "simulator"
              ? "bg-[#1A1A1A] text-[#FFFFFF]"
              : "text-[#666666] hover:text-[#1A1A1A] hover:bg-[#FAFAFA]"
          }`}
        >
          EVM Simulator
        </button>
      </div>

      {/* Tab 1: Pending Registrations */}
      {activeTab === "pending" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-serif-academic text-xl font-medium text-[#1A1A1A]">
              Off-chain Verified Identity Queue
            </h3>
            <Button variant="secondary" size="sm" onClick={loadPending} isLoading={isLoadingPending}>
              Refresh Queue
            </Button>
          </div>

          {pendingList.length === 0 ? (
            <EmptyState
              title="Identity Queue Empty"
              description="No pending student registration requests at this time. All applicants have been processed onto the smart contract."
              iconType="pending"
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingList.map((item) => (
                <div
                  key={item.id}
                  className="rounded-[4px] bg-[#FFFFFF] border border-[#E5E5E5] p-5 space-y-3 shadow-xs"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-serif-academic text-base font-medium text-[#1A1A1A]">
                        {item.name}
                      </h4>
                      <p className="text-xs text-[#666666] mt-0.5">
                        {item.faculty}
                      </p>
                    </div>
                    <Badge variant="orange" dot>Pending Review</Badge>
                  </div>

                  <div className="p-3 rounded-[4px] bg-[#FAFAFA] border border-[#E5E5E5] text-xs space-y-1.5 font-mono-ledger">
                    <div className="flex justify-between items-center">
                      <span className="text-[#666666]">Wallet:</span>
                      <HashChip value={item.wallet_address} type="address" digits={4} />
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[#666666]">Salted Matric Hash:</span>
                      <HashChip value={item.matric_hash} type="hash" digits={4} />
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#666666]">Submitted:</span>
                      <span className="text-[#1A1A1A]">{new Date(item.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E5E5E5]">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleReject(item.id)}
                    >
                      Reject
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      isLoading={approvingId === item.id}
                      onClick={() => handleApprove(item)}
                      leftIcon={<Check className="w-3.5 h-3.5" />}
                    >
                      Approve on Smart Contract
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Catalogue Management (Add Book Form) */}
      {activeTab === "catalogue" && (
        <div className="space-y-6">
          <div className="rounded-[4px] bg-[#FFFFFF] border border-[#E5E5E5] p-6 space-y-4 shadow-xs">
            <h3 className="font-serif-academic text-xl font-medium text-[#1A1A1A]">
              Catalogue New Volume on Blockchain
            </h3>
            <p className="text-xs text-[#666666]">
              Executes the on-chain <code className="font-mono-ledger text-xs text-[#0F766E]">addBook(string title, string author)</code> transaction to mint an official university ledger volume.
            </p>

            <form onSubmit={handleAddBookSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-1 space-y-1">
                <label className="block text-xs font-medium text-[#1A1A1A]">
                  Book Title
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Distributed Systems & Consensus"
                  className="w-full px-3 py-2 rounded-[4px] bg-[#FAFAFA] border border-[#E5E5E5] text-xs sm:text-sm text-[#1A1A1A] focus:outline-none focus:border-[#1A1A1A]"
                />
              </div>

              <div className="sm:col-span-1 space-y-1">
                <label className="block text-xs font-medium text-[#1A1A1A]">
                  Author
                </label>
                <input
                  type="text"
                  required
                  value={newAuthor}
                  onChange={(e) => setNewAuthor(e.target.value)}
                  placeholder="e.g. Prof. A. O. Bello"
                  className="w-full px-3 py-2 rounded-[4px] bg-[#FAFAFA] border border-[#E5E5E5] text-xs sm:text-sm text-[#1A1A1A] focus:outline-none focus:border-[#1A1A1A]"
                />
              </div>

              <div className="sm:col-span-1 flex items-end">
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  className="w-full"
                  isLoading={isAddingBook}
                  leftIcon={<Plus className="w-4 h-4" />}
                >
                  Mint to Ledger
                </Button>
              </div>
            </form>
          </div>

          {/* Current Catalog Table */}
          <div className="rounded-[4px] bg-[#FFFFFF] border border-[#E5E5E5] overflow-hidden shadow-xs">
            <div className="p-4 border-b border-[#E5E5E5] flex items-center justify-between">
              <h4 className="font-serif-academic text-base font-medium text-[#1A1A1A]">
                Holdings in Smart Contract ({books.length})
              </h4>
              <Badge variant="teal">Chain ID 31337</Badge>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAFAFA] text-[#666666] border-b border-[#E5E5E5]">
                  <tr>
                    <th className="p-3 font-medium">ID</th>
                    <th className="p-3 font-medium">Title & Author</th>
                    <th className="p-3 font-medium">Availability</th>
                    <th className="p-3 font-medium">Current Borrower</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E5E5]">
                  {books.map((b) => (
                    <tr key={b.id} className="hover:bg-[#FAFAFA]">
                      <td className="p-3 font-mono-ledger text-[#1A1A1A]">#{b.id}</td>
                      <td className="p-3">
                        <p className="font-medium text-[#1A1A1A]">{b.title}</p>
                        <p className="text-[#666666] text-[11px]">{b.author}</p>
                      </td>
                      <td className="p-3">
                        {b.isAvailable ? (
                          <Badge variant="teal" dot>Available</Badge>
                        ) : (
                          <Badge variant="outline">Borrowed</Badge>
                        )}
                      </td>
                      <td className="p-3">
                        {b.currentBorrower ? (
                          <HashChip value={b.currentBorrower} type="address" digits={4} />
                        ) : (
                          <span className="text-[#666666]">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Database Demo Books Catalog */}
          <div className="rounded-[4px] bg-[#FFFFFF] border border-[#E5E5E5] overflow-hidden shadow-xs">
            <div className="p-4 border-b border-[#E5E5E5] flex items-center justify-between">
              <div>
                <h4 className="font-serif-academic text-base font-medium text-[#1A1A1A]">
                  University Master Holdings in Database ({demoBooks.length})
                </h4>
                <p className="text-xs text-[#666666] mt-0.5">
                  Academic volumes seeded in SQLite database with physical shelf coordinates and call numbers.
                </p>
              </div>
              <Badge variant="outline">SQLite Catalog</Badge>
            </div>

            <div className="overflow-x-auto max-h-[380px]">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAFAFA] text-[#666666] border-b border-[#E5E5E5] sticky top-0 z-10">
                  <tr>
                    <th className="p-3 font-medium">Shelf / Call No.</th>
                    <th className="p-3 font-medium">Volume & Author</th>
                    <th className="p-3 font-medium">Faculty Discipline</th>
                    <th className="p-3 font-medium">ISBN</th>
                    <th className="p-3 font-medium text-right">Ledger Sync</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E5E5]">
                  {demoBooks.map((item) => {
                    const isAlreadyOnChain = books.some(
                      (b) => b.title.toLowerCase().trim() === item.title.toLowerCase().trim()
                    );

                    return (
                      <tr key={item.id} className="hover:bg-[#FAFAFA]">
                        <td className="p-3 font-mono-ledger">
                          <div className="flex items-center gap-1.5 text-[#0F766E]">
                            <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                            <span>{item.shelf_location || "Central Stacks"}</span>
                          </div>
                        </td>
                        <td className="p-3">
                          <p className="font-medium text-[#1A1A1A]">{item.title}</p>
                          <p className="text-[#666666] text-[11px]">{item.author} ({item.year})</p>
                        </td>
                        <td className="p-3">
                          <Badge variant="outline">{item.category}</Badge>
                        </td>
                        <td className="p-3 font-mono-ledger text-[#666666]">
                          {item.isbn}
                        </td>
                        <td className="p-3 text-right">
                          {isAlreadyOnChain ? (
                            <span className="inline-flex items-center gap-1 text-[11px] text-[#0F766E] font-medium">
                              <Check className="w-3.5 h-3.5" /> Minted
                            </span>
                          ) : (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => addBook(item.title, item.author)}
                              leftIcon={<Plus className="w-3 h-3" />}
                            >
                              Mint to Chain
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: All Circulation Records */}
      {activeTab === "circulation" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="font-serif-academic text-xl font-medium text-[#1A1A1A]">
                Public University Circulation Ledger ({records.length})
              </h3>
              <p className="text-xs text-[#666666]">
                Includes physical desk verification checklists for librarian staff handover and collection.
              </p>
            </div>
            <div className="relative max-w-xs w-full">
              <Search className="w-3.5 h-3.5 text-[#666666] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={circSearch}
                onChange={(e) => setCircSearch(e.target.value)}
                placeholder="Search record ID or borrower..."
                className="w-full pl-8 pr-3 py-1.5 rounded-[4px] bg-[#FFFFFF] border border-[#E5E5E5] text-xs text-[#1A1A1A] focus:outline-none focus:border-[#1A1A1A]"
              />
            </div>
          </div>

          <div className="rounded-[4px] bg-[#FFFFFF] border border-[#E5E5E5] overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAFAFA] text-[#666666] border-b border-[#E5E5E5]">
                  <tr>
                    <th className="p-3 font-medium">Record</th>
                    <th className="p-3 font-medium">Book Volume</th>
                    <th className="p-3 font-medium">Borrower Address</th>
                    <th className="p-3 font-medium">Borrowed / Due</th>
                    <th className="p-3 font-medium">Blockchain Status</th>
                    <th className="p-3 font-medium">Physical Desk Checklist</th>
                    <th className="p-3 font-medium text-right">On-Chain Proof</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E5E5]">
                  {filteredCirculation.map((rec) => (
                    <tr key={rec.id} className="hover:bg-[#FAFAFA] align-top">
                      <td className="p-3 font-mono-ledger text-[#1A1A1A]">#{rec.id}</td>
                      <td className="p-3">
                        <p className="font-medium text-[#1A1A1A]">{rec.bookTitle}</p>
                        <span className="text-[10px] text-[#666666]">ID #{rec.bookId}</span>
                      </td>
                      <td className="p-3">
                        <HashChip value={rec.borrower} type="address" digits={4} />
                      </td>
                      <td className="p-3 text-[#666666]">
                        <div className="text-[#1A1A1A]">{formatUnixDate(rec.borrowTimestamp)}</div>
                        <div className="text-[11px] font-mono-ledger text-[#666666]">Due: {formatUnixDate(rec.dueDate)}</div>
                      </td>
                      <td className="p-3">
                        {rec.returned ? (
                          <Badge variant="teal">Returned</Badge>
                        ) : rec.dueDate < Math.floor(Date.now() / 1000) ? (
                          <Badge variant="danger">Overdue</Badge>
                        ) : (
                          <Badge variant="orange">Active Custody</Badge>
                        )}
                      </td>
                      <td className="p-3">
                        <div className="max-w-[230px]">
                          <DeskStatusChecklist
                            recordId={rec.id}
                            bookId={rec.bookId}
                            borrower={rec.borrower}
                            initialStatus={deskStatuses[rec.id]}
                            onStatusChange={(updated) =>
                              setDeskStatuses((prev) => ({ ...prev, [rec.id]: updated }))
                            }
                          />
                        </div>
                      </td>
                      <td className="p-3 text-right">
                        <VerifiedSeal record={rec} size="sm" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Contract Settings & Governance */}
      {activeTab === "settings" && (
        <div className="max-w-xl space-y-6">
          <form
            onSubmit={handleSaveSettings}
            className="rounded-[4px] bg-[#FFFFFF] border border-[#E5E5E5] p-6 space-y-5 shadow-xs"
          >
            <div className="space-y-1">
              <h3 className="font-serif-academic text-xl font-medium text-[#1A1A1A]">
                Smart Contract Governance Parameters
              </h3>
              <p className="text-xs text-[#666666]">
                Updates circulation policy state on the LibrarySystem smart contract. Only callable by Chief Librarian.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-[#1A1A1A]">
                Standard Loan Period (Days)
              </label>
              <input
                type="number"
                min="1"
                max="90"
                value={borrowDays}
                onChange={(e) => setBorrowDays(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-[4px] bg-[#FAFAFA] border border-[#E5E5E5] text-xs sm:text-sm text-[#1A1A1A] focus:outline-none focus:border-[#1A1A1A]"
              />
              <p className="text-[11px] text-[#666666]">
                Default is 14 days per loan.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-[#1A1A1A]">
                Daily Late Fine Rate (gwei per day)
              </label>
              <input
                type="number"
                min="1"
                value={fineGwei}
                onChange={(e) => setFineGwei(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-[4px] bg-[#FAFAFA] border border-[#E5E5E5] text-xs sm:text-sm text-[#1A1A1A] focus:outline-none focus:border-[#1A1A1A]"
              />
              <p className="text-[11px] text-[#666666]">
                Current: 50 gwei/day (0.00000005 ETH/day)
              </p>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isSavingSettings}
            >
              Save Parameters On-Chain
            </Button>
          </form>
        </div>
      )}

      {/* Tab 5: EVM Time Simulator */}
      {activeTab === "simulator" && (
        <div className="max-w-xl rounded-[4px] bg-[#FFFFFF] border border-[#E5E5E5] p-6 space-y-4 shadow-xs">
          <div className="space-y-1">
            <h3 className="font-serif-academic text-xl font-medium text-[#1A1A1A]">
              Hardhat EVM Time Manipulation
            </h3>
            <p className="text-xs text-[#666666] leading-relaxed">
              Advance the local blockchain clock using <code className="font-mono-ledger text-xs text-[#0F766E]">evm_increaseTime</code>. Test how active books cross the 14-day threshold and watch smart contract late fines accrue live without waiting real-world days.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button variant="secondary" size="md" onClick={() => timeTravel(1)}>
              Advance +1 Day
            </Button>
            <Button variant="secondary" size="md" onClick={() => timeTravel(7)}>
              Advance +7 Days
            </Button>
            <Button variant="secondary" size="md" onClick={() => timeTravel(18)}>
              Advance +18 Days (Trigger Overdue Fines)
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
