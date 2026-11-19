import { SEEDS } from "./seed";
import type { PaymentReceipt } from "./types";

/**
 * Talks to the Express API when it exists. On a static host (e.g. Vercel, where
 * /api just returns index.html) or when the API is down, it falls back to a
 * localStorage copy so editing and the Activity page still work.
 */
const LS = "receipts-store-v1";
export class HttpError extends Error {}

const readLocal = (): PaymentReceipt[] => {
  try {
    const v = JSON.parse(localStorage.getItem(LS) ?? "null");
    if (Array.isArray(v) && v.length) return v;
  } catch { /* ignore */ }
  return SEEDS.map((s) => ({ ...s }));
};
const writeLocal = (l: PaymentReceipt[]) => {
  try { localStorage.setItem(LS, JSON.stringify(l)); } catch { /* ignore */ }
};

async function call<T>(path: string, init?: RequestInit): Promise<T | undefined> {
  try {
    const res = await fetch(path, init);
    if (!(res.headers.get("content-type") ?? "").includes("json")) return undefined; // no API here
    if (res.status === 404) throw new HttpError("404");
    if (!res.ok) return undefined;
    return (await res.json()) as T;
  } catch (e) {
    if (e instanceof HttpError) throw e;
    return undefined;
  }
}

export async function getReceipt(id: string): Promise<PaymentReceipt> {
  const r = await call<PaymentReceipt>(`/api/receipts/${id}`);
  if (r) return r;
  const found = readLocal().find((x) => x.id === id);
  if (!found) throw new HttpError("404");
  return found;
}

export async function listReceipts(): Promise<PaymentReceipt[]> {
  return (await call<PaymentReceipt[]>("/api/receipts")) ?? readLocal();
}

export async function updateReceipt(id: string, patch: Partial<PaymentReceipt>): Promise<PaymentReceipt> {
  const r = await call<PaymentReceipt>(`/api/receipts/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  if (r) return r;
  const list = readLocal();
  const i = list.findIndex((x) => x.id === id);
  if (i < 0) throw new HttpError("404");
  list[i] = { ...list[i], ...patch };
  writeLocal(list);
  return list[i];
}
