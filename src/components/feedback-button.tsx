"use client";

import { useEffect, useId, useRef, useState } from "react";
import { usePathname } from "next/navigation";

type FeedbackType = "bug" | "suggestion";

export function FeedbackButton() {
  const pathname = usePathname();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<FeedbackType>("bug");
  const [message, setMessage] = useState("");
  const [pageUrl, setPageUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setPageUrl(`${window.location.origin}${pathname || "/app"}`);
  }, [pathname]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 3500);
    return () => window.clearTimeout(t);
  }, [toast]);

  function close() {
    setOpen(false);
    setError(null);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          body: message,
          pageUrl: pageUrl || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(
          typeof data.error === "string"
            ? data.error
            : "Could not send feedback",
        );
        return;
      }
      setMessage("");
      setType("bug");
      close();
      setToast("Thanks — we got your feedback.");
    } catch {
      setError("Network error. Try again in a moment.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="font-medium text-[color:var(--tb-slate-soft)] hover:text-[color:var(--tb-ink)]"
      >
        Feedback
      </button>

      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        className="fixed inset-0 m-auto w-[min(100%,28rem)] rounded-xl border border-[color:var(--tb-line)] bg-white p-0 text-[color:var(--tb-ink)] shadow-lg open:flex open:flex-col backdrop:bg-[color:var(--tb-ink)]/40"
        onClose={close}
        onClick={(e) => {
          if (e.target === dialogRef.current) close();
        }}
      >
        <form onSubmit={onSubmit} className="flex flex-col gap-4 p-5">
          <div>
            <h2 id={titleId} className="font-display text-2xl">
              Feedback
            </h2>
            <p className="mt-1 text-sm text-[color:var(--tb-slate-soft)]">
              Report a bug or share an idea. We read every note.
            </p>
          </div>

          <fieldset className="space-y-2">
            <legend className="tb-label">Type</legend>
            <div className="flex gap-2 text-sm">
              {(
                [
                  ["bug", "Bug"],
                  ["suggestion", "Suggestion"],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setType(value)}
                  className={`rounded-md px-3 py-1.5 ${
                    type === value
                      ? "bg-[color:var(--tb-orange-soft)] font-semibold text-[color:var(--tb-slate)]"
                      : "text-[color:var(--tb-slate-soft)] hover:text-[color:var(--tb-ink)]"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </fieldset>

          <div>
            <label className="tb-label" htmlFor="feedback-message">
              Message
            </label>
            <textarea
              id="feedback-message"
              className="tb-input min-h-[7rem] resize-y"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={
                type === "bug"
                  ? "What went wrong? What did you expect?"
                  : "What would make Totebird better for you?"
              }
              required
              minLength={3}
              maxLength={8000}
            />
          </div>

          <div>
            <label className="tb-label" htmlFor="feedback-page">
              Page (optional)
            </label>
            <input
              id="feedback-page"
              className="tb-input"
              value={pageUrl}
              onChange={(e) => setPageUrl(e.target.value)}
            />
          </div>

          {error && (
            <p className="text-sm text-rose-700" role="alert">
              {error}
            </p>
          )}

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={close}
              className="tb-btn tb-btn-secondary text-sm"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="tb-btn tb-btn-primary text-sm"
              disabled={submitting || message.trim().length < 3}
            >
              {submitting ? "Sending…" : "Send"}
            </button>
          </div>
        </form>
      </dialog>

      {toast && (
        <div
          role="status"
          className="fixed bottom-5 right-5 z-50 max-w-sm rounded-lg border border-[color:var(--tb-line)] bg-white px-4 py-3 text-sm text-[color:var(--tb-ink)] shadow-md"
        >
          <span className="font-medium text-[color:var(--tb-orange-deep)]">
            Totebird
          </span>
          <span className="mt-0.5 block">{toast}</span>
        </div>
      )}
    </>
  );
}
