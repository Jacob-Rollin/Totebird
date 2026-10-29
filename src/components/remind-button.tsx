"use client";

import { useState } from "react";

export function RemindButton({ linkId }: { linkId: string }) {
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">(
    "idle",
  );
  const [message, setMessage] = useState<string | null>(null);

  return (
    <button
      type="button"
      className="text-sm font-medium text-[color:var(--tb-slate-soft)] hover:text-[color:var(--tb-ink)]"
      disabled={state === "sending"}
      onClick={async () => {
        setState("sending");
        try {
          const res = await fetch("/api/remind", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ linkId }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "Failed");
          setMessage(data.message || "Sent");
          setState("sent");
        } catch (e) {
          setMessage(e instanceof Error ? e.message : "Error");
          setState("error");
        }
      }}
    >
      {state === "sent" ? message || "Reminded" : state === "sending" ? "…" : "Remind"}
    </button>
  );
}
