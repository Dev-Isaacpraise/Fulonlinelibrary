import { ethers } from "ethers";
import fs from "fs";
import path from "path";

const RPC_URL = process.env.HARDHAT_RPC_URL || "http://127.0.0.1:8545";

export function getDeploymentConfig() {
  const cfgPath = path.join(process.cwd(), "backend", "config", "contract-deployment.json");
  if (fs.existsSync(cfgPath)) {
    return JSON.parse(fs.readFileSync(cfgPath, "utf8"));
  }
  // Fallback to artifacts if needed
  const artifactPath = path.join(
    process.cwd(),
    "artifacts",
    "contracts",
    "LibrarySystem.sol",
    "LibrarySystem.json"
  );
  let abi = [];
  if (fs.existsSync(artifactPath)) {
    abi = JSON.parse(fs.readFileSync(artifactPath, "utf8")).abi;
  }
  return {
    address: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
    admin: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    borrowPeriodDays: 14,
    fineRatePerDay: "50000000000",
    abi,
    sampleAccounts: []
  };
}

export function getProvider() {
  return new ethers.JsonRpcProvider(
    RPC_URL,
    { chainId: 31337, name: "localhost" },
    { staticNetwork: true }
  );
}

export function getAdminSigner() {
  const provider = getProvider();
  // Hardhat default Account #0 private key
  const adminKey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
  return new ethers.Wallet(adminKey, provider);
}

export function getContractInstance(signerOrProvider?: ethers.Signer | ethers.Provider) {
  const config = getDeploymentConfig();
  const provider = signerOrProvider || getProvider();
  return new ethers.Contract(config.address, config.abi, provider);
}

export async function advanceTime(seconds: number): Promise<{ success: boolean; newTimestamp: number }> {
  const provider = getProvider();
  await provider.send("evm_increaseTime", [seconds]);
  await provider.send("evm_mine", []);
  const block = await provider.getBlock("latest");
  return { success: true, newTimestamp: block?.timestamp || Date.now() / 1000 };
}

export const DEMO_ACCOUNTS = [
  { name: "Chief Librarian (Admin)", address: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266" },
  { name: "Amina Bello", address: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8" },
  { name: "Emeka Eze", address: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC" },
  { name: "Fatima Danjuma", address: "0x90F79bf6EB2c4f870365E785982E1f101E93b906" },
  { name: "Tunde Bakare", address: "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65" },
  { name: "Chinedu Okafor", address: "0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc" },
  { name: "Zainab Aliyu", address: "0x976EA74026E726554dB657fA54763abd0C3a0aa9" },
  { name: "Babatunde Adeleke", address: "0x14dC79964da2C08b23698B3D3cc7Ca32193d9955" },
  { name: "Ngozi Nnamdi", address: "0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f" },
  { name: "Ibrahim Musa", address: "0xa0Ee7A142d267C1f36714E4a8F75612F20a79720" },
];

export async function ensureMemberRegistered(address: string, name = "Library Scholar"): Promise<boolean> {
  try {
    const adminSigner = getAdminSigner();
    const contract = getContractInstance(adminSigner);
    const details = await contract.getMemberDetails(address);
    if (details[0]) {
      return true; // Already registered
    }
    const tx = await contract.registerMember(address, name);
    await tx.wait();
    console.log(`[ChainService] Registered member on-chain: ${address} (${name})`);
    return true;
  } catch (err: any) {
    console.warn(`[ChainService] Could not auto-register ${address}:`, err.message || err);
    return false;
  }
}

export async function autoRegisterDemoAccounts(): Promise<void> {
  try {
    const adminSigner = getAdminSigner();
    const contract = getContractInstance(adminSigner);

    // Get sample accounts from config if present
    const config = getDeploymentConfig();
    const accountsToRegister = [...DEMO_ACCOUNTS];
    if (config?.sampleAccounts && Array.isArray(config.sampleAccounts)) {
      for (const sa of config.sampleAccounts) {
        if (sa.address && !accountsToRegister.some(a => a.address.toLowerCase() === sa.address.toLowerCase())) {
          accountsToRegister.push({ name: sa.name || "Student Scholar", address: sa.address });
        }
      }
    }

    console.log(`[ChainService] Verifying auto-registration for ${accountsToRegister.length} demo/test accounts...`);
    for (const acc of accountsToRegister) {
      try {
        const details = await contract.getMemberDetails(acc.address);
        if (!details[0]) {
          const tx = await contract.registerMember(acc.address, acc.name);
          await tx.wait();
          console.log(`[ChainService] Auto-registered demo account: ${acc.name} (${acc.address})`);
        }
      } catch (err: any) {
        // Continue with next account
      }
    }
  } catch (e: any) {
    console.warn("[ChainService] Auto-register demo accounts skipped or failed:", e.message || e);
  }
}
