"use client";

import { useState } from "react";

export function ConnectActions({
  connectEnabled,
  chargesEnabled,
  hasAccount,
}: {
  connectEnabled: boolean;
  chargesEnabled: boolean;
  hasAccount: boolean;
}) {
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (chargesEnabled) {
    return (
      <p className="text-sm text-emerald-800">
        Express account connected — invoice payments can settle to your Stripe.
      </p>
    );
  }

  return (
    <div>
      <button
        type="button"
        className="tb-btn tb-btn-secondary text-sm"
        disabled={loading || !connectEnabled}
        onClick={async () => {
          setLoading(true);
          setMessage(null);
          try {
            const res = await fetch("/api/connect/onboard", { method: "POST" });
            const data = await res.json();
            if (data.url) {
              window.location.href = data.url;
              return;
            }
            setMessage(data.message || data.error || "Connect unavailable");
          } finally {
            setLoading(false);
          }
        }}
      >
        {loading
          ? "…"
          : hasAccount
            ? "Continue Stripe onboarding"
            : "Connect Stripe (Express)"}
      </button>
      {!connectEnabled && (
        <p className="mt-2 text-xs text-[color:var(--tb-slate-soft)]">
          Off until you enable Connect in Stripe Dashboard and set{" "}
          <code>STRIPE_CONNECT_ENABLED=true</code>.
        </p>
      )}
      {message && (
        <p className="mt-2 text-xs text-[color:var(--tb-slate-soft)]">{message}</p>
      )}
    </div>
  );
}
