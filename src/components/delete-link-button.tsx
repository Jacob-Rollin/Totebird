"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteLinkPermanently } from "@/app/actions/delete-link";

const CONFIRM_WORD = "DELETE";

type Props = {
  linkId: string;
  /** Where to go after a successful delete (e.g. /app or /admin/links). */
  redirectTo: string;
  /** Compact text control for admin tables. */
  variant?: "button" | "link";
  className?: string;
};

/**
 * Hard-delete confirm UI. Archive/Close free an active slot but keep files;
 * Delete removes the link, items, files, and B2 objects so storage frees.
 */
export function DeleteLinkButton({
  linkId,
  redirectTo,
  variant = "button",
  className = "",
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function close() {
    if (pending) return;
    setOpen(false);
    setTyped("");
    setError(null);
  }

  function onConfirm() {
    if (typed.trim().toUpperCase() !== CONFIRM_WORD) {
      setError(`Type ${CONFIRM_WORD} to confirm.`);
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await deleteLinkPermanently(linkId);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setOpen(false);
      router.push(redirectTo);
      router.refresh();
    });
  }

  const triggerClass =
    variant === "link"
      ? `text-sm font-medium text-rose-700 hover:underline disabled:opacity-50 ${className}`
      : `tb-btn tb-btn-ghost text-sm text-rose-700 hover:bg-rose-50 ${className}`;

  return (
    <>
      <button
        type="button"
        className={triggerClass}
        onClick={() => setOpen(true)}
        disabled={pending}
      >
        Delete
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby={`delete-link-title-${linkId}`}
          onClick={(e) => {
            if (e.target === e.currentTarget) close();
          }}
        >
          <div className="w-full max-w-md rounded-xl border border-[color:var(--tb-line)] bg-white p-5 shadow-lg">
            <h2
              id={`delete-link-title-${linkId}`}
              className="font-display text-xl text-[color:var(--tb-ink)]"
            >
              Delete permanently?
            </h2>
            <p className="mt-2 text-sm text-[color:var(--tb-slate)]">
              This removes the link, checklist items, invoice rows, and uploaded
              files from storage. Storage frees for your plan. Guest links will
              404. This cannot be undone.
            </p>
            <p className="mt-3 text-sm text-[color:var(--tb-slate-soft)]">
              Archive keeps files and frees an active slot. Delete frees
              storage.
            </p>
            <label className="mt-4 block text-sm font-medium text-[color:var(--tb-ink)]">
              Type {CONFIRM_WORD} to confirm
              <input
                type="text"
                autoComplete="off"
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                className="mt-1 w-full rounded-lg border border-[color:var(--tb-line)] px-3 py-2 text-sm outline-none focus:border-[color:var(--tb-orange)]"
                disabled={pending}
              />
            </label>
            {error && (
              <p className="mt-2 text-sm text-rose-700" role="alert">
                {error}
              </p>
            )}
            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                className="tb-btn tb-btn-secondary text-sm"
                onClick={close}
                disabled={pending}
              >
                Cancel
              </button>
              <button
                type="button"
                className="tb-btn text-sm bg-rose-700 text-white hover:bg-rose-800 disabled:opacity-50"
                onClick={onConfirm}
                disabled={
                  pending || typed.trim().toUpperCase() !== CONFIRM_WORD
                }
              >
                {pending ? "Deleting…" : "Delete permanently"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
