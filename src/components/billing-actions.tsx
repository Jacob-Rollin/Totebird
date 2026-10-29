"use client";

import { useState } from "react";
import type { Plan } from "@/lib/plans";

export function BillingActions({
  plan,
  mode,
  demoMode,
}: {
  plan: Exclude<Plan, "free"> | Plan;
  mode: "upgrade" | "portal";
  demoMode: boolean;
}) {
  const [interval, setInterval] = useState<"month" | "year">("month");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (mode === "portal") {
    return (
      <div>
        <button
          type="button"
          className="tb-btn tb-btn-secondary w-full text-sm"
          disabled={loading}
          onClick={async () => {
            setLoading(true);
            setMessage(null);
            try {
              if (demoMode) {
                setMessage(
                  "Customer Portal needs Stripe + a customer ID. In demo, use Upgrade on another tier or set DEMO plan via upgrade buttons.",
                );
                return;
              }
              const res = await fetch("/api/billing/portal", { method: "POST" });
              const data = await res.json();
              if (data.url) {
                window.location.href = data.url;
                return;
              }
              setMessage(data.message || data.error || "Portal unavailable");
            } finally {
              setLoading(false);
            }
          }}
        >
          Manage in Stripe
        </button>
        {message && (
          <p className="mt-2 text-xs text-[color:var(--tb-slate-soft)]">{message}</p>
        )}
      </div>
    );
  }

  if (plan === "free") return null;

  return (
    <div className="space-y-2">
      <div className="flex gap-2 text-xs">
        <button
          type="button"
          className={`rounded px-2 py-1 ${interval === "month" ? "bg-[color:var(--tb-orange-soft)] font-semibold" : ""}`}
          onClick={() => setInterval("month")}
        >
          Monthly
        </button>
        <button
          type="button"
          className={`rounded px-2 py-1 ${interval === "year" ? "bg-[color:var(--tb-orange-soft)] font-semibold" : ""}`}
          onClick={() => setInterval("year")}
        >
          Yearly
        </button>
      </div>
      <button
        type="button"
        className="tb-btn tb-btn-primary w-full text-sm"
        disabled={loading}
        onClick={async () => {
          setLoading(true);
          setMessage(null);
          try {
            if (demoMode) {
              window.location.href = `/app/billing?demoPlan=${plan}`;
              return;
            }
            const res = await fetch("/api/billing/checkout", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ plan, interval }),
            });
            const data = await res.json();
            if (data.url) {
              window.location.href = data.url;
              return;
            }
            setMessage(data.message || data.error || "Checkout unavailable");
          } finally {
            setLoading(false);
          }
        }}
      >
        {loading ? "…" : demoMode ? `Switch to ${plan} (demo)` : `Upgrade to ${plan}`}
      </button>
      {message && (
        <p className="text-xs text-[color:var(--tb-slate-soft)]">{message}</p>
      )}
    </div>
  );
}
