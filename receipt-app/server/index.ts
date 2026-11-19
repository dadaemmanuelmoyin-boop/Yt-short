import express from "express";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import path from "node:path";
import fs from "node:fs";
import db from "./db";

const app = express();
app.use(express.json());

const round2 = (n: number) => Math.round(n * 100) / 100;
const isoDate = z.string().refine((s) => !Number.isNaN(Date.parse(s)), "Invalid date");

const CreateReceipt = z.object({
  recipientName: z.string().trim().min(1),
  recipientHandle: z.string().trim().min(1).regex(/^@?[A-Za-z0-9_.]+$/, "Letters, numbers, _ and . only"),
  amount: z.number().positive(),
  feeAmount: z.number().nonnegative().default(0),
  currency: z.string().length(3).default("USD").transform((s) => s.toUpperCase()),
  status: z.enum(["pending", "completed", "failed"]).default("pending"),
  estimatedDelivery: isoDate.optional(),
  noteText: z.string().max(500).optional(),
  totalDisplayAmount: z.number().nonnegative().optional(),
  secondaryDisplayAmount: z.number().nonnegative().optional(),
});

const DEFAULT_NOTE =
  "The recipient can send or spend the full amount on this date. If the recipient wishes to withdraw money, limits may apply..";

app.get("/api/receipts", (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 20, 100);
  res.json(db.prepare("SELECT * FROM PaymentReceipt ORDER BY createdAt DESC LIMIT ?").all(limit));
});

app.get("/api/receipts/:id", (req, res) => {
  const row = db.prepare("SELECT * FROM PaymentReceipt WHERE id = ?").get(req.params.id);
  if (!row) return res.status(404).json({ error: "Receipt not found" });
  res.json(row);
});

app.post("/api/receipts", (req, res) => {
  const parsed = CreateReceipt.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Validation failed", issues: parsed.error.flatten() });
  }
  const d = parsed.data;
  const amount = round2(d.amount);
  const feeAmount = round2(d.feeAmount);
  // Fee is refunded to the recipient, so "You pay" defaults to the amount sent.
  const total = round2(d.totalDisplayAmount ?? amount);
  const secondary = round2(d.secondaryDisplayAmount ?? total);
  const delivery = d.estimatedDelivery
    ? new Date(d.estimatedDelivery)
    : new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);

  const receipt = {
    id: randomUUID(),
    recipientName: d.recipientName,
    recipientHandle: d.recipientHandle.replace(/^@/, ""),
    amount, feeAmount,
    totalDisplayAmount: total,
    secondaryDisplayAmount: secondary,
    currency: d.currency,
    status: d.status,
    estimatedDelivery: delivery.toISOString(),
    noteText: d.noteText ?? DEFAULT_NOTE,
  };

  db.prepare(
    `INSERT INTO PaymentReceipt
     (id, recipientName, recipientHandle, amount, feeAmount, totalDisplayAmount, secondaryDisplayAmount, currency, status, estimatedDelivery, noteText)
     VALUES (@id,@recipientName,@recipientHandle,@amount,@feeAmount,@totalDisplayAmount,@secondaryDisplayAmount,@currency,@status,@estimatedDelivery,@noteText)`
  ).run(receipt);

  const created = db.prepare("SELECT * FROM PaymentReceipt WHERE id = ?").get(receipt.id);
  res.status(201).json(created);
});

// Production: serve the built frontend (npm run build) with SPA fallback
const dist = path.resolve("dist");
if (fs.existsSync(dist)) {
  app.use(express.static(dist));
  app.get("*", (_req, res) => res.sendFile(path.join(dist, "index.html")));
}

const PORT = Number(process.env.PORT) || 3001;
app.listen(PORT, () => console.log(`API on http://localhost:${PORT}`));
