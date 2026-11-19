import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getReceipt, SEED_RECEIPT } from "./api";
import { money, shortDate, symbolMoney } from "./format";
import type { PaymentReceipt } from "./types";

function Skeleton() {
  return (
    <div className="animate-pulse" aria-busy="true">
      <div className="mx-auto h-6 w-4/5 rounded bg-gray-200" />
      <div className="mx-auto mt-3 h-6 w-3/5 rounded bg-gray-200" />
      <div className="mx-auto mt-6 h-3 w-full rounded bg-gray-100" />
      <div className="mx-auto mt-2 h-3 w-5/6 rounded bg-gray-100" />
      <div className="mt-12 space-y-8">
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
    <div className="flex items-start justify-between gap-4 py-4">
      <div>
        <div className="flex items-center gap-1.5 font-medium text-ink">{label}{children}</div>
        {sub && <div className="mt-0.5 text-sm text-muted">{sub}</div>}
      </div>
      <div className="text-right">
        <div className="font-medium text-ink">{value}</div>
        {subValue && <div className="mt-0.5 text-sm text-muted">{subValue}</div>}
      </div>
    </div>
  );
}

function FeeInfo() {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative inline-flex">
      <button
        type="button"
        aria-label="Fee details"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        className="flex h-4 w-4 items-center justify-center rounded-full border border-muted text-[10px] font-semibold leading-none text-muted"
      >
        i
      </button>
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
    setReceipt(null);
    setNotFound(false);
    getReceipt(id)
      .then((r) => alive && setReceipt(r))
      .catch((e: Error) => {
        if (!alive) return;
        // 404 → real "not found"; network/API down in dev → render seed so UI still shows
        if (e.message === "404") setNotFound(true);
        else setReceipt(SEED_RECEIPT);
      });
    return () => { alive = false; };
  }, [id]);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[430px] flex-col bg-white px-6 pb-8 pt-20">
      <div className="flex-1">
        {notFound ? (
          <p className="pt-10 text-center text-muted">We couldn't find that receipt.</p>
        ) : !receipt ? (
          <Skeleton />
        ) : (
          <>
            <h1 className="text-center text-2xl font-bold leading-tight text-ink">
              Your {symbolMoney(receipt.amount, receipt.currency)} payment to {receipt.recipientName} is {receipt.status}
            </h1>
            <p className="mt-4 text-center text-sm leading-relaxed text-muted">
              We've sent the money to @{receipt.recipientHandle}.. Please note that this fee will be refunded to the
              recipient. You can see the details in your activity if you need them later.
            </p>

            <section className="mt-10">
              <Row label="Amount" value={money(receipt.amount, receipt.currency)} />
              <Row label="Fee" value={money(receipt.feeAmount, receipt.currency)}><FeeInfo /></Row>
              <Row
                label="You pay"
                sub={`@${receipt.recipientHandle}`}
                value={money(receipt.totalDisplayAmount, receipt.currency)}
                subValue={money(receipt.secondaryDisplayAmount, receipt.currency)}
              />
              <Row label="Estimated delivery" value={shortDate(receipt.estimatedDelivery)} />
            </section>

            <p className="mt-6 text-xs leading-relaxed text-muted">Note : {receipt.noteText}</p>
          </>
        )}
      </div>

      <div className="mt-10">
        <button
          onClick={() => navigate("/activity")}
          className="w-full rounded-full bg-black py-4 text-base font-bold text-white active:opacity-80"
        >
          Done
        </button>
        <button
          onClick={() => navigate(`/send${receipt ? `?from=${receipt.id}` : ""}`)}
          className="mt-4 block w-full text-center text-sm font-medium text-accent"
        >
          Send More
        </button>
      </div>
    </main>
  );
}
