import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getReceipt } from "./api";
import { defaultSub, money, shortDate, symbolMoney } from "./format";
import type { PaymentReceipt } from "./types";

function Skeleton() {
  return (
    <div className="animate-pulse" aria-busy="true">
      <div className="mx-auto h-6 w-4/5 rounded bg-gray-200" />
      <div className="mx-auto mt-3 h-6 w-3/5 rounded bg-gray-200" />
      <div className="mx-auto mt-5 h-3 w-full rounded bg-gray-100" />
      <div className="mx-auto mt-2 h-3 w-5/6 rounded bg-gray-100" />
      <div className="mt-10 space-y-6">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex justify-between">
            <div className="h-4 w-24 rounded bg-gray-200" />
            <div className="h-4 w-28 rounded bg-gray-200" />
          </div>
        ))}
      </div>
    </div>
  );
}

function Row({ label, sub, value, subValue, children }: {
  label: string; sub?: string; value: string; subValue?: string; children?: React.ReactNode;
}) {
  return (
    <div className="rcpt-row">
      <div>
        <div className="flex items-center gap-1.5 font-medium text-ink">{label}{children}</div>
        {sub && <div className="mt-0.5 text-[0.85em] text-muted">{sub}</div>}
      </div>
      <div className="text-right">
        <div className="font-medium text-ink">{value}</div>
        {subValue && <div className="mt-0.5 text-[0.85em] text-muted">{subValue}</div>}
      </div>
    </div>
  );
}

function FeeInfo() {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative inline-flex">
      <button
        type="button" aria-label="Fee details" aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}
        className="flex h-4 w-4 items-center justify-center rounded-full border border-muted text-[10px] font-semibold leading-none text-muted"
      >i</button>
      {open && (
        <span role="tooltip" className="absolute left-0 top-6 z-10 w-56 rounded-xl bg-ink p-3 text-xs font-normal leading-snug text-white shadow-lg">
          This fee covers processing of your transfer and will be refunded to the recipient.
        </span>
      )}
    </span>
  );
}

export default function Receipt() {
  const { id = "demo" } = useParams();
  const navigate = useNavigate();
  const [receipt, setReceipt] = useState<PaymentReceipt | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let alive = true;
    setReceipt(null); setNotFound(false);
    getReceipt(id).then((r) => alive && setReceipt(r)).catch(() => alive && setNotFound(true));
    return () => { alive = false; };
  }, [id]);

  return (
    <main className="rcpt">
      <div className="rcpt-body">
        {notFound ? (
          <p className="pt-10 text-center text-muted">We couldn't find that receipt.</p>
        ) : !receipt ? (
          <Skeleton />
        ) : (
          <>
            <h1 className="text-ink">
              Your {symbolMoney(receipt.amount, receipt.currency)} payment to {receipt.recipientName} is {receipt.status === "failed" ? "canceled" : receipt.status}
            </h1>
            <p className="rcpt-sub">{receipt.subText || defaultSub(receipt.recipientHandle)}</p>

            <section className="rcpt-rows">
              <Row label="Amount" value={money(receipt.amount, receipt.currency)} />
              <Row label="Fee" value={money(receipt.feeAmount, receipt.currency)}><FeeInfo /></Row>
              <Row
                label="You pay" sub={`@${receipt.recipientHandle}`}
                value={money(receipt.totalDisplayAmount, receipt.currency)}
                subValue={money(receipt.secondaryDisplayAmount, receipt.currency)}
              />
              <Row label="Estimated delivery" value={shortDate(receipt.estimatedDelivery)} />
            </section>
            <p className="rcpt-note">Note : {receipt.noteText}</p>
          </>
        )}
      </div>

      <div className="rcpt-actions">
        <button onClick={() => navigate("/activity")} className="w-full rounded-full bg-black py-4 text-base font-bold text-white active:opacity-80">
          Done
        </button>
        <button onClick={() => navigate(`/edit/${id}`)} className="mt-3 block w-full text-center text-sm font-medium text-accent">
          Send More
        </button>
      </div>
    </main>
  );
}
