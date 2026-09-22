const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("Starting deployment of LibrarySystem...");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying contract with account:", deployer.address);
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH");

  const BORROW_PERIOD_DAYS = 14;
  const FINE_RATE_PER_DAY = ethers.parseUnits("50", "gwei"); // 50 gwei per day

  const LibrarySystemFactory = await ethers.getContractFactory("LibrarySystem");
  const librarySystem = await LibrarySystemFactory.deploy(BORROW_PERIOD_DAYS, FINE_RATE_PER_DAY);
  await librarySystem.waitForDeployment();

  const contractAddress = await librarySystem.getAddress();
  console.log("LibrarySystem deployed successfully to:", contractAddress);

  // Export contract deployment info and ABI for backend and frontend
  const artifactPath = path.join(__dirname, "../artifacts/contracts/LibrarySystem.sol/LibrarySystem.json");
  let artifact = null;
  if (fs.existsSync(artifactPath)) {
    artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
  }

  const deployData = {
    address: contractAddress,
    admin: deployer.address,
    borrowPeriodDays: BORROW_PERIOD_DAYS,
    fineRatePerDay: FINE_RATE_PER_DAY.toString(),
    deployedAt: new Date().toISOString(),
    network: "localhost",
    chainId: 31337,
    abi: artifact ? artifact.abi : []
  };

  const outputDir = path.join(__dirname, "../backend/config");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  fs.writeFileSync(path.join(outputDir, "contract-deployment.json"), JSON.stringify(deployData, null, 2));

  // Also write to frontend src
  const frontendDir = path.join(__dirname, "../src/config");
  if (!fs.existsSync(frontendDir)) {
    fs.mkdirSync(frontendDir, { recursive: true });
  }
  fs.writeFileSync(path.join(frontendDir, "contract-deployment.json"), JSON.stringify(deployData, null, 2));

  console.log("Saved deployment configuration to backend and frontend config directories.");
  return { librarySystem, deployer, contractAddress };
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = main;
