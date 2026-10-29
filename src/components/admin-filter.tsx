"use client";

import { useEffect, useId, useState } from "react";

/** Client search that hides non-matching table body rows. */
export function AdminFilter({
  placeholder = "Search…",
  children,
}: {
  placeholder?: string;
  children: React.ReactNode;
}) {
  const [q, setQ] = useState("");
  const id = useId();

  useEffect(() => {
    const root = document.getElementById(id);
    if (!root) return;
    const needle = q.trim().toLowerCase();
    root.querySelectorAll("tbody tr").forEach((row) => {
      const text = row.textContent?.toLowerCase() || "";
      (row as HTMLElement).style.display =
        !needle || text.includes(needle) ? "" : "none";
    });
  }, [q, id, children]);

  return (
    <div>
      <input
        className="tb-input mb-4 max-w-md"
        placeholder={placeholder}
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      <div id={id}>{children}</div>
    </div>
  );
}
