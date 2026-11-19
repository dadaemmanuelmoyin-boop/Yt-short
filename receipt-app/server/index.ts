import express from "express";
import path from "node:path";
import fs from "node:fs";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import db from "./db";
import type { PaymentReceipt } from "../src/types";

const app = express();
app.use(express.json());

const round2 = (n: number) => Math.round(n * 100) / 100;
const isoDate = z.string().refine((s) => !Number.isNaN(Date.parse(s)), "Invalid date");
const DEFAULT_NOTE =
  "The recipient can send or spend the full amount on this date. If the recipient wishes to withdraw money, limits may apply..";

const Base = z.object({
  recipientName: z.string().trim().min(1),
  recipientHandle: z.string().trim().regex(/^@?[A-Za-z0-9_.]+$/, "Letters, numbers, _ and . only"),
  amount: z.number().positive(),
  feeAmount: z.number().nonnegative(),
  currency: z.string().length(3),
  status: z.enum(["pending", "completed", "failed"]),
  estimatedDelivery: isoDate,
  createdAt: isoDate,
  noteText: z.string().max(500),
  subText: z.string().max(500),
  totalDisplayAmount: z.number().nonnegative(),
  secondaryDisplayAmount: z.number().nonnegative(),
});
const Create = Base.partial().required({ recipientName: true, recipientHandle: true, amount: true });
const Update = Base.partial();

const normalize = (r: PaymentReceipt): PaymentReceipt => ({
  ...r,
  recipientHandle: r.recipientHandle.replace(/^@/, ""),
  currency: r.currency.toUpperCase(),
  amount: round2(r.amount),
  feeAmount: round2(r.feeAmount),
  totalDisplayAmount: round2(r.totalDisplayAmount),
  secondaryDisplayAmount: round2(r.secondaryDisplayAmount),
  estimatedDelivery: new Date(r.estimatedDelivery).toISOString(),
  createdAt: new Date(r.createdAt).toISOString(),
});

const getRow = (id: string) => db.prepare("SELECT * FROM PaymentReceipt WHERE id = ?").get(id) as PaymentReceipt | undefined;

app.get("/api/receipts", (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 50, 200);
  res.json(db.prepare("SELECT * FROM PaymentReceipt ORDER BY createdAt DESC LIMIT ?").all(limit));
});

app.get("/api/receipts/:id", (req, res) => {
  const row = getRow(req.params.id);
  if (!row) return res.status(404).json({ error: "Receipt not found" });
  res.json(row);
});

app.post("/api/receipts", (req, res) => {
  const parsed = Create.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Validation failed", issues: parsed.error.flatten() });
  const d = parsed.data;
  const total = d.totalDisplayAmount ?? d.amount; // fee is refunded to the recipient, so "You pay" defaults to the amount
  const rec = normalize({
    id: randomUUID(),
    recipientName: d.recipientName,
    recipientHandle: d.recipientHandle,
    amount: d.amount,
    feeAmount: d.feeAmount ?? 0,
    totalDisplayAmount: total,
    secondaryDisplayAmount: d.secondaryDisplayAmount ?? total,
    currency: d.currency ?? "USD",
    status: d.status ?? "pending",
    estimatedDelivery: d.estimatedDelivery ?? new Date(Date.now() + 3 * 864e5).toISOString(),
    noteText: d.noteText ?? DEFAULT_NOTE,
    subText: d.subText ?? "",
    createdAt: d.createdAt ?? new Date().toISOString(),
  });
  db.prepare(
    `INSERT INTO PaymentReceipt
     (id, recipientName, recipientHandle, amount, feeAmount, totalDisplayAmount, secondaryDisplayAmount, currency, status, estimatedDelivery, noteText, subText, createdAt)
     VALUES (@id,@recipientName,@recipientHandle,@amount,@feeAmount,@totalDisplayAmount,@secondaryDisplayAmount,@currency,@status,@estimatedDelivery,@noteText,@subText,@createdAt)`
  ).run(rec);
  res.status(201).json(getRow(rec.id));
});

// Edit a receipt in place (used by "Send More" -> Done, and Cancel in Activity)
app.put("/api/receipts/:id", (req, res) => {
  const row = getRow(req.params.id);
  if (!row) return res.status(404).json({ error: "Receipt not found" });
  const parsed = Update.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Validation failed", issues: parsed.error.flatten() });
  const next = normalize({ ...row, ...parsed.data });
  db.prepare(
    `UPDATE PaymentReceipt SET recipientName=@recipientName, recipientHandle=@recipientHandle, amount=@amount,
     feeAmount=@feeAmount, totalDisplayAmount=@totalDisplayAmount, secondaryDisplayAmount=@secondaryDisplayAmount,
     currency=@currency, status=@status, estimatedDelivery=@estimatedDelivery, noteText=@noteText,
     subText=@subText, createdAt=@createdAt WHERE id=@id`
  ).run(next);
  res.json(getRow(next.id));
});

// Production: serve the built frontend (npm run build) with SPA fallback
const dist = path.resolve("..", "dist");
if (fs.existsSync(dist)) {
  app.use(express.static(dist));
  app.get("*", (_req, res) => res.sendFile(path.join(dist, "index.html")));
}

const PORT = Number(process.env.PORT) || 3001;
app.listen(PORT, () => console.log(`API on http://localhost:${PORT}`));
