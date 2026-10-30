import Link from "next/link";
import { FeedbackAdminControls } from "@/components/feedback-admin-controls";
import { StatusPill } from "@/components/status-pill";
import { listFeedback } from "@/lib/data";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata = { title: "Admin · Feedback" };

const TYPE_OPTS = ["", "bug", "suggestion"] as const;
const STATUS_OPTS = [
  "",
  "new",
  "triaged",
  "planned",
  "done",
  "wontfix",
] as const;

export default async function AdminFeedbackPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; status?: string }>;
}) {
  const sp = await searchParams;
  const type =
    sp.type === "bug" || sp.type === "suggestion" ? sp.type : undefined;
  const status =
    sp.status === "new" ||
    sp.status === "triaged" ||
    sp.status === "planned" ||
    sp.status === "done" ||
    sp.status === "wontfix"
      ? sp.status
      : undefined;

  let rows: Awaited<ReturnType<typeof listFeedback>> = [];
  try {
    rows = await listFeedback({ type, status });
  } catch (err) {
    console.error("[totebird] admin feedback list soft-fail", err);
  }

  function hrefFor(next: { type?: string; status?: string }) {
    const q = new URLSearchParams();
    const t = next.type ?? type ?? "";
    const s = next.status ?? status ?? "";
    if (t) q.set("type", t);
    if (s) q.set("status", s);
    const qs = q.toString();
    return qs ? `/admin/feedback?${qs}` : "/admin/feedback";
  }

  return (
    <div>
      <h1 className="font-display text-3xl">Feedback</h1>
      <p className="mt-1 text-sm text-[color:var(--tb-slate-soft)]">
        Bugs and suggestions from freelancers. Newest first. Mark{" "}
        <span className="font-medium text-[color:var(--tb-ink)]">done</span>,
        then Publish & remove to post on{" "}
        <Link
          href="/changelog"
          className="text-[color:var(--tb-orange-deep)]"
          target="_blank"
        >
          /changelog
        </Link>
        , or Delete noise.
      </p>

      <form className="mt-6 flex flex-wrap items-end gap-3" method="get">
        <div>
          <label className="tb-label" htmlFor="filter-type">
            Type
          </label>
          <select
            id="filter-type"
            name="type"
            defaultValue={type ?? ""}
            className="tb-input"
          >
            {TYPE_OPTS.map((t) => (
              <option key={t || "all"} value={t}>
                {t || "All"}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="tb-label" htmlFor="filter-status">
            Status
          </label>
          <select
            id="filter-status"
            name="status"
            defaultValue={status ?? ""}
            className="tb-input"
          >
            {STATUS_OPTS.map((s) => (
              <option key={s || "all"} value={s}>
                {s || "All"}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" className="tb-btn tb-btn-secondary text-sm">
          Filter
        </button>
        {(type || status) && (
          <Link
            href="/admin/feedback"
            className="text-sm text-[color:var(--tb-slate-soft)] hover:text-[color:var(--tb-ink)]"
          >
            Clear
          </Link>
        )}
      </form>

      <div className="tb-panel mt-6 overflow-x-auto p-0">
        <table className="tb-card-table">
          <thead>
            <tr>
              <th>When</th>
              <th>Type</th>
              <th>From</th>
              <th>Message</th>
              <th>Page</th>
              <th>Triage</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="whitespace-nowrap text-sm">
                  {formatDate(r.createdAt)}
                </td>
                <td>
                  <StatusPill status={r.type} />
                </td>
                <td className="text-sm">{r.ownerEmail || "—"}</td>
                <td className="max-w-[28rem] whitespace-pre-wrap text-sm">
                  {r.body}
                </td>
                <td className="max-w-[12rem] truncate text-xs text-[color:var(--tb-slate-soft)]">
                  {r.pageUrl || "—"}
                </td>
                <td>
                  <div className="mb-1 flex flex-wrap gap-1">
                    <StatusPill status={r.status} />
                    <StatusPill status={r.priority} />
                  </div>
                  <FeedbackAdminControls
                    id={r.id}
                    status={r.status}
                    priority={r.priority}
                    type={r.type}
                    body={r.body}
                  />
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="text-[color:var(--tb-slate-soft)]"
                >
                  No feedback yet
                  {type || status ? " for these filters" : ""}. If Neon is
                  missing the table, run{" "}
                  <code className="text-xs">neon-feedback-table.sql</code> in
                  the Neon SQL Editor.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Keep filter links crawlable for quick status jumps */}
      <div className="mt-4 flex flex-wrap gap-3 text-xs text-[color:var(--tb-slate-soft)]">
        <Link href={hrefFor({ status: "new" })} className="hover:text-[color:var(--tb-ink)]">
          New only
        </Link>
        <Link href={hrefFor({ type: "bug" })} className="hover:text-[color:var(--tb-ink)]">
          Bugs
        </Link>
        <Link
          href={hrefFor({ type: "suggestion" })}
          className="hover:text-[color:var(--tb-ink)]"
        >
          Suggestions
        </Link>
      </div>
    </div>
  );
}
