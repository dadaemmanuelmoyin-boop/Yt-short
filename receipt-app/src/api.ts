import type { PaymentReceipt } from "./types";

export const SEED_RECEIPT: PaymentReceipt = {
  id: "demo",
  recipientName: "Shyanne Kimpton",
  recipientHandle: "ShyanneKimpton",
  amount: 1200.56,
  feeAmount: 30,
  totalDisplayAmount: 1200.56,
  secondaryDisplayAmount: 1200.56,
  currency: "USD",
  status: "pending",
  estimatedDelivery: "2026-11-18T00:00:00.000Z",
  noteText:
    "The recipient can send or spend the full amount on this date. If the recipient wishes to withdraw money, limits may apply..",
  createdAt: new Date().toISOString(),
};

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json();
}

export const getReceipt = (id: string) => fetch(`/api/receipts/${id}`).then(json<PaymentReceipt>);
export const listReceipts = () => fetch("/api/receipts").then(json<PaymentReceipt[]>);
export const createReceipt = (body: Record<string, unknown>) =>
  fetch("/api/receipts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }).then(json<PaymentReceipt>);
