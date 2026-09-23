export interface Book {
  id: number;
  title: string;
  author: string;
  isAvailable: boolean;
  currentBorrower: string;
  coverTheme?: BookCoverTheme;
  coverImage?: string;
}

export interface BookCoverTheme {
  bg: string;
  text: string;
  subtext: string;
  spine: string;
  accent: string;
}

export interface BorrowRecord {
  id: number;
  bookId: number;
  bookTitle?: string;
  bookAuthor?: string;
  borrower: string;
  borrowTimestamp: number; // Unix seconds
  dueDate: number; // Unix seconds
  returnTimestamp: number; // Unix seconds (0 if active)
  fineAmount: string; // in wei or gwei
  returned: boolean;
  blockNumber?: number;
  txHash?: string;
}

export interface Member {
  address: string;
  isRegistered: boolean;
  name: string;
  currentBorrows: number;
  maxBorrows: number;
}

export interface PendingRegistration {
  id: number;
  wallet_address: string;
  name: string;
  faculty: string;
  matric_hash: string;
  record_salt: string;
  status: "pending" | "approved" | "rejected";
  created_at: number;
  tx_hash?: string | null;
  rejection_reason?: string | null;
}

export type UserRole = "admin" | "member" | "unregistered" | "disconnected";

export interface SampleAccount {
  role: string;
  name: string;
  address: string;
  privateKey: string;
  status?: string;
}

export interface DeploymentConfig {
  address: string;
  admin: string;
  borrowPeriodDays: number;
  fineRatePerDay: string;
  chainId: number;
  rpcUrl: string;
  directRpcUrl: string;
  blockNumber: number;
  chainOnline: boolean;
  abi: any[];
  sampleAccounts: SampleAccount[];
}

export interface TransactionStep {
  step: "idle" | "awaiting" | "confirming" | "recorded" | "error";
  title?: string;
  txHash?: string;
  blockNumber?: number;
  error?: string;
}

export interface DeskCirculationStatus {
  record_id: number;
  book_id: number;
  borrower: string;
  picked_up: boolean;
  picked_up_at?: number | null;
  picked_up_by?: string | null;
  returned: boolean;
  returned_at?: number | null;
  returned_by?: string | null;
  desk_notes?: string | null;
  updated_at: number;
}

export interface DemoBookItem {
  id: number;
  title: string;
  author: string;
  category: string;
  shelf_location: string;
  synopsis: string;
  year: number;
  isbn: string;
}
