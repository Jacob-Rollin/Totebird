"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

const STATUSES = ["new", "triaged", "planned", "done", "wontfix"] as const;
const PRIORITIES = ["low", "normal", "high"] as const;
const KINDS = ["feature", "fix", "improvement"] as const;

function defaultTitle(body: string) {
  const firstLine = body.trim().split(/\r?\n/)[0]?.trim() || "Update";
  return firstLine.length > 100 ? `${firstLine.slice(0, 97)}…` : firstLine;
}

function defaultKind(type: string) {
  return type === "bug" ? "fix" : "feature";
}

export function FeedbackAdminControls({
  id,
  status,
  priority,
  type,
  body,
}: {
  id: string;
  status: string;
  priority: string;
  type: string;
  body: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState(() => defaultTitle(body));
  const [kind, setKind] = useState(() => defaultKind(type));
  const isDone = status === "done";

  const canPublish = useMemo(
    () => isDone && title.trim().length >= 3,
    [isDone, title],
  );

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

  async function onDelete() {
    if (
      !window.confirm(
        "Delete this feedback permanently? This does not add a changelog entry.",
      )
    ) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/feedback/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(
          typeof data.error === "string" ? data.error : "Delete failed",
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

  async function onPublishAndRemove() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/feedback/${id}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          kind,
          body,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(
          typeof data.error === "string" ? data.error : "Publish failed",
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
    <div className="flex min-w-[14rem] flex-col gap-2">
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

      {isDone && (
        <div className="rounded-md border border-[color:var(--tb-line)] bg-[color:var(--tb-mist)] p-2">
          <label className="tb-label" htmlFor={`title-${id}`}>
            Changelog title
          </label>
          <input
            id={`title-${id}`}
            className="tb-input text-sm"
            value={title}
            disabled={busy}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={200}
          />
          <label className="tb-label mt-2" htmlFor={`kind-${id}`}>
            Kind
          </label>
          <select
            id={`kind-${id}`}
            className="tb-input py-1 text-sm"
            value={kind}
            disabled={busy}
            onChange={(e) => setKind(e.target.value)}
          >
            {KINDS.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="tb-btn tb-btn-primary mt-2 w-full text-sm"
            disabled={busy || !canPublish}
            onClick={onPublishAndRemove}
          >
            Publish & remove
          </button>
        </div>
      )}

      <button
        type="button"
        className="text-left text-sm font-medium text-rose-700 hover:underline disabled:opacity-50"
        disabled={busy}
        onClick={onDelete}
      >
        Delete
      </button>

      {error && <p className="text-xs text-rose-700">{error}</p>}
    </div>
  );
}
