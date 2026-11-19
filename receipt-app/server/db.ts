import Database from "better-sqlite3";

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
  createdAt TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);`);

// Seed a demo receipt so /receipt/demo works immediately
const count = db.prepare("SELECT COUNT(*) AS n FROM PaymentReceipt").get() as { n: number };
if (count.n === 0) {
  db.prepare(
    `INSERT INTO PaymentReceipt
     (id, recipientName, recipientHandle, amount, feeAmount, totalDisplayAmount, secondaryDisplayAmount, currency, status, estimatedDelivery, noteText)
     VALUES (?,?,?,?,?,?,?,?,?,?,?)`
  ).run(
    "demo", "Shyanne Kimpton", "ShyanneKimpton", 1200.56, 30, 1200.56, 1200.56, "USD",
    "pending", "2026-11-18T00:00:00.000Z",
    "The recipient can send or spend the full amount on this date. If the recipient wishes to withdraw money, limits may apply.."
  );
}

export default db;
