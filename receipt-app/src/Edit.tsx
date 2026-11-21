import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getReceipt, updateReceipt } from "./api";
import { defaultSub } from "./format";
import type { PaymentReceipt, ReceiptStatus } from "./types";

interface Form {
  recipientName: string; recipientHandle: string; amount: string; currency: string; feeAmount: string;
  totalDisplayAmount: string; secondaryDisplayAmount: string; status: ReceiptStatus;
  estimatedDelivery: string; createdDate: string; subText: string; noteText: string;
}

// Blank "You pay" fields mean "same as amount" so editing the amount keeps them in sync.
const toForm = (r: PaymentReceipt): Form => ({
  recipientName: r.recipientName, recipientHandle: r.recipientHandle, amount: String(r.amount),
  currency: r.currency, feeAmount: String(r.feeAmount),
  totalDisplayAmount: r.totalDisplayAmount === r.amount ? "" : String(r.totalDisplayAmount),
  secondaryDisplayAmount: r.secondaryDisplayAmount === r.totalDisplayAmount ? "" : String(r.secondaryDisplayAmount),
  status: r.status, estimatedDelivery: r.estimatedDelivery.slice(0, 10), createdDate: r.createdAt.slice(0, 10),
  subText: r.subText || defaultSub(r.recipientHandle), noteText: r.noteText,
});

const input = "w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-ink outline-none focus:border-ink";
const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <label className="block"><span className="mb-1 block text-xs font-medium text-muted">{label}</span>{children}</label>
);
const r2 = (n: number) => Math.round(n * 100) / 100;

export default function Edit() {
  const { id = "demo" } = useParams();
  const navigate = useNavigate();
  const [orig, setOrig] = useState<PaymentReceipt | null>(null);
  const [f, setF] = useState<Form | null>(null);
  const [missing, setMissing] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getReceipt(id).then((r) => { setOrig(r); setF(toForm(r)); }).catch(() => setMissing(true));
  }, [id]);

  const set = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setF((p) => (p ? { ...p, [k]: e.target.value } : p));

  async function done(e: React.FormEvent) {
    e.preventDefault();
    if (!f || !orig) return;
    const amount = parseFloat(f.amount), fee = parseFloat(f.feeAmount || "0");
    const handle = f.recipientHandle.trim().replace(/^@/, "");
    const total = f.totalDisplayAmount.trim() ? parseFloat(f.totalDisplayAmount) : amount;
    const sec = f.secondaryDisplayAmount.trim() ? parseFloat(f.secondaryDisplayAmount) : total;
    const bad =
      !f.recipientName.trim() ? "Recipient name is required."
      : !/^[A-Za-z0-9_.]+$/.test(handle) ? "Handle: letters, numbers, _ and . only."
      : !(amount > 0) ? "Amount must be greater than 0."
      : !(fee >= 0) ? "Fee can't be negative."
      : !(total >= 0) || !(sec >= 0) ? "'You pay' amounts must be numbers."
      : !/^[A-Za-z]{3}$/.test(f.currency.trim()) ? "Currency must be a 3-letter code." : "";
    if (bad) return setError(bad);

    const keep = (date: string, iso: string, time: string) => (date && date !== iso.slice(0, 10) ? `${date}T${time}.000Z` : iso);
    setBusy(true); setError("");
    try {
      await updateReceipt(id, {
        recipientName: f.recipientName.trim(), recipientHandle: handle,
        amount: r2(amount), feeAmount: r2(fee), currency: f.currency.trim().toUpperCase(),
        totalDisplayAmount: r2(total), secondaryDisplayAmount: r2(sec), status: f.status,
        estimatedDelivery: keep(f.estimatedDelivery, orig.estimatedDelivery, "00:00:00"),
        createdAt: keep(f.createdDate, orig.createdAt, "12:00:00"),
        noteText: f.noteText,
        subText: f.subText.trim() === defaultSub(handle) ? "" : f.subText.trim(),
      });
      navigate(`/receipt/${id}`);
    } catch {
      setError("Couldn't save. Please try again.");
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-[430px] bg-white px-6 pb-10 pt-[calc(3.5rem+env(safe-area-inset-top,0px))]">
      <h1 className="text-2xl font-bold text-ink">Edit details</h1>
      <p className="mt-1 text-sm text-muted">Changes go live on the receipt and in Activity when you tap Done.</p>

      {missing ? (
        <p className="mt-10 text-center text-muted">We couldn't find that receipt.</p>
      ) : !f ? (
        <div className="mt-8 animate-pulse space-y-4">{[0, 1, 2, 3].map((i) => <div key={i} className="h-12 rounded-xl bg-gray-100" />)}</div>
      ) : (
        <form onSubmit={done} className="mt-8 space-y-4" noValidate>
          <Field label="Message under headline"><textarea className={input} rows={4} maxLength={500} value={f.subText} onChange={set("subText")} /></Field>
          <Field label="Recipient name"><input className={input} value={f.recipientName} onChange={set("recipientName")} /></Field>
          <Field label="Recipient handle (no @)"><input className={input} value={f.recipientHandle} onChange={set("recipientHandle")} /></Field>
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2"><Field label="Amount"><input className={input} inputMode="decimal" value={f.amount} onChange={set("amount")} /></Field></div>
            <Field label="Currency"><input className={input} maxLength={3} value={f.currency} onChange={set("currency")} /></Field>
          </div>
          <Field label="Fee"><input className={input} inputMode="decimal" value={f.feeAmount} onChange={set("feeAmount")} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="You pay (total)"><input className={input} inputMode="decimal" placeholder="Same as amount" value={f.totalDisplayAmount} onChange={set("totalDisplayAmount")} /></Field>
            <Field label="You pay (sub-amount)"><input className={input} inputMode="decimal" placeholder="Same as total" value={f.secondaryDisplayAmount} onChange={set("secondaryDisplayAmount")} /></Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Status">
              <select className={input} value={f.status} onChange={set("status")}>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
              </select>
            </Field>
            <Field label="Estimated delivery"><input type="date" className={input} value={f.estimatedDelivery} onChange={set("estimatedDelivery")} /></Field>
          </div>
          <Field label="Transaction date (shown in Activity)"><input type="date" className={input} value={f.createdDate} onChange={set("createdDate")} /></Field>
          <Field label="Note"><textarea className={input} rows={3} maxLength={500} value={f.noteText} onChange={set("noteText")} /></Field>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button disabled={busy} className="w-full rounded-full bg-black py-4 font-bold text-white disabled:opacity-50">
            {busy ? "Saving…" : "Done"}
          </button>
          <button type="button" onClick={() => navigate(`/receipt/${id}`)} className="block w-full text-center text-sm font-medium text-accent">Cancel</button>
        </form>
      )}
    </main>
  );
}
