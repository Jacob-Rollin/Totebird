"use client";

import Link from "next/link";
import { useEffect } from "react";

/**
 * Soft recovery for route errors — marketing and public pages should not
 * strand guests on a blank digest screen after Clerk/env blips.
 */
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[totebird] route error", error.digest ?? error.message);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 bg-[color:var(--tb-mist)] px-4 text-center">
      <h1 className="font-display text-2xl text-[color:var(--tb-ink)]">
        Something went wrong
      </h1>
      <p className="max-w-md text-[color:var(--tb-slate-soft)]">
        Totebird hit a temporary error loading this page. You can retry or go
        back to the homepage.
      </p>
      <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
        <button type="button" className="tb-btn tb-btn-primary" onClick={reset}>
          Try again
        </button>
        <Link href="/" className="tb-btn tb-btn-secondary">
          Home
        </Link>
      </div>
    </div>
  );
}
