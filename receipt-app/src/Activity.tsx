import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { deleteReceipt, listReceipts } from "./api";
import { activityMoney, monthDay } from "./format";
import type { PaymentReceipt, ReceiptStatus } from "./types";

const NAVY = "#001435";
const BLUE = "#1C2C88";
const COLORS = ["#D13A56", "#7A3FA8", "#C2570C", "#0E7490", "#1B2E86", "#4B8B1D"];
const avatarColor = (name: string) => COLORS[[...name].reduce((a, c) => a + c.charCodeAt(0), 0) % COLORS.length];
const initials = (name: string) => name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase();

const BADGE: Record<ReceiptStatus, { bg: string; icon: JSX.Element }> = {
  pending: { bg: "#D96A1D", icon: <path d="M8 4v4.2l2.4 1.4" /> },
  completed: { bg: "#1F8A4C", icon: <path d="M4.5 8.3l2.4 2.4 4.6-4.9" /> },
  failed: { bg: "#C62828", icon: <path d="M5 5l6 6M11 5l-6 6" /> },
};

function Badge({ status }: { status: ReceiptStatus }) {
  if (status === "completed") return null;
  const b = BADGE[status];
  return (
    <span className="absolute bottom-0 right-0 grid h-6 w-6 place-items-center rounded-full bg-white shadow-sm">
      <svg viewBox="0 0 16 16" className="h-4 w-4">
        <circle cx="8" cy="8" r="8" fill={b.bg} />
        <g stroke="#fff" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round">{b.icon}</g>
      </svg>
    </span>
  );
}

function Card({ r, onOpen }: { r: PaymentReceipt; onOpen: () => void }) {
  return (
    <div
      role="button" tabIndex={0} onClick={onOpen} onKeyDown={(e) => e.key === "Enter" && onOpen()}
      className="flex h-[98px] cursor-pointer items-center rounded-3xl border border-[#D9DCE6] bg-white pl-[18px] pr-4"
    >
      <div className="relative h-12 w-12 shrink-0">
        <div className="grid h-12 w-12 place-items-center rounded-full text-[22px] font-medium text-white" style={{ background: avatarColor(r.recipientName) }}>
          {initials(r.recipientName)}
        </div>
        <Badge status={r.status} />
      </div>
      <div className="ml-4 min-w-0 flex-1" style={{ color: NAVY }}>
        <div className="truncate text-[18px] font-bold leading-tight">{r.recipientName}</div>
        <div className="mt-1 text-[16px] leading-tight">{monthDay(r.createdAt)} . {r.status === "failed" ? "Canceled" : "Money Sent"}</div>
      </div>
      <div className="ml-2 shrink-0 text-right">
        <div className={`text-[18px] font-bold leading-tight ${r.status === "failed" ? "line-through" : ""}`} style={{ color: r.status === "failed" ? "#5B6170" : NAVY }}>{activityMoney(r.totalDisplayAmount, r.currency)}</div>
      </div>
    </div>
  );
}

export default function Activity() {
  const navigate = useNavigate();
  const [items, setItems] = useState<PaymentReceipt[] | null>(null);
  const [q, setQ] = useState("");
  const load = async () => {
    try {
      let all = await listReceipts();
      // Cancel was removed: clear out any previously canceled transactions
      const canceled = all.filter((r) => r.status === "failed");
      if (canceled.length) {
        await Promise.allSettled(canceled.map((r) => deleteReceipt(r.id)));
        all = all.filter((r) => r.status !== "failed");
      }
      setItems(all);
    } catch { setItems([]); }
  };
  useEffect(() => { load(); }, []);

  const groups = useMemo(() => {
    const term = q.trim().toLowerCase();
    const list = (items ?? [])
      .filter((r) => !term || r.recipientName.toLowerCase().includes(term) || r.recipientHandle.toLowerCase().includes(term))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return [
      { title: "Pending", rows: list.filter((r) => r.status === "pending") },
      { title: "Completed", rows: list.filter((r) => r.status !== "pending") }, // includes canceled
    ].filter((g) => g.rows.length);
  }, [items, q]);

  return (
    <main className="mx-auto min-h-screen w-full max-w-[430px] bg-white pb-[calc(2rem+env(safe-area-inset-bottom,0px))]">
      {/* Header */}
      <header className="flex items-end" style={{ background: BLUE, paddingTop: "env(safe-area-inset-top, 0px)" }}>
        <div className="flex h-[82px] w-full items-center justify-between px-5 text-white">
          <svg viewBox="0 0 28 28" className="h-8 w-8" aria-label="Menu"><g stroke="currentColor" strokeWidth="3.4" strokeLinecap="round"><path d="M4 7h20M4 14h20M4 21h20" /></g></svg>
          <span className="h-10 w-10" aria-hidden />
          <svg viewBox="0 0 24 24" className="h-9 w-9" aria-label="Notifications"><path fill="currentColor" d="M12 2.5a1.6 1.6 0 0 1 1.6 1.6v.5A6 6 0 0 1 18 10.4v3.3l1.7 2.6c.4.7 0 1.5-.8 1.5H5.1c-.8 0-1.2-.8-.8-1.5L6 13.7v-3.3a6 6 0 0 1 4.4-5.8v-.5A1.6 1.6 0 0 1 12 2.5Zm-2.3 16h4.6a2.3 2.3 0 0 1-4.6 0Z" /></svg>
        </div>
      </header>

      <div className="px-2 pt-9">
        {/* Search + actions */}
        <div className="flex items-center gap-2">
          <label className="flex h-16 min-w-0 flex-1 items-center gap-3 rounded-full border-2 border-[#4B5563] bg-white pl-6 pr-3">
            <svg viewBox="0 0 24 24" className="h-[22px] w-[22px] shrink-0 text-[#4B5563]"><g fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><circle cx="10.5" cy="10.5" r="6.5" /><path d="m15.5 15.5 5 5" /></g></svg>
            <input
              value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name or email"
              className="min-w-0 flex-1 truncate bg-transparent text-[20px] outline-none placeholder:text-[#5B6170]" style={{ color: NAVY }}
            />
          </label>
          <button aria-label="Filter" className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#F7F6F2]" style={{ color: BLUE }}>
            <svg viewBox="0 0 24 24" className="h-7 w-7"><g fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M3 8h18M3 16h18" /></g><circle cx="15" cy="8" r="3" fill="currentColor" /><circle cx="9" cy="16" r="3" fill="currentColor" /></svg>
          </button>
          <button aria-label="Download" className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#F7F6F2]" style={{ color: BLUE }}>
            <svg viewBox="0 0 24 24" className="h-7 w-7"><g fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v11m-4.5-4L12 14.5 16.5 10M4 15v4.5h16V15" /></g></svg>
          </button>
        </div>

        {/* Filter chip */}
        <div className="mt-9 text-[18px]" style={{ color: NAVY }}>Filter by</div>
        <div className="mt-4 inline-flex h-11 items-center rounded-full bg-[#C2ECF8] px-[18px] text-[16px] font-bold" style={{ color: "#13307F" }}>
          Date: Last 90 days
        </div>

        {/* Sections */}
        {items === null && <p className="mt-10 text-[#5B6170]">Loading…</p>}
        {items && groups.length === 0 && <p className="mt-10 text-[#5B6170]">No activity found.</p>}
        {groups.map((g) => (
          <section key={g.title} className="mt-9">
            <h2 className="mb-5 text-[22px] font-bold" style={{ color: NAVY }}>{g.title}</h2>
            <div className="space-y-[13px]">
              {g.rows.map((r) => (
                <Card key={r.id} r={r} onOpen={() => navigate(`/receipt/${r.id}`)} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
