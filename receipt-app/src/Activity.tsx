import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listReceipts } from "./api";
import { money, shortDate } from "./format";
import type { PaymentReceipt } from "./types";

export default function Activity() {
  const [items, setItems] = useState<PaymentReceipt[] | null>(null);
  useEffect(() => { listReceipts().then(setItems).catch(() => setItems([])); }, []);

  return (
    <main className="mx-auto min-h-screen w-full max-w-[430px] bg-white px-6 pt-16">
      <h1 className="text-2xl font-bold text-ink">Activity</h1>
      <ul className="mt-6 divide-y divide-gray-100">
        {items === null && <li className="py-4 text-muted">Loading…</li>}
        {items?.length === 0 && <li className="py-4 text-muted">No activity yet.</li>}
        {items?.map((r) => (
          <li key={r.id}>
            <Link to={`/receipt/${r.id}`} className="flex justify-between py-4">
              <div>
                <div className="font-medium text-ink">{r.recipientName}</div>
                <div className="text-sm capitalize text-muted">{r.status} · {shortDate(r.createdAt)}</div>
              </div>
              <div className="font-medium text-ink">{money(r.amount, r.currency)}</div>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
