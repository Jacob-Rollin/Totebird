import Link from "next/link";
import { redirect } from "next/navigation";
import { CopyButton } from "@/components/copy-button";
import { ProgressBar } from "@/components/progress-bar";
import { StatusPill } from "@/components/status-pill";
import { RemindButton } from "@/components/remind-button";
import { requireSession } from "@/lib/auth";
import {
  countActiveLinks,
  getLinkProgress,
  listLinksForUser,
  storageUsedByUser,
} from "@/lib/data";
import { appUrl, integrationStatus } from "@/lib/env";
import { formatDate } from "@/lib/format";
import {
  canCreateLink,
  checklistProgressLabel,
  PLAN_LIMITS,
  storageUsageMessage,
} from "@/lib/plans";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ limit?: string }>;
}) {
  const session = await requireSession();
  if (!session) redirect("/sign-in");

  const q = await searchParams;
  const links = await listLinksForUser(session.id);
  const active = await countActiveLinks(session.id);
  const usedBytes = await storageUsedByUser(session.id);
  const limits = PLAN_LIMITS[session.plan];
  const canCreate = canCreateLink(session.plan, active);
  const base = appUrl();
  const integrations = integrationStatus();
  const needsConnect =
    integrations.demoMode ||
    !integrations.stripe ||
    !integrations.r2 ||
    !integrations.resend;

  const progressById: Record<string, { percent: number; done: number; total: number }> =
    {};
  await Promise.all(
    links
      .filter((l) => l.type === "checklist")
      .map(async (l) => {
        progressById[l.id] = await getLinkProgress(l.id);
      }),
  );

  const visible = links.filter((l) => l.status !== "archived");
  const archived = links.filter((l) => l.status === "archived");

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
            {storageUsageMessage(usedBytes, session.plan)} ·{" "}
            <Link href="/app/billing" className="font-medium text-[color:var(--tb-orange-deep)]">
              {PLAN_LIMITS[session.plan].label} plan
            </Link>
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

      {(q.limit || !canCreate) && (
        <p className="mt-4 rounded-lg border border-[color:var(--tb-orange)]/40 bg-[color:var(--tb-orange-soft)] px-4 py-3 text-sm">
          Active link limit reached on {PLAN_LIMITS[session.plan].label}. Close or
          archive a link, or{" "}
          <Link href="/app/billing" className="font-semibold underline">
            upgrade
          </Link>
          .
        </p>
      )}

      {needsConnect && (
        <p className="mt-4 rounded-lg border border-[color:var(--tb-line)] bg-white px-4 py-3 text-sm text-[color:var(--tb-slate)]">
          Connect Stripe, B2, and Resend when ready —{" "}
          <Link
            href="/app/settings"
            className="font-semibold text-[color:var(--tb-orange-deep)]"
          >
            open settings checklist
          </Link>
          .
        </p>
      )}

      <div className="tb-panel mt-8 overflow-x-auto p-0">
        {visible.length === 0 ? (
          <div className="p-10 text-center">
            <p className="font-display text-xl text-[color:var(--tb-ink)]">
              No active links yet
            </p>
            <p className="mt-2 text-[color:var(--tb-slate-soft)]">
              Create a checklist or invoice — clients open it without an account.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              <Link href="/app/links/new?type=checklist" className="tb-btn tb-btn-primary text-sm">
                New checklist
              </Link>
              <Link href="/demo" className="tb-btn tb-btn-secondary text-sm">
                Try demo first
              </Link>
            </div>
          </div>
        ) : (
          <table className="tb-card-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Type</th>
                <th>Status</th>
                <th>Progress</th>
                <th>Created</th>
                <th>Link</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {visible.map((link) => {
                const path =
                  link.type === "checklist"
                    ? `/c/${link.token}`
                    : `/i/${link.token}`;
                const url = `${base}${path}`;
                const progress = progressById[link.id];
                return (
                  <tr key={link.id}>
                    <td className="font-medium">{link.title}</td>
                    <td className="capitalize">{link.type}</td>
                    <td>
                      <StatusPill status={link.status} />
                    </td>
                    <td className="min-w-[120px]">
                      {link.type === "checklist" && progress ? (
                        <ProgressBar
                          percent={progress.percent}
                          label={checklistProgressLabel(progress)}
                        />
                      ) : (
                        <span className="text-[color:var(--tb-slate-soft)]">—</span>
                      )}
                    </td>
                    <td className="text-[color:var(--tb-slate-soft)]">
                      {formatDate(link.createdAt)}
                    </td>
                    <td>
                      <div className="flex flex-wrap items-center gap-2">
                        <code className="max-w-[120px] truncate text-xs text-[color:var(--tb-slate-soft)]">
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

      {archived.length > 0 && (
        <details className="mt-6">
          <summary className="cursor-pointer text-sm font-medium text-[color:var(--tb-slate-soft)]">
            Archived ({archived.length})
          </summary>
          <ul className="mt-3 space-y-2 text-sm">
            {archived.map((l) => (
              <li key={l.id}>
                <Link href={`/app/links/${l.id}`} className="text-[color:var(--tb-orange-deep)]">
                  {l.title}
                </Link>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
