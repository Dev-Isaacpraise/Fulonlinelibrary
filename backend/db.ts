import initSqlJs, { Database, SqlJsStatic } from "sql.js";
import fs from "fs";
import path from "path";
import crypto from "crypto";

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

let dbInstance: Database | null = null;
const dbFilePath = path.join(process.cwd(), "backend", "data", "identity.sqlite");

export async function getDatabase(): Promise<Database> {
  if (dbInstance) return dbInstance;

  const SQL: SqlJsStatic = await initSqlJs();
  const dir = path.dirname(dbFilePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  if (fs.existsSync(dbFilePath)) {
    try {
      const fileBuffer = fs.readFileSync(dbFilePath);
      dbInstance = new SQL.Database(fileBuffer);
    } catch (e) {
      console.warn("Could not read existing SQLite database, creating new one:", e);
      dbInstance = new SQL.Database();
    }
  } else {
    dbInstance = new SQL.Database();
  }

  // Create table
  dbInstance.run(`
    CREATE TABLE IF NOT EXISTS member_identities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      wallet_address TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      faculty TEXT NOT NULL,
      matric_hash TEXT NOT NULL,
      record_salt TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at INTEGER NOT NULL,
      tx_hash TEXT,
      rejection_reason TEXT
    );

    CREATE TABLE IF NOT EXISTS book_desk_status (
      record_id INTEGER PRIMARY KEY,
      book_id INTEGER NOT NULL,
      borrower TEXT NOT NULL,
      picked_up INTEGER NOT NULL DEFAULT 0,
      picked_up_at INTEGER,
      picked_up_by TEXT,
      returned INTEGER NOT NULL DEFAULT 0,
      returned_at INTEGER,
      returned_by TEXT,
      desk_notes TEXT,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS library_catalog_books (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      author TEXT NOT NULL,
      category TEXT NOT NULL,
      shelf_location TEXT NOT NULL,
      synopsis TEXT,
      year INTEGER,
      isbn TEXT
    );
  `);

  // Seed sample records if empty
  const countRes = dbInstance.exec("SELECT COUNT(*) as count FROM member_identities;");
  const count = (countRes[0]?.values[0]?.[0] as number) || 0;
  if (count === 0) {
    seedInitialIdentities(dbInstance);
  }

  // Seed desk statuses if empty
  const deskCountRes = dbInstance.exec("SELECT COUNT(*) as count FROM book_desk_status;");
  const deskCount = (deskCountRes[0]?.values[0]?.[0] as number) || 0;
  if (deskCount === 0) {
    seedInitialDeskStatuses(dbInstance);
  }

  // Seed extra demo books if empty
  const booksCountRes = dbInstance.exec("SELECT COUNT(*) as count FROM library_catalog_books;");
  const booksCount = (booksCountRes[0]?.values[0]?.[0] as number) || 0;
  if (booksCount === 0) {
    seedDemoBooks(dbInstance);
  }

  saveDatabase(dbInstance);
  return dbInstance;
}

function saveDatabase(db: Database) {
  try {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbFilePath, buffer);
  } catch (err) {
    console.error("Error saving SQLite database:", err);
  }
}

function hashMatricWithSalt(matricNumber: string, salt: string): string {
  return crypto
    .createHash("sha256")
    .update(matricNumber.trim().toUpperCase() + salt)
    .digest("hex");
}

function seedInitialIdentities(db: Database) {
  const initialData = [
    {
      wallet: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
      name: "Amina Bello",
      faculty: "Faculty of Science (Computer Science)",
      matric: "FUL/SCI/22/0101",
      status: "approved",
      tx_hash: "0x4a7f29c18d6e7f123b01a2d5e4b7c89f10a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6",
    },
    {
      wallet: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
      name: "Emeka Eze",
      faculty: "Faculty of Science (Mathematics)",
      matric: "FUL/SCI/22/0455",
      status: "approved",
      tx_hash: "0x5b8a30d29e7f8a234c12b3e6f5c8d9a01b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7",
    },
    {
      wallet: "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
      name: "Fatima Danjuma",
      faculty: "Faculty of Arts & Social Sciences (Economics)",
      matric: "FUL/ART/21/0890",
      status: "approved",
      tx_hash: "0x6c9b41e30f8a9b345d23c4f7a6d9e0b12c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8",
    },
    {
      wallet: "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65",
      name: "Tunde Bakare",
      faculty: "Faculty of Engineering",
      matric: "FUL/ENG/23/0014",
      status: "approved",
      tx_hash: "0x7d0c52f41a9b0c456e34d5a8b7e0f1c23d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9",
    },
    {
      wallet: "0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc",
      name: "Khadijah Musa",
      faculty: "Faculty of Science (Physics)",
      matric: "FUL/SCI/24/0932",
      status: "pending",
      tx_hash: null,
    },
    {
      wallet: "0x976EA74026E726554dB657fA54763abd0C3a0aa9",
      name: "Ibrahim Sadiq",
      faculty: "Faculty of Arts & Humanities (History)",
      matric: "FUL/ART/23/0411",
      status: "pending",
      tx_hash: null,
    },
  ];

  const now = Date.now();
  for (const item of initialData) {
    const salt = crypto.randomBytes(16).toString("hex");
    const matricHash = hashMatricWithSalt(item.matric, salt);

    db.run(
      `INSERT INTO member_identities (wallet_address, name, faculty, matric_hash, record_salt, status, created_at, tx_hash)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        item.wallet.toLowerCase(),
        item.name,
        item.faculty,
        matricHash,
        salt,
        item.status,
        now - Math.floor(Math.random() * 86400000),
        item.tx_hash,
      ]
    );
  }
}

export async function submitIdentityRegistration(params: {
  wallet_address: string;
  name: string;
  faculty: string;
  matric_number: string;
}): Promise<{ success: boolean; id?: number; error?: string }> {
  const db = await getDatabase();
  const normalizedWallet = params.wallet_address.trim().toLowerCase();

  // Check duplicate wallet
  const checkStmt = db.prepare(
    "SELECT id, status FROM member_identities WHERE LOWER(wallet_address) = ?;"
  );
  checkStmt.bind([normalizedWallet]);
  if (checkStmt.step()) {
    const row = checkStmt.getAsObject();
    checkStmt.free();
    return {
      success: false,
      error: `A registration for this wallet already exists (status: ${row.status}). Duplicate submissions are blocked.`,
    };
  }
  checkStmt.free();

  const salt = crypto.randomBytes(16).toString("hex");
  const matricHash = hashMatricWithSalt(params.matric_number, salt);
  const now = Date.now();

  db.run(
    `INSERT INTO member_identities (wallet_address, name, faculty, matric_hash, record_salt, status, created_at)
     VALUES (?, ?, ?, ?, ?, 'pending', ?);`,
    [normalizedWallet, params.name.trim(), params.faculty.trim(), matricHash, salt, now]
  );

  saveDatabase(db);

  // Get inserted id
  const lastIdRes = db.exec("SELECT last_insert_rowid() as id;");
  const id = lastIdRes[0]?.values[0]?.[0] as number;

  return { success: true, id };
}

export async function getPendingRegistrations(): Promise<PendingRegistration[]> {
  const db = await getDatabase();
  const res = db.exec(
    "SELECT id, wallet_address, name, faculty, matric_hash, record_salt, status, created_at, tx_hash, rejection_reason FROM member_identities WHERE status = 'pending' ORDER BY created_at ASC;"
  );
  if (!res[0]) return [];
  return res[0].values.map((v: any[]) => ({
    id: v[0] as number,
    wallet_address: v[1] as string,
    name: v[2] as string,
    faculty: v[3] as string,
    matric_hash: v[4] as string,
    record_salt: v[5] as string,
    status: v[6] as "pending" | "approved" | "rejected",
    created_at: v[7] as number,
    tx_hash: v[8] as string | null,
    rejection_reason: v[9] as string | null,
  }));
}

export async function getAllRegistrations(): Promise<PendingRegistration[]> {
  const db = await getDatabase();
  const res = db.exec(
    "SELECT id, wallet_address, name, faculty, matric_hash, record_salt, status, created_at, tx_hash, rejection_reason FROM member_identities ORDER BY created_at DESC;"
  );
  if (!res[0]) return [];
  return res[0].values.map((v: any[]) => ({
    id: v[0] as number,
    wallet_address: v[1] as string,
    name: v[2] as string,
    faculty: v[3] as string,
    matric_hash: v[4] as string,
    record_salt: v[5] as string,
    status: v[6] as "pending" | "approved" | "rejected",
    created_at: v[7] as number,
    tx_hash: v[8] as string | null,
    rejection_reason: v[9] as string | null,
  }));
}

export async function getRegistrationByWallet(wallet: string): Promise<PendingRegistration | null> {
  const db = await getDatabase();
  const stmt = db.prepare(
    "SELECT id, wallet_address, name, faculty, matric_hash, record_salt, status, created_at, tx_hash, rejection_reason FROM member_identities WHERE LOWER(wallet_address) = ?;"
  );
  stmt.bind([wallet.trim().toLowerCase()]);
  if (stmt.step()) {
    const row = stmt.getAsObject() as any;
    stmt.free();
    return {
      id: row.id,
      wallet_address: row.wallet_address,
      name: row.name,
      faculty: row.faculty,
      matric_hash: row.matric_hash,
      record_salt: row.record_salt,
      status: row.status,
      created_at: row.created_at,
      tx_hash: row.tx_hash,
      rejection_reason: row.rejection_reason,
    };
  }
  stmt.free();
  return null;
}

export async function updateRegistrationStatus(
  id: number,
  status: "approved" | "rejected",
  tx_hash?: string,
  rejection_reason?: string
): Promise<boolean> {
  const db = await getDatabase();
  db.run(
    "UPDATE member_identities SET status = ?, tx_hash = ?, rejection_reason = ? WHERE id = ?;",
    [status, tx_hash || null, rejection_reason || null, id]
  );
  saveDatabase(db);
  return true;
}

function seedInitialDeskStatuses(db: Database) {
  const now = Math.floor(Date.now() / 1000);
  const initialDesk = [
    {
      record_id: 1,
      book_id: 1,
      borrower: "0x90f79bf6eb2c4f870365e785982e1f101e93b906",
      picked_up: 1,
      picked_up_at: now - 18 * 86400,
      picked_up_by: "Circulation Desk Staff",
      returned: 1,
      returned_at: now - 4 * 86400,
      returned_by: "Circulation Desk Staff",
      desk_notes: "Physical volume verified in pristine condition upon return.",
      updated_at: now - 4 * 86400,
    },
    {
      record_id: 2,
      book_id: 2,
      borrower: "0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc",
      picked_up: 1,
      picked_up_at: now - 5 * 86400,
      picked_up_by: "Desk Officer B",
      returned: 0,
      returned_at: null,
      returned_by: null,
      desk_notes: "Picked up at Central Circulation Desk. Reading on campus.",
      updated_at: now - 5 * 86400,
    },
    {
      record_id: 3,
      book_id: 3,
      borrower: "0x70997970c51812dc3a010c7d01b50e0d17dc79c8",
      picked_up: 1,
      picked_up_at: now - 20 * 86400,
      picked_up_by: "Desk Officer A",
      returned: 0,
      returned_at: null,
      returned_by: null,
      desk_notes: "Overdue loan notice sent to student email.",
      updated_at: now - 1 * 86400,
    },
    {
      record_id: 4,
      book_id: 4,
      borrower: "0x70997970c51812dc3a010c7d01b50e0d17dc79c8",
      picked_up: 0,
      picked_up_at: null,
      picked_up_by: null,
      returned: 0,
      returned_at: null,
      returned_by: null,
      desk_notes: "Reserved via smart contract. Awaiting physical desk pickup.",
      updated_at: now,
    },
  ];

  for (const d of initialDesk) {
    db.run(
      `INSERT INTO book_desk_status (record_id, book_id, borrower, picked_up, picked_up_at, picked_up_by, returned, returned_at, returned_by, desk_notes, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        d.record_id,
        d.book_id,
        d.borrower.toLowerCase(),
        d.picked_up,
        d.picked_up_at,
        d.picked_up_by,
        d.returned,
        d.returned_at,
        d.returned_by,
        d.desk_notes,
        d.updated_at,
      ]
    );
  }
}

function seedDemoBooks(db: Database) {
  const books = [
    {
      title: "Things Fall Apart (Scholarly Edition)",
      author: "Chinua Achebe",
      category: "African Literature",
      shelf_location: "Section AFR-201",
      synopsis: "The landmark narrative depicting pre-colonial Igbo society and European arrival.",
      year: 1958,
      isbn: "978-0385474542",
    },
    {
      title: "The Lion and the Jewel: Critical Perspectives",
      author: "Wole Soyinka",
      category: "Dramatic Arts",
      shelf_location: "Section AFR-314",
      synopsis: "Classic comedy of courtship between traditional village life and modern westernization.",
      year: 1963,
      isbn: "978-0199110834",
    },
    {
      title: "Nigerian Constitutional Law and Practice",
      author: "Prof. Itse Sagay, SAN",
      category: "Law & Jurisprudence",
      shelf_location: "Section LAW-104",
      synopsis: "Comprehensive treatise on judicial interpretation of the 1999 Nigerian Constitution.",
      year: 2018,
      isbn: "978-9781352431",
    },
    {
      title: "Principles of Modern Nigerian Commercial Law",
      author: "M. C. Okany",
      category: "Law & Jurisprudence",
      shelf_location: "Section LAW-215",
      synopsis: "In-depth treatment of sale of goods, agency, hire purchase, and banking law.",
      year: 2020,
      isbn: "978-9788448123",
    },
    {
      title: "Essential Pathology for Clinical Medical Students",
      author: "Prof. S. E. Asuquo & Dr. O. Bello",
      category: "Health & Medicine",
      shelf_location: "Section MED-402",
      synopsis: "Fundamental cellular injury, immunology, and organ system pathologies.",
      year: 2021,
      isbn: "978-9789234812",
    },
    {
      title: "Renewable Energy Systems & Microgrids for West Africa",
      author: "Engr. T. O. Balogun",
      category: "Engineering",
      shelf_location: "Section ENG-502",
      synopsis: "Solar PV, wind, and hybrid off-grid electrification design in tropical conditions.",
      year: 2022,
      isbn: "978-9780876541",
    },
    {
      title: "Cybersecurity Protocols & Threat Modeling",
      author: "Dr. Aminu Garba",
      category: "Computer Science",
      shelf_location: "Section CMP-412",
      synopsis: "Zero-trust network architectures, cryptography, and penetration defense.",
      year: 2023,
      isbn: "978-1119782341",
    },
    {
      title: "Data Science and Predictive Analytics with Python",
      author: "Jake VanderPlas & FUL Faculty",
      category: "Computer Science",
      shelf_location: "Section CMP-305",
      synopsis: "Statistical computation, machine learning pipelines, and data exploration.",
      year: 2023,
      isbn: "978-1491957660",
    },
    {
      title: "Public Health & Epidemiology in Tropical Regions",
      author: "Dr. Halima Sani",
      category: "Health & Medicine",
      shelf_location: "Section MED-108",
      synopsis: "Vector-borne disease dynamics, prevention campaigns, and biostatistics.",
      year: 2022,
      isbn: "978-9783419082",
    },
    {
      title: "Half of a Yellow Sun: Post-Colonial Analysis",
      author: "Chimamanda Ngozi Adichie",
      category: "African Literature",
      shelf_location: "Section AFR-220",
      synopsis: "Emotional and historical investigation of the Nigerian Civil War.",
      year: 2006,
      isbn: "978-1400095209",
    },
    {
      title: "Digital Forensics and Incident Response (3rd Edition)",
      author: "Gerard Johansen",
      category: "Computer Science",
      shelf_location: "Section CMP-430",
      synopsis: "Forensic memory extraction, evidence acquisition, and reverse malware triage.",
      year: 2022,
      isbn: "978-1803247564",
    },
    {
      title: "Discrete Optimization and Network Flow Algorithms",
      author: "Prof. Uche Okoro",
      category: "Mathematics",
      shelf_location: "Section MTH-310",
      synopsis: "Graph algorithms, combinatorial duality, and network simplex methods.",
      year: 2021,
      isbn: "978-9785412903",
    },
  ];

  for (const b of books) {
    db.run(
      `INSERT INTO library_catalog_books (title, author, category, shelf_location, synopsis, year, isbn)
       VALUES (?, ?, ?, ?, ?, ?, ?);`,
      [b.title, b.author, b.category, b.shelf_location, b.synopsis, b.year, b.isbn]
    );
  }
}

export async function getAllDeskStatuses(): Promise<DeskCirculationStatus[]> {
  const db = await getDatabase();
  const res = db.exec(
    "SELECT record_id, book_id, borrower, picked_up, picked_up_at, picked_up_by, returned, returned_at, returned_by, desk_notes, updated_at FROM book_desk_status ORDER BY record_id ASC;"
  );
  if (!res[0]) return [];
  return res[0].values.map((v: any[]) => ({
    record_id: v[0] as number,
    book_id: v[1] as number,
    borrower: v[2] as string,
    picked_up: Boolean(v[3]),
    picked_up_at: v[4] as number | null,
    picked_up_by: v[5] as string | null,
    returned: Boolean(v[6]),
    returned_at: v[7] as number | null,
    returned_by: v[8] as string | null,
    desk_notes: v[9] as string | null,
    updated_at: v[10] as number,
  }));
}

export async function getDeskStatus(recordId: number): Promise<DeskCirculationStatus | null> {
  const db = await getDatabase();
  const stmt = db.prepare(
    "SELECT record_id, book_id, borrower, picked_up, picked_up_at, picked_up_by, returned, returned_at, returned_by, desk_notes, updated_at FROM book_desk_status WHERE record_id = ?;"
  );
  stmt.bind([recordId]);
  if (stmt.step()) {
    const row = stmt.getAsObject() as any;
    stmt.free();
    return {
      record_id: row.record_id,
      book_id: row.book_id,
      borrower: row.borrower,
      picked_up: Boolean(row.picked_up),
      picked_up_at: row.picked_up_at,
      picked_up_by: row.picked_up_by,
      returned: Boolean(row.returned),
      returned_at: row.returned_at,
      returned_by: row.returned_by,
      desk_notes: row.desk_notes,
      updated_at: row.updated_at,
    };
  }
  stmt.free();
  return null;
}

export async function updateDeskStatus(
  recordId: number,
  data: Partial<DeskCirculationStatus>
): Promise<DeskCirculationStatus> {
  const db = await getDatabase();
  const existing = await getDeskStatus(recordId);
  const now = Math.floor(Date.now() / 1000);

  if (existing) {
    const picked_up = data.picked_up !== undefined ? (data.picked_up ? 1 : 0) : (existing.picked_up ? 1 : 0);
    const picked_up_at = data.picked_up ? (data.picked_up_at || now) : (data.picked_up === false ? null : existing.picked_up_at);
    const picked_up_by = data.picked_up_by !== undefined ? data.picked_up_by : existing.picked_up_by;

    const returned = data.returned !== undefined ? (data.returned ? 1 : 0) : (existing.returned ? 1 : 0);
    const returned_at = data.returned ? (data.returned_at || now) : (data.returned === false ? null : existing.returned_at);
    const returned_by = data.returned_by !== undefined ? data.returned_by : existing.returned_by;

    const desk_notes = data.desk_notes !== undefined ? data.desk_notes : existing.desk_notes;

    db.run(
      `UPDATE book_desk_status SET
        picked_up = ?, picked_up_at = ?, picked_up_by = ?,
        returned = ?, returned_at = ?, returned_by = ?,
        desk_notes = ?, updated_at = ?
       WHERE record_id = ?;`,
      [
        picked_up ?? 0,
        picked_up_at ?? null,
        picked_up_by ?? null,
        returned ?? 0,
        returned_at ?? null,
        returned_by ?? null,
        desk_notes ?? null,
        now,
        recordId,
      ]
    );
  } else {
    db.run(
      `INSERT INTO book_desk_status (record_id, book_id, borrower, picked_up, picked_up_at, picked_up_by, returned, returned_at, returned_by, desk_notes, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        recordId,
        data.book_id || 1,
        (data.borrower || "0x00").toLowerCase(),
        data.picked_up ? 1 : 0,
        data.picked_up ? (data.picked_up_at || now) : null,
        data.picked_up_by || "Desk Staff",
        data.returned ? 1 : 0,
        data.returned ? (data.returned_at || now) : null,
        data.returned_by || null,
        data.desk_notes || "Logged at circulation desk.",
        now,
      ]
    );
  }

  saveDatabase(db);
  return (await getDeskStatus(recordId))!;
}

export async function getAllDemoBooks(): Promise<DemoBookItem[]> {
  const db = await getDatabase();
  const res = db.exec(
    "SELECT id, title, author, category, shelf_location, synopsis, year, isbn FROM library_catalog_books ORDER BY id ASC;"
  );
  if (!res[0]) return [];
  return res[0].values.map((v: any[]) => ({
    id: v[0] as number,
    title: v[1] as string,
    author: v[2] as string,
    category: v[3] as string,
    shelf_location: v[4] as string,
    synopsis: v[5] as string,
    year: v[6] as number,
    isbn: v[7] as string,
  }));
}
