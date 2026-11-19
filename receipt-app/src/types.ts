export type ReceiptStatus = "pending" | "completed" | "failed";

export interface PaymentReceipt {
  id: string;
  recipientName: string;
  recipientHandle: string;
  amount: number;
  feeAmount: number;
  totalDisplayAmount: number;
  secondaryDisplayAmount: number;
  currency: string;
  status: ReceiptStatus;
  estimatedDelivery: string;
  noteText: string;
  /** Text under the headline. Empty = auto-generated from the handle. */
  subText: string;
  createdAt: string;
}
