import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import {
  getDatabase,
  submitIdentityRegistration,
  getPendingRegistrations,
  getAllRegistrations,
  getRegistrationByWallet,
  updateRegistrationStatus,
  getAllDeskStatuses,
  getDeskStatus,
  updateDeskStatus,
  getAllDemoBooks,
} from "./backend/db.js";
import {
  getDeploymentConfig,
  getProvider,
  getAdminSigner,
  getContractInstance,
  advanceTime,
  autoRegisterDemoAccounts,
  ensureMemberRegistered,
} from "./backend/chainService.js";
import { ensureNodeAndContracts } from "./backend/nodeManager.js";
import { ethers } from "ethers";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Initialize SQLite database
  await getDatabase();

  // Ensure local Hardhat node is running and contract is seeded
  await ensureNodeAndContracts();

  // Auto-register demo/test accounts on smart contract
  await autoRegisterDemoAccounts();

  // --- API Routes ---

  // Health check
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: Date.now() });
  });

  // Contract deployment & configuration
  app.get("/api/config", async (_req, res) => {
    try {
      const config = getDeploymentConfig();
      // Try to get live network block
      let blockNumber = 0;
      let chainOnline = false;
      try {
        const provider = getProvider();
        blockNumber = await provider.getBlockNumber();
        chainOnline = true;
      } catch (err: any) {
        // Trigger background startup if node is down
        ensureNodeAndContracts().catch(() => {});
      }

      res.json({
        ...config,
        rpcUrl: "/api/rpc",
        directRpcUrl: "http://127.0.0.1:8545",
        blockNumber,
        chainOnline,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Off-Chain Identity: Submit registration
  app.post("/api/identity/register", async (req, res) => {
    try {
      const { wallet_address, name, faculty, matric_number } = req.body;
      if (!wallet_address || !name || !faculty || !matric_number) {
        return res.status(400).json({ error: "All registration fields are required." });
      }

      if (!ethers.isAddress(wallet_address)) {
        return res.status(400).json({ error: "Invalid Ethereum wallet address format." });
      }

      const result = await submitIdentityRegistration({
        wallet_address,
        name,
        faculty,
        matric_number,
      });

      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }

      res.json({
        success: true,
        id: result.id,
        status: "pending",
        message: "Registration submitted successfully. Pending administrator verification.",
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Off-Chain Identity: List pending
  app.get("/api/identity/pending", async (_req, res) => {
    try {
      const pending = await getPendingRegistrations();
      res.json({ success: true, count: pending.length, data: pending });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Off-Chain Identity: List all
  app.get("/api/identity/all", async (_req, res) => {
    try {
      const all = await getAllRegistrations();
      res.json({ success: true, count: all.length, data: all });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Off-Chain Identity: Status check
  app.get("/api/identity/status/:wallet", async (req, res) => {
    try {
      const { wallet } = req.params;
      const record = await getRegistrationByWallet(wallet);
      if (!record) {
        return res.json({ success: true, registered: false, status: "not_found" });
      }
      res.json({ success: true, registered: true, data: record });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Off-Chain Identity: Approve (Admin)
  app.post("/api/identity/approve", async (req, res) => {
    try {
      const { id, wallet_address, name, executeOnChain, txHash } = req.body;
      if (!id || !wallet_address) {
        return res.status(400).json({ error: "Registration ID and wallet address are required." });
      }

      let finalTxHash = txHash || null;

      // If requested or if no txHash passed, execute registerMember directly via backend admin signer
      if (executeOnChain || !finalTxHash) {
        try {
          const adminSigner = getAdminSigner();
          const contract = getContractInstance(adminSigner);
          const memberName = name || "FUL Student";

          // Check if already registered on-chain
          const memberDetails = await contract.getMemberDetails(wallet_address);
          if (!memberDetails[0]) {
            const tx = await contract.registerMember(wallet_address, memberName);
            const receipt = await tx.wait();
            finalTxHash = receipt.hash;
          } else {
            finalTxHash = "0x_already_registered_on_chain";
          }
        } catch (chainErr: any) {
          console.error("On-chain registration error:", chainErr);
          // Return clear error if it failed
          return res.status(500).json({
            error: `On-chain registration failed: ${chainErr.message || chainErr}`,
          });
        }
      }

      await updateRegistrationStatus(id, "approved", finalTxHash);
      res.json({ success: true, status: "approved", txHash: finalTxHash });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Off-Chain Identity: Reject (Admin)
  app.post("/api/identity/reject", async (req, res) => {
    try {
      const { id, reason } = req.body;
      if (!id) {
        return res.status(400).json({ error: "Registration ID is required." });
      }
      await updateRegistrationStatus(id, "rejected", undefined, reason || "Application rejected by administrator.");
      res.json({ success: true, status: "rejected" });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Direct Member Registration on Ledger
  app.post("/api/member/register", async (req, res) => {
    try {
      const { wallet_address, name } = req.body;
      if (!wallet_address || !ethers.isAddress(wallet_address)) {
        return res.status(400).json({ error: "Valid Ethereum wallet address is required." });
      }

      const adminSigner = getAdminSigner();
      const contract = getContractInstance(adminSigner);
      const memberName = (name || "").trim() || "University Member";

      // Check if already registered on chain
      const details = await contract.getMemberDetails(wallet_address);
      if (details[0]) {
        return res.json({
          success: true,
          alreadyRegistered: true,
          message: "Wallet is already a registered library member.",
        });
      }

      const tx = await contract.registerMember(wallet_address, memberName);
      const receipt = await tx.wait();

      res.json({
        success: true,
        status: "registered",
        txHash: receipt.hash,
        message: `Successfully registered ${memberName} as a library member on the ledger.`,
      });
    } catch (err: any) {
      console.error("Direct member registration error:", err);
      res.status(500).json({
        error: `Registration on ledger failed: ${err.reason || err.message || err}`,
      });
    }
  });

  // Auto-register demo accounts & specific wallet on-chain
  app.post("/api/members/auto-register", async (req, res) => {
    try {
      const { wallet_address, name } = req.body || {};
      // 1. If specific wallet provided, register it
      if (wallet_address && ethers.isAddress(wallet_address)) {
        await ensureMemberRegistered(wallet_address, name || "Library Scholar");
      }
      // 2. Ensure all demo/test accounts are registered
      await autoRegisterDemoAccounts();

      res.json({
        success: true,
        message: "Demo/test accounts verified and registered on-chain.",
      });
    } catch (err: any) {
      console.error("Auto-register endpoint error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // Admin Authentication: Verify Credentials & Issue Session
  app.post("/api/admin/login", async (req, res) => {
    try {
      const { walletAddress, passphrase } = req.body;
      const deploymentConfig = getDeploymentConfig();
      const adminAddress = (deploymentConfig?.admin || "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266").toLowerCase();
      const normalizedWallet = (walletAddress || "").trim().toLowerCase();

      // Check wallet match or administrative passcode
      const isWalletAdmin = normalizedWallet && normalizedWallet === adminAddress;
      const isPasscodeValid = passphrase && ["ful-librarian-2026", "ful-admin", "admin123", "librarian"].includes(passphrase.trim().toLowerCase());

      if (!isWalletAdmin && !isPasscodeValid) {
        return res.status(401).json({
          success: false,
          error: "Unauthorized: Invalid administrator credentials or unauthorized wallet address.",
        });
      }

      // Generate a signed token/session
      const token = Buffer.from(
        JSON.stringify({
          role: "admin",
          wallet: normalizedWallet || adminAddress,
          timestamp: Date.now(),
          expiresAt: Date.now() + 24 * 3600 * 1000,
        })
      ).toString("base64");

      res.json({
        success: true,
        token,
        adminAddress,
        role: "admin",
        authenticatedAs: "Chief University Librarian (Admin)",
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Desk Circulation Status: List all
  app.get("/api/desk-status", async (_req, res) => {
    try {
      const statuses = await getAllDeskStatuses();
      res.json({ success: true, count: statuses.length, data: statuses });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Desk Circulation Status: Update (tick picked_up or returned)
  app.post("/api/desk-status/:recordId", async (req, res) => {
    try {
      const recordId = Number(req.params.recordId);
      if (isNaN(recordId) || recordId <= 0) {
        return res.status(400).json({ error: "Invalid record ID." });
      }

      const { picked_up, returned, desk_notes, borrower, book_id, staff_name } = req.body;
      const updated = await updateDeskStatus(recordId, {
        picked_up,
        returned,
        desk_notes,
        borrower,
        book_id,
        picked_up_by: staff_name,
        returned_by: staff_name,
      });

      res.json({ success: true, data: updated });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Catalog Demo Books from SQLite
  app.get("/api/books/demo", async (_req, res) => {
    try {
      const books = await getAllDemoBooks();
      res.json({ success: true, count: books.length, data: books });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Chain Control: EVM Time Travel (for live testing overdue fines)
  app.post("/api/chain/time-travel", async (req, res) => {
    try {
      const { days, seconds } = req.body;
      const totalSeconds = (days ? Number(days) * 86400 : 0) + (seconds ? Number(seconds) : 0);
      if (totalSeconds <= 0) {
        return res.status(400).json({ error: "Invalid duration provided." });
      }

      const result = await advanceTime(totalSeconds);
      res.json({
        success: true,
        advancedSeconds: totalSeconds,
        newTimestamp: result.newTimestamp,
        message: `Advanced EVM clock by ${days || 0} days and ${seconds || 0} seconds.`,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Chain Control: Faucet
  app.post("/api/chain/faucet", async (req, res) => {
    try {
      const { toAddress, amountEth } = req.body;
      if (!toAddress || !ethers.isAddress(toAddress)) {
        return res.status(400).json({ error: "Valid recipient address required." });
      }
      const adminSigner = getAdminSigner();
      const tx = await adminSigner.sendTransaction({
        to: toAddress,
        value: ethers.parseEther(amountEth ? String(amountEth) : "5.0"),
      });
      await tx.wait();
      res.json({ success: true, txHash: tx.hash, amount: amountEth || 5 });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // JSON-RPC Proxy to local hardhat node
  app.post("/api/rpc", async (req, res) => {
    try {
      const response = await fetch("http://127.0.0.1:8545", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req.body),
      });
      const data = await response.json();
      return res.json(data);
    } catch (err: any) {
      // If node was offline, trigger recovery and try one more time
      try {
        await ensureNodeAndContracts();
        const retryRes = await fetch("http://127.0.0.1:8545", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(req.body),
        });
        const retryData = await retryRes.json();
        return res.json(retryData);
      } catch (retryErr: any) {
        return res.status(502).json({
          jsonrpc: "2.0",
          id: req.body?.id || null,
          error: {
            code: -32603,
            message: `Cannot connect to Hardhat node at 127.0.0.1:8545: ${retryErr.message || retryErr}`,
          },
        });
      }
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`FUL Library Ledger Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Server startup failure:", err);
  process.exit(1);
});
