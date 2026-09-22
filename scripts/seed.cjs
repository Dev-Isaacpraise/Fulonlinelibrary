const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const fs = require("fs");
const path = require("path");

const BOOKS = [
  { title: "Introduction to Algorithms (4th Edition)", author: "Thomas H. Cormen, Charles E. Leiserson, Ronald L. Rivest, Clifford Stein" },
  { title: "Database System Concepts (7th Edition)", author: "Abraham Silberschatz, Henry F. Korth, S. Sudarshan" },
  { title: "Computer Networking: A Top-Down Approach", author: "James F. Kurose, Keith W. Ross" },
  { title: "Modern Operating Systems (5th Edition)", author: "Andrew S. Tanenbaum, Herbert Bos" },
  { title: "Clean Architecture: A Craftsman's Guide", author: "Robert C. Martin" },
  { title: "Artificial Intelligence: A Modern Approach", author: "Stuart Russell, Peter Norvig" },
  { title: "Designing Data-Intensive Applications", author: "Martin Kleppmann" },
  { title: "Structure and Interpretation of Computer Programs", author: "Harold Abelson, Gerald Jay Sussman" },
  { title: "Compilers: Principles, Techniques, and Tools", author: "Alfred V. Aho, Monica S. Lam, Ravi Sethi, Jeffrey D. Ullman" },
  { title: "Introduction to the Theory of Computation", author: "Michael Sipser" },
  { title: "Fundamentals of Software Engineering", author: "Carlo Ghezzi, Mehdi Jazayeri, Dino Mandrioli" },
  { title: "Digital Logic and Computer Design", author: "M. Morris Mano" },
  { title: "Blockchain Basics: A Non-Technical Introduction", author: "Daniel Drescher" },
  { title: "Mastering Ethereum: Building Smart Contracts", author: "Andreas M. Antonopoulos, Gavin Wood" },
  { title: "Principles of Distributed Database Systems", author: "M. Tamer Özsu, Patrick Valduriez" },
  { title: "Discrete Mathematics and Its Applications", author: "Kenneth H. Rosen" },
  { title: "Engineering Mathematics (8th Edition)", author: "K.A. Stroud, Dexter J. Booth" },
  { title: "Research Methodology: Methods and Techniques", author: "C.R. Kothari, Gaurav Garg" },
  { title: "Introduction to Cryptography with Coding Theory", author: "Wade Trappe, Lawrence C. Washington" },
  { title: "Patterns of Enterprise Application Architecture", author: "Martin Fowler" },
  { title: "Things Fall Apart (Scholarly Edition)", author: "Chinua Achebe" },
  { title: "The Lion and the Jewel: Critical Perspectives", author: "Wole Soyinka" },
  { title: "Nigerian Constitutional Law and Practice", author: "Prof. Itse Sagay, SAN" },
  { title: "Principles of Modern Nigerian Commercial Law", author: "M. C. Okany" },
  { title: "Essential Pathology for Clinical Medical Students", author: "Prof. S. E. Asuquo & Dr. O. Bello" },
  { title: "Renewable Energy Systems & Microgrids for West Africa", author: "Engr. T. O. Balogun" },
  { title: "Cybersecurity Protocols & Threat Modeling", author: "Dr. Aminu Garba" },
  { title: "Data Science and Predictive Analytics with Python", author: "Jake VanderPlas & FUL Faculty" },
  { title: "Public Health & Epidemiology in Tropical Regions", author: "Dr. Halima Sani" },
  { title: "Half of a Yellow Sun: Post-Colonial Analysis", author: "Chimamanda Ngozi Adichie" },
  { title: "Digital Forensics and Incident Response (3rd Edition)", author: "Gerard Johansen" },
  { title: "Discrete Optimization and Network Flow Algorithms", author: "Prof. Uche Okoro" },
  { title: "Macroeconomics: Theories and Nigerian Perspectives", author: "Dr. A. O. Olaniyi" },
  { title: "Soil Mechanics and Foundation Engineering", author: "Dr. B. C. Punmia" },
  { title: "Organic Chemistry: Structure and Function", author: "K. Peter C. Vollhardt, Neil E. Schore" }
];

async function main() {
  console.log("Seeding library system data on Hardhat network...");

  const signers = await ethers.getSigners();
  const admin = signers[0];
  const student1 = signers[1]; // Amina Bello (overdue loan)
  const student2 = signers[2]; // Emeka Eze (active on-time loan)
  const student3 = signers[3]; // Fatima Danjuma (returned loan)
  const student4 = signers[4]; // Tunde Bakare (registered, 0 borrows)

  // Deploy fresh if not already deployed
  const BORROW_PERIOD_DAYS = 14;
  const FINE_RATE_PER_DAY = ethers.parseUnits("50", "gwei");

  const LibrarySystemFactory = await ethers.getContractFactory("LibrarySystem");
  const librarySystem = await LibrarySystemFactory.deploy(BORROW_PERIOD_DAYS, FINE_RATE_PER_DAY);
  await librarySystem.waitForDeployment();
  const contractAddress = await librarySystem.getAddress();

  console.log("Contract deployed to:", contractAddress);
  console.log("Admin:", admin.address);

  // 1. Add all 20 books
  console.log("Adding 20 realistic academic books...");
  for (let i = 0; i < BOOKS.length; i++) {
    const tx = await librarySystem.connect(admin).addBook(BOOKS[i].title, BOOKS[i].author);
    await tx.wait();
  }
  console.log("20 books added.");

  // 2. Register students
  console.log("Registering students on-chain...");
  await (await librarySystem.connect(admin).registerMember(student1.address, "Amina Bello")).wait();
  await (await librarySystem.connect(admin).registerMember(student2.address, "Emeka Eze")).wait();
  await (await librarySystem.connect(admin).registerMember(student3.address, "Fatima Danjuma")).wait();
  await (await librarySystem.connect(admin).registerMember(student4.address, "Tunde Bakare")).wait();
  console.log("4 students registered.");

  // 3. Loans setup
  // Student 3 borrows book #1 and returns it cleanly
  console.log("Creating returned loan for Student 3 (Book 1)...");
  await (await librarySystem.connect(student3).borrowBook(1)).wait();
  await (await librarySystem.connect(student3).returnBook(1)).wait();

  // Student 2 borrows book #2 (active on-time loan)
  console.log("Creating active on-time loan for Student 2 (Book 2)...");
  await (await librarySystem.connect(student2).borrowBook(2)).wait();

  // Student 1 borrows book #3 (which will become overdue to demo fines)
  console.log("Creating loan for Student 1 (Book 3)...");
  await (await librarySystem.connect(student1).borrowBook(3)).wait();

  // Student 1 also borrows book #4 (second active loan)
  await (await librarySystem.connect(student1).borrowBook(4)).wait();

  // 4. Advance time using evm_increaseTime to make Book 3 overdue by 4 days!
  // Allowed period: 14 days. Advance by 18 days (18 * 86400).
  console.log("Advancing EVM time by 18 days (14 days period + 4 days overdue) via evm_increaseTime...");
  await ethers.provider.send("evm_increaseTime", [18 * 86400]);
  await ethers.provider.send("evm_mine", []);

  console.log("EVM time advanced successfully. Checking live fine for record 3...");
  const liveFine = await librarySystem.estimateLiveFine(3);
  console.log(`Record #3 live overdue fine: ${ethers.formatUnits(liveFine, "gwei")} gwei (${liveFine.toString()} wei)`);

  // Export deployment & accounts info
  const artifactPath = path.join(__dirname, "../artifacts/contracts/LibrarySystem.sol/LibrarySystem.json");
  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));

  const seedResult = {
    address: contractAddress,
    admin: admin.address,
    borrowPeriodDays: BORROW_PERIOD_DAYS,
    fineRatePerDay: FINE_RATE_PER_DAY.toString(),
    deployedAt: new Date().toISOString(),
    network: "localhost",
    chainId: 31337,
    abi: artifact.abi,
    sampleAccounts: [
      { role: "admin", name: "Chief Librarian (Deployer)", address: admin.address, privateKey: "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80" },
      { role: "member", name: "Amina Bello", address: student1.address, privateKey: "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d", status: "Overdue Loan (4 days overdue on Book 3)" },
      { role: "member", name: "Emeka Eze", address: student2.address, privateKey: "0x5de4111afa1a4b94908f83103eb2f953b0833058b263635271a30a8a44800334", status: "Active Loan (Book 2)" },
      { role: "member", name: "Fatima Danjuma", address: student3.address, privateKey: "0x7c852118294e51e653712a77e0e3e7f1e29c8e100808a8f15e85c21961ee48b0", status: "Completed Return (Book 1)" },
      { role: "member", name: "Tunde Bakare", address: student4.address, privateKey: "0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a", status: "Registered (0 active loans)" }
    ]
  };

  const backendCfg = path.join(__dirname, "../backend/config");
  if (!fs.existsSync(backendCfg)) fs.mkdirSync(backendCfg, { recursive: true });
  fs.writeFileSync(path.join(backendCfg, "contract-deployment.json"), JSON.stringify(seedResult, null, 2));

  const frontendCfg = path.join(__dirname, "../src/config");
  if (!fs.existsSync(frontendCfg)) fs.mkdirSync(frontendCfg, { recursive: true });
  fs.writeFileSync(path.join(frontendCfg, "contract-deployment.json"), JSON.stringify(seedResult, null, 2));

  console.log("Seeding complete! Data exported to backend/config and src/config.");
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
