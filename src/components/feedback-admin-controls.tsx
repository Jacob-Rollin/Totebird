"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const STATUSES = ["new", "triaged", "planned", "done", "wontfix"] as const;
const PRIORITIES = ["low", "normal", "high"] as const;

export function FeedbackAdminControls({
  id,
  status,
  priority,
}: {
  id: string;
  status: string;
  priority: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function patch(next: { status?: string; priority?: string }) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/feedback/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(
          typeof data.error === "string" ? data.error : "Update failed",
        );
        return;
      }
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex flex-wrap gap-2">
        <label className="sr-only" htmlFor={`status-${id}`}>
          Status
        </label>
        <select
          id={`status-${id}`}
          className="tb-input py-1 text-sm"
          value={status}
          disabled={busy}
          onChange={(e) => patch({ status: e.target.value })}
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <label className="sr-only" htmlFor={`priority-${id}`}>
          Priority
        </label>
        <select
          id={`priority-${id}`}
          className="tb-input py-1 text-sm"
          value={priority}
          disabled={busy}
          onChange={(e) => patch({ priority: e.target.value })}
        >
          {PRIORITIES.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>
      {error && <p className="text-xs text-rose-700">{error}</p>}
    </div>
  );
}
