import Database from "better-sqlite3";
import { SEEDS } from "../src/seed";

const db = new Database(process.env.DB_FILE ?? "receipts.db");
db.pragma("journal_mode = WAL");

db.exec(`
CREATE TABLE IF NOT EXISTS PaymentReceipt (
  id TEXT PRIMARY KEY,
  recipientName TEXT NOT NULL,
  recipientHandle TEXT NOT NULL,
  amount REAL NOT NULL,
  feeAmount REAL NOT NULL DEFAULT 0,
  totalDisplayAmount REAL NOT NULL,
  secondaryDisplayAmount REAL NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL CHECK (status IN ('pending','completed','failed')),
  estimatedDelivery TEXT NOT NULL,
  noteText TEXT NOT NULL,
  subText TEXT NOT NULL DEFAULT '',
  createdAt TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);`);

// Migrate databases created before subText existed
const cols = db.prepare("PRAGMA table_info(PaymentReceipt)").all() as { name: string }[];
if (!cols.some((c) => c.name === "subText")) {
  db.exec("ALTER TABLE PaymentReceipt ADD COLUMN subText TEXT NOT NULL DEFAULT ''");
}

// Sample data (ignored if the ids already exist)
const seed = db.prepare(
  `INSERT OR IGNORE INTO PaymentReceipt
   (id, recipientName, recipientHandle, amount, feeAmount, totalDisplayAmount, secondaryDisplayAmount, currency, status, estimatedDelivery, noteText, subText, createdAt)
   VALUES (@id,@recipientName,@recipientHandle,@amount,@feeAmount,@totalDisplayAmount,@secondaryDisplayAmount,@currency,@status,@estimatedDelivery,@noteText,@subText,@createdAt)`
);
for (const s of SEEDS) seed.run(s);

export default db;
