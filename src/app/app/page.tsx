import Link from "next/link";
import { redirect } from "next/navigation";
import { CopyButton } from "@/components/copy-button";
import { StatusPill } from "@/components/status-pill";
import { requireSession } from "@/lib/auth";
import { countActiveLinks, listLinksForUser } from "@/lib/data";
import { appUrl } from "@/lib/env";
import { formatDate } from "@/lib/format";
import { canCreateLink, PLAN_LIMITS } from "@/lib/plans";
import { RemindButton } from "@/components/remind-button";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const session = await requireSession();
  if (!session) redirect("/sign-in");

  const links = await listLinksForUser(session.id);
  const active = await countActiveLinks(session.id);
  const limits = PLAN_LIMITS[session.plan];
  const canCreate = canCreateLink(session.plan, active);
  const base = appUrl();

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-[color:var(--tb-ink)]">
            Your links
          </h1>
          <p className="mt-1 text-[color:var(--tb-slate-soft)]">
            {active} active of{" "}
            {Number.isFinite(limits.activeLinks) ? limits.activeLinks : "∞"} ·{" "}
            {PLAN_LIMITS[session.plan].label} plan
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/app/links/new?type=checklist"
            className={`tb-btn tb-btn-primary text-sm ${!canCreate ? "pointer-events-none opacity-50" : ""}`}
          >
            New checklist
          </Link>
          <Link
            href="/app/links/new?type=invoice"
            className={`tb-btn tb-btn-secondary text-sm ${!canCreate ? "pointer-events-none opacity-50" : ""}`}
          >
            New invoice
          </Link>
        </div>
      </div>

      {!canCreate && (
        <p className="mt-4 rounded-lg border border-[color:var(--tb-orange)]/40 bg-[color:var(--tb-orange-soft)] px-4 py-3 text-sm">
          Active link limit reached. Close a link or upgrade to create more.
        </p>
      )}

      <div className="tb-panel mt-8 overflow-x-auto p-0">
        {links.length === 0 ? (
          <div className="p-10 text-center text-[color:var(--tb-slate-soft)]">
            No links yet. Create a checklist or invoice to get started.
          </div>
        ) : (
          <table className="tb-card-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Type</th>
                <th>Status</th>
                <th>Created</th>
                <th>Link</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {links.map((link) => {
                const path =
                  link.type === "checklist"
                    ? `/c/${link.token}`
                    : `/i/${link.token}`;
                const url = `${base}${path}`;
                return (
                  <tr key={link.id}>
                    <td className="font-medium">{link.title}</td>
                    <td className="capitalize">{link.type}</td>
                    <td>
                      <StatusPill status={link.status} />
                    </td>
                    <td className="text-[color:var(--tb-slate-soft)]">
                      {formatDate(link.createdAt)}
                    </td>
                    <td>
                      <div className="flex flex-wrap items-center gap-2">
                        <code className="max-w-[140px] truncate text-xs text-[color:var(--tb-slate-soft)]">
                          {path}
                        </code>
                        <CopyButton value={url} />
                      </div>
                    </td>
                    <td>
                      <div className="flex flex-wrap gap-2">
                        <Link
                          href={`/app/links/${link.id}`}
                          className="text-sm font-medium text-[color:var(--tb-orange-deep)]"
                        >
                          View
                        </Link>
                        {link.status === "active" && link.clientEmail && (
                          <RemindButton linkId={link.id} />
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
