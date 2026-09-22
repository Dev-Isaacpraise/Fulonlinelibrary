import { spawn, exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

let hardhatProcess: any = null;
let isStarting = false;

export async function isNodeRunning(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1000);
    const res = await fetch("http://127.0.0.1:8545", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "eth_blockNumber",
        params: [],
        id: 1,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) return false;
    const data = await res.json();
    return Boolean(data && data.jsonrpc === "2.0" && data.result !== undefined);
  } catch {
    return false;
  }
}

export async function isContractDeployed(contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3"): Promise<boolean> {
  try {
    const res = await fetch("http://127.0.0.1:8545", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "eth_getCode",
        params: [contractAddress, "latest"],
        id: 2,
      }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    return Boolean(data.result && data.result !== "0x" && data.result !== "0x0");
  } catch {
    return false;
  }
}

export async function ensureNodeAndContracts(): Promise<void> {
  if (isStarting) return;
  isStarting = true;

  try {
    let running = await isNodeRunning();
    if (!running) {
      console.log("[NodeManager] Hardhat node not detected on 127.0.0.1:8545. Spawning node...");
      
      // Spawn hardhat node process
      hardhatProcess = spawn("npx", ["hardhat", "node", "--hostname", "127.0.0.1", "--port", "8545"], {
        stdio: ["ignore", "pipe", "pipe"],
        detached: false,
      });

      hardhatProcess.stdout?.on("data", (chunk: Buffer) => {
        const msg = chunk.toString();
        if (msg.includes("Started HTTP and WebSocket JSON-RPC server")) {
          console.log("[NodeManager] Hardhat JSON-RPC node is now online.");
        }
      });

      hardhatProcess.stderr?.on("data", (chunk: Buffer) => {
        console.warn("[NodeManager Error]", chunk.toString().trim());
      });

      hardhatProcess.on("exit", (code: number) => {
        console.log(`[NodeManager] Hardhat process exited with code ${code}`);
        hardhatProcess = null;
      });

      // Poll until node is ready (up to 15 seconds)
      const startTime = Date.now();
      while (Date.now() - startTime < 15000) {
        await new Promise((r) => setTimeout(r, 600));
        running = await isNodeRunning();
        if (running) break;
      }

      if (!running) {
        console.error("[NodeManager] Failed to start Hardhat node within 15 seconds.");
        return;
      }
    }

    // Now check if contract is deployed
    const deployed = await isContractDeployed();
    if (!deployed) {
      console.log("[NodeManager] Contract not found on chain. Executing automated seed script...");
      try {
        const { stdout, stderr } = await execAsync(
          "npx hardhat run scripts/seed.cjs --network localhost --config hardhat.config.cjs"
        );
        console.log("[NodeManager] Seed output:\n" + stdout);
        if (stderr) console.warn("[NodeManager Seed Stderr]:", stderr);
      } catch (err: any) {
        console.error("[NodeManager] Error during seed script:", err.message || err);
      }
    } else {
      console.log("[NodeManager] Contract is already deployed and active on 127.0.0.1:8545.");
    }
  } catch (err: any) {
    console.error("[NodeManager] Error in ensureNodeAndContracts:", err.message || err);
  } finally {
    isStarting = false;
  }
}

// Clean up child process on exit
process.on("SIGINT", () => {
  if (hardhatProcess) {
    try {
      hardhatProcess.kill("SIGTERM");
    } catch {}
  }
  process.exit(0);
});

process.on("SIGTERM", () => {
  if (hardhatProcess) {
    try {
      hardhatProcess.kill("SIGTERM");
    } catch {}
  }
  process.exit(0);
});
