import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { createReceipt, getReceipt, SEED_RECEIPT } from "./api";
import type { PaymentReceipt, ReceiptStatus } from "./types";

const NOTE =
  "The recipient can send or spend the full amount on this date. If the recipient wishes to withdraw money, limits may apply..";

interface Form {
  recipientName: string; recipientHandle: string; amount: string; feeAmount: string;
  currency: string; status: ReceiptStatus; estimatedDelivery: string; noteText: string;
  totalDisplayAmount: string; secondaryDisplayAmount: string;
}

const fromReceipt = (r: PaymentReceipt): Form => ({
  recipientName: r.recipientName, recipientHandle: r.recipientHandle,
  amount: String(r.amount), feeAmount: String(r.feeAmount), currency: r.currency,
  status: r.status, estimatedDelivery: r.estimatedDelivery.slice(0, 10), noteText: r.noteText,
  totalDisplayAmount: String(r.totalDisplayAmount), secondaryDisplayAmount: String(r.secondaryDisplayAmount),
});

const empty: Form = {
  recipientName: "", recipientHandle: "", amount: "", feeAmount: "0", currency: "USD",
  status: "pending", estimatedDelivery: "", noteText: NOTE, totalDisplayAmount: "", secondaryDisplayAmount: "",
};

const input = "w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-ink outline-none focus:border-ink";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-muted">{label}</span>
      {children}
    </label>
  );
}

export default function Send() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const from = params.get("from");
  const [f, setF] = useState<Form>(empty);
  const [loading, setLoading] = useState(!!from);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // Prefill every field from the receipt the user came from
  useEffect(() => {
    if (!from) return;
    getReceipt(from)
      .catch(() => SEED_RECEIPT)
      .then((r) => setF(fromReceipt(r)))
      .finally(() => setLoading(false));
  }, [from]);

  const set = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setF((p) => ({ ...p, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError("");
    const body: Record<string, unknown> = {
      recipientName: f.recipientName, recipientHandle: f.recipientHandle,
      amount: Number(f.amount), feeAmount: Number(f.feeAmount || 0),
      currency: f.currency, status: f.status, noteText: f.noteText,
    };
    if (f.estimatedDelivery) body.estimatedDelivery = `${f.estimatedDelivery}T00:00:00.000Z`;
    if (f.totalDisplayAmount) body.totalDisplayAmount = Number(f.totalDisplayAmount);
    if (f.secondaryDisplayAmount) body.secondaryDisplayAmount = Number(f.secondaryDisplayAmount);
    try {
      const r = await createReceipt(body);
      navigate(`/receipt/${r.id}`);
    } catch {
      setError("Please check the details and try again.");
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-[430px] bg-white px-6 pb-10 pt-16">
      <h1 className="text-2xl font-bold text-ink">Send more</h1>
      <p className="mt-1 text-sm text-muted">Edit any detail, then send. This creates a new receipt.</p>

      {loading ? (
        <div className="mt-8 animate-pulse space-y-4">{[0,1,2,3].map((i) => <div key={i} className="h-12 rounded-xl bg-gray-100" />)}</div>
      ) : (
        <form onSubmit={submit} className="mt-8 space-y-4">
          <Field label="Recipient name"><input className={input} value={f.recipientName} onChange={set("recipientName")} required /></Field>
          <Field label="Recipient handle (no @)"><input className={input} value={f.recipientHandle} onChange={set("recipientHandle")} required /></Field>
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2"><Field label="Amount"><input className={input} inputMode="decimal" value={f.amount} onChange={set("amount")} required /></Field></div>
            <Field label="Currency"><input className={input} maxLength={3} value={f.currency} onChange={set("currency")} required /></Field>
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
                <option value="failed">Failed</option>
              </select>
            </Field>
            <Field label="Estimated delivery"><input type="date" className={input} value={f.estimatedDelivery} onChange={set("estimatedDelivery")} /></Field>
          </div>
          <Field label="Note"><textarea className={input} rows={3} maxLength={500} value={f.noteText} onChange={set("noteText")} /></Field>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button disabled={busy} className="w-full rounded-full bg-black py-4 font-bold text-white disabled:opacity-50">
            {busy ? "Sending…" : "Send"}
          </button>
          <button type="button" onClick={() => navigate(-1)} className="block w-full text-center text-sm font-medium text-accent">Cancel</button>
        </form>
      )}
    </main>
  );
}
