import type { PaymentReceipt } from "./types";

export const NOTE =
  "The recipient can send or spend the full amount on this date. If the recipient wishes to withdraw money, limits may apply..";

const mk = (
  id: string, name: string, handle: string, amount: number, createdAt: string, fee = 0, delivery = "2026-11-20"
): PaymentReceipt => ({
  id, recipientName: name, recipientHandle: handle, amount, feeAmount: fee,
  totalDisplayAmount: amount, secondaryDisplayAmount: amount, currency: "USD", status: "pending",
  estimatedDelivery: `${delivery}T00:00:00.000Z`, noteText: NOTE, subText: "", createdAt,
});

export const SEEDS: PaymentReceipt[] = [
  mk("demo", "Shyanne Kimpton", "ShyanneKimpton", 1200.56, "2026-11-19T12:00:00.000Z", 30, "2026-11-18"),
  mk("seed-elias", "Elias Högg", "EliasHogg", 1130, "2026-11-17T12:30:00.000Z"),
  mk("seed-fgghh", "Fgghh", "Fgghh", 500, "2026-11-17T12:00:00.000Z"),
  mk("seed-anne", "Anne Verdier", "AnneVerdier", 5150, "2026-11-16T12:00:00.000Z"),
];
