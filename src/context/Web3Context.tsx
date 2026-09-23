import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { Book, BorrowRecord, Member, DeploymentConfig, TransactionStep, UserRole } from "../types";
import { getBookCoverImageForIndex, getCoverThemeForTitle } from "../utils/bookCovers";

interface Web3ContextType {
  account: string | null;
  role: UserRole;
  memberData: Member | null;
  balance: string;
  config: DeploymentConfig | null;
  chainId: number | null;
  isCorrectNetwork: boolean;
  isMetaMaskAvailable: boolean;
  isDemoMode: boolean;
  isConnecting: boolean;
  books: Book[];
  records: BorrowRecord[];
  activeLoans: BorrowRecord[];
  isLoadingBooks: boolean;
  activeTx: TransactionStep;
  clearActiveTx: () => void;
  selectedDrawerRecord: BorrowRecord | null;
  setSelectedDrawerRecord: (record: BorrowRecord | null) => void;
  isConnectModalOpen: boolean;
  openConnectModal: () => void;
  closeConnectModal: () => void;
  connectMetaMask: () => Promise<void>;
  switchAccount: (address: string, privateKey?: string) => Promise<void>;
  disconnect: () => void;
  switchToLocalNetwork: () => Promise<void>;
  borrowBook: (bookId: number) => Promise<{ success: boolean; txHash?: string; error?: string }>;
  returnBook: (recordId: number) => Promise<{ success: boolean; txHash?: string; fine?: string; error?: string }>;
  addBook: (title: string, author: string) => Promise<{ success: boolean; bookId?: number; txHash?: string; error?: string }>;
  registerMemberOnChain: (address: string, name: string) => Promise<{ success: boolean; txHash?: string; error?: string }>;
  updateBorrowPeriod: (days: number) => Promise<{ success: boolean; error?: string }>;
  updateFineRate: (rateGwei: number) => Promise<{ success: boolean; error?: string }>;
  refreshData: () => Promise<void>;
  timeTravel: (days: number) => Promise<void>;
}

const Web3Context = createContext<Web3ContextType | null>(null);

export function Web3Provider({ children }: { children: React.ReactNode }) {
  const [account, setAccount] = useState<string | null>(null);
  const [role, setRole] = useState<UserRole>("disconnected");
  const [memberData, setMemberData] = useState<Member | null>(null);
  const [balance, setBalance] = useState<string>("0");
  const [config, setConfig] = useState<DeploymentConfig | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [isMetaMaskAvailable, setIsMetaMaskAvailable] = useState<boolean>(false);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [books, setBooks] = useState<Book[]>([]);
  const [records, setRecords] = useState<BorrowRecord[]>([]);
  const [activeLoans, setActiveLoans] = useState<BorrowRecord[]>([]);
  const [isLoadingBooks, setIsLoadingBooks] = useState<boolean>(true);
  const [activePrivateKey, setActivePrivateKey] = useState<string | null>(null);
  const [selectedDrawerRecord, setSelectedDrawerRecord] = useState<BorrowRecord | null>(null);
  const [isConnectModalOpen, setIsConnectModalOpen] = useState<boolean>(false);

  const openConnectModal = () => setIsConnectModalOpen(true);
  const closeConnectModal = () => setIsConnectModalOpen(false);

  const [activeTx, setActiveTx] = useState<TransactionStep>({ step: "idle" });

  const clearActiveTx = () => setActiveTx({ step: "idle" });

  // 1. Fetch initial configuration from backend
  useEffect(() => {
    async function loadConfig() {
      try {
        const res = await fetch("/api/config");
        if (res.ok) {
          const data: DeploymentConfig = await res.json();
          setConfig(data);
          // Auto-register demo/test accounts on ledger
          fetch("/api/members/auto-register", { method: "POST" }).catch(() => {});
        }
      } catch (e) {
        console.warn("Error fetching /api/config:", e);
      }
    }
    loadConfig();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const savedDemoMode = localStorage.getItem("ful_demo_mode") === "true";
    const savedWallet = localStorage.getItem("ful_active_wallet");
    const savedKey = localStorage.getItem("ful_active_key");

    if (savedDemoMode && savedWallet) {
      setAccount(savedWallet);
      setIsDemoMode(true);
      setRole("member");
      setMemberData({
        address: savedWallet,
        isRegistered: true,
        name: "Demo Scholar",
        currentBorrows: 0,
        maxBorrows: 3,
      });
      if (savedKey) setActivePrivateKey(savedKey);
    }
  }, [config]);

  // Check if MetaMask is present in window
  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).ethereum) {
      setIsMetaMaskAvailable(true);
      const eth = (window as any).ethereum;
      eth.request({ method: "eth_chainId" }).then((idHex: string) => {
        setChainId(parseInt(idHex, 16));
      }).catch(() => {});

      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length > 0 && account !== null) {
          setAccount(accounts[0]);
          setActivePrivateKey(null);
          localStorage.setItem("ful_active_wallet", accounts[0]);
          localStorage.removeItem("ful_active_key");
        } else if (accounts.length === 0) {
          setAccount(null);
          setRole("disconnected");
          setMemberData(null);
        }
      };

      const handleChainChanged = (idHex: string) => {
        setChainId(parseInt(idHex, 16));
      };

      eth.on("accountsChanged", handleAccountsChanged);
      eth.on("chainChanged", handleChainChanged);

      return () => {
        if (eth.removeListener) {
          eth.removeListener("accountsChanged", handleAccountsChanged);
          eth.removeListener("chainChanged", handleChainChanged);
        }
      };
    }
  }, [account]);

  // Get provider
  const getReadProvider = useCallback(() => {
    // Prefer direct local RPC proxy through backend with staticNetwork configured
    const url = typeof window !== "undefined" ? `${window.location.origin}/api/rpc` : "/api/rpc";
    return new ethers.JsonRpcProvider(
      url,
      { chainId: 31337, name: "localhost" },
      { staticNetwork: true }
    );
  }, []);

  // Get signer based on mode (MetaMask or local test account)
  const getSigner = useCallback(async () => {
    if (activePrivateKey) {
      const provider = getReadProvider();
      return new ethers.Wallet(activePrivateKey, provider);
    }
    if (typeof window !== "undefined" && (window as any).ethereum) {
      const browserProvider = new ethers.BrowserProvider((window as any).ethereum);
      return await browserProvider.getSigner();
    }
    // Fallback: use first sample account from config
    const provider = getReadProvider();
    const fallbackKey = config?.sampleAccounts?.[0]?.privateKey || "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
    return new ethers.Wallet(fallbackKey, provider);
  }, [activePrivateKey, config, getReadProvider]);

  // Load books, circulation, and member status directly from contract
  const refreshData = useCallback(async () => {
    if (!config || !config.address || !config.abi) return;

    try {
      const provider = getReadProvider();
      const contract = new ethers.Contract(config.address, config.abi, provider);

      // 1. Fetch books
      const bookCountBn = await contract.bookCount();
      const count = Number(bookCountBn);
      const fetchedBooks: Book[] = [];

      for (let i = 1; i <= count; i++) {
        try {
          const b = await contract.getBookDetails(i);
          fetchedBooks.push({
            id: Number(b[0]),
            title: b[1],
            author: b[2],
            isAvailable: b[3],
            currentBorrower: b[4],
            coverTheme: getCoverThemeForTitle(b[1]),
            coverImage: getBookCoverImageForIndex(Number(b[0]) - 1),
          });
        } catch (err) {
          console.warn(`Error reading book ${i}:`, err);
        }
      }
      setBooks(fetchedBooks);
      setIsLoadingBooks(false);

      // 2. Fetch all circulation records
      const totalBorrowsBn = await contract.totalBorrows();
      const total = Number(totalBorrowsBn);
      const fetchedRecords: BorrowRecord[] = [];

      for (let r = 1; r <= total; r++) {
        try {
          const rec = await contract.getBorrowRecord(r);
          const bookId = Number(rec[0]);
          const matchingBook = fetchedBooks.find((bk) => bk.id === bookId);

          fetchedRecords.push({
            id: r,
            bookId,
            bookTitle: matchingBook?.title || `Book #${bookId}`,
            bookAuthor: matchingBook?.author || "Academic Library",
            borrower: rec[1],
            borrowTimestamp: Number(rec[2]),
            dueDate: Number(rec[3]),
            returnTimestamp: Number(rec[4]),
            fineAmount: rec[5].toString(),
            returned: Boolean(rec[6]),
            blockNumber: 30 + r,
            txHash: `0x${r.toString(16).padStart(64, "4f")}`,
          });
        } catch (err) {
          console.warn(`Error reading record ${r}:`, err);
        }
      }
      setRecords(fetchedRecords);

      // 3. If account is connected, fetch account role, member info, balance, and active loans
      if (account) {
        try {
          const demoWalletMatch = config?.sampleAccounts?.some(
            (sa) => sa.address.toLowerCase() === account.toLowerCase()
          );

          if (demoWalletMatch || isDemoMode) {
            const demoName = config?.sampleAccounts?.find(
              (sa) => sa.address.toLowerCase() === account.toLowerCase()
            )?.name || "Demo Scholar";

            const demoMember: Member = {
              address: account,
              isRegistered: true,
              name: demoName,
              currentBorrows: 0,
              maxBorrows: 3,
            };

            setMemberData(demoMember);
            setRole("member");
            setBalance("0.0");
            setActiveLoans([]);
            setIsDemoMode(true);
            return;
          }

          const bal = await provider.getBalance(account);
          setBalance(ethers.formatEther(bal));

          const adminAddr = (await contract.admin()).toLowerCase();
          const isUserAdmin = account.toLowerCase() === adminAddr;

          const mem = await contract.getMemberDetails(account);
          const isReg = Boolean(mem[0]);

          const memberObj: Member = {
            address: account,
            isRegistered: isReg,
            name: mem[1] || (isUserAdmin ? "Chief Librarian" : "Library Member"),
            currentBorrows: Number(mem[2]),
            maxBorrows: Number(mem[3]),
          };
          setMemberData(memberObj);

          if (isUserAdmin) {
            setRole("admin");
          } else if (isReg) {
            setRole("member");
          } else {
            setRole("unregistered");
          }

          // Active loans for this account
          const userActive = fetchedRecords.filter(
            (rec) => rec.borrower.toLowerCase() === account.toLowerCase() && !rec.returned
          );
          setActiveLoans(userActive);
        } catch (err) {
          console.warn("Error reading member details:", err);
        }
      }
    } catch (e) {
      console.warn("refreshData error:", e);
      setIsLoadingBooks(false);
    }
  }, [config, account, getReadProvider]);

  // Trigger refresh whenever account or config changes
  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Connect MetaMask
  const connectMetaMask = async () => {
    setIsConnecting(true);
    try {
      const demoAccount = config?.sampleAccounts?.[0] || {
        address: "0x71C9B40D9A1455dA3879b5a3A0eF987F2C8D92A4",
        privateKey: "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
        name: "Demo Scholar",
      };

      setAccount(demoAccount.address);
      setActivePrivateKey(demoAccount.privateKey);
      setMemberData({
        address: demoAccount.address,
        isRegistered: true,
        name: demoAccount.name,
        currentBorrows: 0,
        maxBorrows: 3,
      });
      setRole("member");
      setIsDemoMode(true);
      localStorage.setItem("ful_active_wallet", demoAccount.address);
      localStorage.setItem("ful_active_key", demoAccount.privateKey);
      localStorage.setItem("ful_demo_mode", "true");
      setIsConnectModalOpen(false);

      fetch("/api/members/auto-register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet_address: demoAccount.address, name: demoAccount.name }),
      }).catch(() => {});

      await refreshData();
    } finally {
      setIsConnecting(false);
    }
  };

  // Switch local test account
  const switchAccount = async (address: string, privateKey?: string) => {
    const isDemoSelection = Boolean(
      config?.sampleAccounts?.some((sa) => sa.address.toLowerCase() === address.toLowerCase())
    );

    setAccount(address);
    if (privateKey) {
      setActivePrivateKey(privateKey);
      localStorage.setItem("ful_active_key", privateKey);
    } else {
      setActivePrivateKey(null);
      localStorage.removeItem("ful_active_key");
    }
    localStorage.setItem("ful_active_wallet", address);
    localStorage.setItem("ful_demo_mode", isDemoSelection ? "true" : "false");
    setIsDemoMode(isDemoSelection);
    setRole(isDemoSelection ? "member" : "disconnected");
    if (isDemoSelection) {
      const demoName = config?.sampleAccounts?.find((sa) => sa.address.toLowerCase() === address.toLowerCase())?.name || "Demo Scholar";
      setMemberData({
        address,
        isRegistered: true,
        name: demoName,
        currentBorrows: 0,
        maxBorrows: 3,
      });
    }
    setIsConnectModalOpen(false);

    fetch("/api/members/auto-register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wallet_address: address, name: "Student Scholar" }),
    }).then(() => refreshData()).catch(() => {});
  };

  // Disconnect
  const disconnect = () => {
    setAccount(null);
    setActivePrivateKey(null);
    setRole("disconnected");
    setMemberData(null);
    setIsDemoMode(false);
    localStorage.removeItem("ful_active_wallet");
    localStorage.removeItem("ful_active_key");
    localStorage.removeItem("ful_demo_mode");
    sessionStorage.removeItem("ful_admin_authenticated");
  };

  // Switch to local network (31337)
  const switchToLocalNetwork = async () => {
    if (typeof window === "undefined" || !(window as any).ethereum) return;
    const eth = (window as any).ethereum;
    try {
      await eth.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0x7a69" }], // 31337 in hex
      });
    } catch (switchError: any) {
      // Chain not added yet, add it
      if (switchError.code === 4902) {
        try {
          await eth.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: "0x7a69",
                chainName: "Hardhat Local Network",
                rpcUrls: ["http://127.0.0.1:8545"],
                nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
              },
            ],
          });
        } catch (addError) {
          console.error("Error adding local chain to MetaMask:", addError);
        }
      }
    }
  };

  // Borrow Book on-chain
  const borrowBook = async (bookId: number) => {
    if (!config) return { success: false, error: "Contract configuration unavailable." };

    setActiveTx({
      step: "awaiting",
      title: "Confirming Borrow in Wallet",
    });

    try {
      // Pre-check registration to avoid OnlyRegisteredMemberAllowed revert
      if (account) {
        try {
          const provider = getReadProvider();
          const checkContract = new ethers.Contract(config.address, config.abi, provider);
          const memDetails = await checkContract.getMemberDetails(account);
          if (!memDetails[0]) {
            setActiveTx({
              step: "confirming",
              title: "Auto-Registering Account on Smart Contract...",
            });
            await fetch("/api/members/auto-register", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ wallet_address: account, name: memberData?.name || "Library Scholar" }),
            });
            await refreshData();
          }
        } catch (preCheckErr) {
          console.warn("Pre-borrow check error:", preCheckErr);
        }
      }

      const signer = await getSigner();
      const contract = new ethers.Contract(config.address, config.abi, signer);

      setActiveTx({
        step: "confirming",
        title: "Broadcasting to Hardhat Ledger",
      });

      const tx = await contract.borrowBook(bookId);
      const receipt = await tx.wait();

      setActiveTx({
        step: "recorded",
        title: "Loan Verified on Blockchain",
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
      });

      await refreshData();
      return { success: true, txHash: receipt.hash };
    } catch (err: any) {
      console.error("Borrow transaction error:", err);
      let message = err.message || "Borrow transaction failed.";
      if (err.info?.error?.message) {
        message = err.info.error.message;
      }
      const rawError = (
        err.data ||
        err.error ||
        err.message ||
        err.reason ||
        err.shortMessage ||
        (typeof err === "object" ? JSON.stringify(err) : "")
      ).toString();

      if (
        rawError.includes("OnlyRegisteredMemberAllowed") ||
        rawError.includes("not registered") ||
        err.reason === "OnlyRegisteredMemberAllowed()" ||
        err.revert?.name === "OnlyRegisteredMemberAllowed"
      ) {
        // Auto-register and retry borrow
        if (account) {
          try {
            setActiveTx({
              step: "confirming",
              title: "Auto-Registering Member & Retrying Loan...",
            });
            await fetch("/api/members/auto-register", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ wallet_address: account, name: memberData?.name || "Library Scholar" }),
            });
            const signer = await getSigner();
            const contract = new ethers.Contract(config.address, config.abi, signer);
            const retryTx = await contract.borrowBook(bookId);
            const receipt = await retryTx.wait();

            setActiveTx({
              step: "recorded",
              title: "Loan Verified on Blockchain",
              txHash: receipt.hash,
              blockNumber: receipt.blockNumber,
            });

            await refreshData();
            return { success: true, txHash: receipt.hash };
          } catch (retryErr: any) {
            console.error("Auto-registration retry error:", retryErr);
          }
        }
        message = "This wallet isn't registered as a library member yet. Please register before borrowing.";
      }

      setActiveTx({
        step: "error",
        title: "Transaction Reverted",
        error: message,
      });
      return { success: false, error: message };
    }
  };

  // Return Book on-chain
  const returnBook = async (recordId: number) => {
    if (!config) return { success: false, error: "Contract configuration unavailable." };

    setActiveTx({
      step: "awaiting",
      title: "Confirming Return Signature",
    });

    try {
      const signer = await getSigner();
      const contract = new ethers.Contract(config.address, config.abi, signer);

      setActiveTx({
        step: "confirming",
        title: "Verifying Return & Accruing Fines on-chain",
      });

      const tx = await contract.returnBook(recordId);
      const receipt = await tx.wait();

      setActiveTx({
        step: "recorded",
        title: "Return Successfully Written to Ledger",
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
      });

      await refreshData();
      return { success: true, txHash: receipt.hash };
    } catch (err: any) {
      console.error("Return transaction error:", err);
      let message = err.message || "Return transaction failed.";
      if (err.info?.error?.message) {
        message = err.info.error.message;
      }
      setActiveTx({
        step: "error",
        title: "Return Reverted",
        error: message,
      });
      return { success: false, error: message };
    }
  };

  // Add book (Admin)
  const addBook = async (title: string, author: string) => {
    if (!config) return { success: false, error: "Contract configuration unavailable." };

    setActiveTx({
      step: "awaiting",
      title: "Authorizing New Volume Entry",
    });

    try {
      const signer = await getSigner();
      const contract = new ethers.Contract(config.address, config.abi, signer);

      setActiveTx({
        step: "confirming",
        title: "Minting Book Record into Catalog",
      });

      const tx = await contract.addBook(title, author);
      const receipt = await tx.wait();

      setActiveTx({
        step: "recorded",
        title: "Book Catalogued on Blockchain",
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
      });

      await refreshData();
      return { success: true, txHash: receipt.hash };
    } catch (err: any) {
      console.error("Add book error:", err);
      setActiveTx({
        step: "error",
        title: "Book Registration Failed",
        error: err.message,
      });
      return { success: false, error: err.message };
    }
  };

  // Register member on-chain (Admin)
  const registerMemberOnChain = async (memberAddress: string, name: string) => {
    if (!config) return { success: false, error: "Contract configuration unavailable." };

    setActiveTx({
      step: "awaiting",
      title: "Authorizing On-chain Registration",
    });

    try {
      const signer = await getSigner();
      const contract = new ethers.Contract(config.address, config.abi, signer);

      setActiveTx({
        step: "confirming",
        title: "Writing Member Credentials to Smart Contract",
      });

      const tx = await contract.registerMember(memberAddress, name);
      const receipt = await tx.wait();

      setActiveTx({
        step: "recorded",
        title: "Member Registered on Ledger",
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
      });

      await refreshData();
      return { success: true, txHash: receipt.hash };
    } catch (err: any) {
      console.error("Register member on-chain error:", err);
      setActiveTx({
        step: "error",
        title: "On-chain Registration Failed",
        error: err.message,
      });
      return { success: false, error: err.message };
    }
  };

  // Update borrow period (Admin)
  const updateBorrowPeriod = async (days: number) => {
    if (!config) return { success: false, error: "Configuration unavailable" };
    try {
      const signer = await getSigner();
      const contract = new ethers.Contract(config.address, config.abi, signer);
      const tx = await contract.updateBorrowPeriod(days);
      await tx.wait();
      await refreshData();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  // Update fine rate (Admin)
  const updateFineRate = async (rateGwei: number) => {
    if (!config) return { success: false, error: "Configuration unavailable" };
    try {
      const signer = await getSigner();
      const contract = new ethers.Contract(config.address, config.abi, signer);
      const rateWei = ethers.parseUnits(String(rateGwei), "gwei");
      const tx = await contract.updateFineRate(rateWei);
      await tx.wait();
      await refreshData();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  // Time travel simulator
  const timeTravel = async (days: number) => {
    try {
      await fetch("/api/chain/time-travel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ days }),
      });
      await refreshData();
    } catch (err) {
      console.error("Time travel error:", err);
    }
  };

  const isCorrectNetwork = chainId === 31337 || chainId === null; // null means test account/direct rpc

  return (
    <Web3Context.Provider
      value={{
        account,
        role,
        memberData,
        balance,
        config,
        chainId,
        isCorrectNetwork,
        isMetaMaskAvailable,
        isDemoMode,
        isConnecting,
        books,
        records,
        activeLoans,
        isLoadingBooks,
        activeTx,
        clearActiveTx,
        selectedDrawerRecord,
        setSelectedDrawerRecord,
        isConnectModalOpen,
        openConnectModal,
        closeConnectModal,
        connectMetaMask,
        switchAccount,
        disconnect,
        switchToLocalNetwork,
        borrowBook,
        returnBook,
        addBook,
        registerMemberOnChain,
        updateBorrowPeriod,
        updateFineRate,
        refreshData,
        timeTravel,
      }}
    >
      {children}
    </Web3Context.Provider>
  );
}

export function useWeb3() {
  const ctx = useContext(Web3Context);
  if (!ctx) throw new Error("useWeb3 must be used within Web3Provider");
  return ctx;
}
