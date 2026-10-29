"use client";

import { useState } from "react";
import { formatMoney } from "@/lib/format";

export function InvoiceClient({
  token,
  amountCents,
  currency,
  paid,
  readOnly,
}: {
  token: string;
  amountCents: number;
  currency: string;
  paid: boolean;
  readOnly: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  if (paid) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-900">
        Paid — thank you.
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        className="tb-btn tb-btn-primary w-full"
        disabled={loading || readOnly}
        onClick={async () => {
          setLoading(true);
          setMessage(null);
          try {
            const res = await fetch(`/api/invoices/${token}/checkout`, {
              method: "POST",
            });
            const data = await res.json();
            if (data.url) {
              window.location.href = data.url;
              return;
            }
            setMessage(
              data.message ||
                data.error ||
                "Checkout unavailable — configure Stripe.",
            );
          } catch (e) {
            setMessage(e instanceof Error ? e.message : "Error");
          } finally {
            setLoading(false);
          }
        }}
      >
        {loading
          ? "Opening Checkout…"
          : `Pay ${formatMoney(amountCents, currency)}`}
      </button>
      {message && (
        <p className="mt-3 text-sm text-[color:var(--tb-slate-soft)]">{message}</p>
      )}
    </div>
  );
}
