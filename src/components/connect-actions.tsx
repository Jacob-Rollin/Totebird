"use client";

import { useState } from "react";
import { readResponseJson } from "@/lib/read-response-json";

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
        disabled={loading}
        aria-busy={loading}
        onClick={async () => {
          setLoading(true);
          setMessage(null);
          try {
            const res = await fetch("/api/connect/onboard", { method: "POST" });
            const { data } = await readResponseJson<{
              ok?: boolean;
              url?: string | null;
              message?: string;
              error?: string;
            }>(res);

            if (typeof data.url === "string" && data.url) {
              window.location.assign(data.url);
              return;
            }

            const detail =
              (typeof data.message === "string" && data.message.trim()) ||
              (typeof data.error === "string" && data.error.trim()) ||
              null;

            if (!res.ok && !detail) {
              if (res.status === 401) {
                setMessage("Sign in again, then retry Connect Stripe.");
              } else if (res.status >= 500) {
                setMessage(
                  "Connect failed on the server (Stripe or config). Check Stripe Dashboard → Connect and Netlify env, then retry.",
                );
              } else {
                setMessage(
                  connectEnabled
                    ? "Connect unavailable — no onboarding URL returned."
                    : "Connect is off until Stripe Dashboard Connect setup and STRIPE_CONNECT_ENABLED=true (redeploy after setting).",
                );
              }
              return;
            }

            setMessage(
              detail ||
                (connectEnabled
                  ? "Connect unavailable — no onboarding URL returned."
                  : "Connect is off until Stripe Dashboard Connect setup and STRIPE_CONNECT_ENABLED=true (redeploy after setting)."),
            );
          } catch (err) {
            console.error("[totebird] Connect Stripe click failed", err);
            setMessage(
              err instanceof Error && err.message
                ? `Could not reach Connect: ${err.message}`
                : "Could not reach Connect. Check your network and try again.",
            );
          } finally {
            setLoading(false);
          }
        }}
      >
        {loading
          ? "Opening Stripe…"
          : hasAccount
            ? "Resume Stripe onboarding"
            : "Connect Stripe"}
      </button>
      {!connectEnabled && (
        <p className="mt-2 text-sm text-[color:var(--tb-orange-deep)]">
          Off until Connect is enabled in Stripe Dashboard and Netlify has{" "}
          <code>STRIPE_CONNECT_ENABLED=true</code> (redeploy after changing env).
        </p>
      )}
      {message && (
        <p
          role="alert"
          className="mt-3 rounded-lg border border-[color:var(--tb-orange-deep)] bg-[color:var(--tb-orange-soft)] px-3 py-2 text-sm text-[color:var(--tb-ink)]"
        >
          {message}
        </p>
      )}
    </div>
  );
}
