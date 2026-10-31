"use client";

import { useState } from "react";

export type ConnectUiState =
  | "not_connected"
  | "pending"
  | "ready"
  | "disabled";

const STATE_LABEL: Record<ConnectUiState, string> = {
  not_connected: "Not connected",
  pending: "Pending — finish onboarding",
  ready: "Ready to receive payments",
  disabled: "Connect not enabled",
};

export function ConnectActions({
  connectEnabled,
  chargesEnabled,
  hasAccount,
  state,
  statusMessage,
}: {
  connectEnabled: boolean;
  chargesEnabled: boolean;
  hasAccount: boolean;
  state: ConnectUiState;
  statusMessage: string;
}) {
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (chargesEnabled || state === "ready") {
    return (
      <div>
        <p className="text-sm font-semibold text-emerald-800">
          {STATE_LABEL.ready}
        </p>
        <p className="mt-1 text-sm text-[color:var(--tb-slate-soft)]">
          {statusMessage}
        </p>
      </div>
    );
  }

  return (
    <div>
      <p
        className={`text-sm font-semibold ${
          state === "pending"
            ? "text-[color:var(--tb-orange-deep)]"
            : "text-[color:var(--tb-slate)]"
        }`}
      >
        {STATE_LABEL[state]}
      </p>
      <p className="mt-1 text-sm text-[color:var(--tb-slate-soft)]">
        {statusMessage}
      </p>
      <button
        type="button"
        className="tb-btn tb-btn-secondary mt-4 text-sm"
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
            ? "Resume Stripe onboarding"
            : "Connect Stripe"}
      </button>
      {!connectEnabled && (
        <p className="mt-2 text-xs text-[color:var(--tb-slate-soft)]">
          Off until Connect is enabled in Stripe Dashboard and Netlify has{" "}
          <code>STRIPE_CONNECT_ENABLED=true</code>.
        </p>
      )}
      {message && (
        <p className="mt-2 text-xs text-[color:var(--tb-slate-soft)]">{message}</p>
      )}
    </div>
  );
}
