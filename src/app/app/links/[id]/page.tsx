import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CopyButton } from "@/components/copy-button";
import { ProgressBar } from "@/components/progress-bar";
import { StatusPill } from "@/components/status-pill";
import { requireSession } from "@/lib/auth";
import {
  duplicateLink,
  getChecklistBundle,
  getInvoiceBundle,
  getLinkById,
  getLinkProgress,
  markInvoicePaid,
  updateLinkStatus,
} from "@/lib/data";
import { appUrl } from "@/lib/env";
import { formatDate, formatMoney } from "@/lib/format";
import { canCreateLink } from "@/lib/plans";
import { countActiveLinks } from "@/lib/data";

export default async function LinkDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireSession();
  if (!session) redirect("/sign-in");
  const { id } = await params;
  const link = await getLinkById(id);
  if (!link || link.userId !== session.id) notFound();

  const base = appUrl();
  const path = link.type === "checklist" ? `/c/${link.token}` : `/i/${link.token}`;
  const url = `${base}${path}`;
  const printUrl = link.type === "invoice" ? `${base}/i/${link.token}/print` : null;

  let items: {
    id: string;
    label: string;
    done: boolean;
    itemType: string;
    required: boolean;
    answerText: string | null;
  }[] = [];
  let invoice: {
    amountCents: number;
    currency: string;
    description: string | null;
    dueAt: Date | null;
    status: string;
    paidManually: boolean;
  } | null = null;
  let lineItems: {
    id: string;
    description: string;
    quantity: number;
    unitAmountCents: number;
  }[] = [];
  let progress = { percent: 0, done: 0, total: 0 };

  if (link.type === "checklist") {
    const bundle = await getChecklistBundle(link.token);
    items = bundle?.items ?? [];
    progress = await getLinkProgress(link.id);
  } else {
    const bundle = await getInvoiceBundle(link.token);
    invoice = bundle?.invoice ?? null;
    lineItems = bundle?.lineItems ?? [];
  }

  async function closeLink() {
    "use server";
    const s = await requireSession();
    if (!s) return;
    const l = await getLinkById(id);
    if (!l || l.userId !== s.id) return;
    await updateLinkStatus(id, "closed");
    redirect(`/app/links/${id}`);
  }
  async function reopenLink() {
    "use server";
    const s = await requireSession();
    if (!s) return;
    const l = await getLinkById(id);
    if (!l || l.userId !== s.id) return;
    await updateLinkStatus(id, "active");
    redirect(`/app/links/${id}`);
  }
  async function archiveLink() {
    "use server";
    const s = await requireSession();
    if (!s) return;
    const l = await getLinkById(id);
    if (!l || l.userId !== s.id) return;
    await updateLinkStatus(id, "archived");
    redirect(`/app/links/${id}`);
  }

  async function duplicateAction() {
    "use server";
    const s = await requireSession();
    if (!s) return;
    const active = await countActiveLinks(s.id);
    if (!canCreateLink(s.plan, active)) {
      redirect("/app?limit=1");
    }
    const copy = await duplicateLink(id, s.id);
    if (copy) redirect(`/app/links/${copy.id}`);
    redirect(`/app/links/${id}`);
  }

  async function markPaidManual() {
    "use server";
    const s = await requireSession();
    if (!s) return;
    const l = await getLinkById(id);
    if (!l || l.userId !== s.id || l.type !== "invoice") return;
    await markInvoicePaid(id, null, true);
    redirect(`/app/links/${id}`);
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/app" className="text-sm text-[color:var(--tb-slate-soft)]">
        ← Back
      </Link>
      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl">{link.title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <StatusPill status={link.status} />
            <span className="capitalize text-sm text-[color:var(--tb-slate-soft)]">
              {link.type}
            </span>
            <span className="text-sm text-[color:var(--tb-slate-soft)]">
              Created {formatDate(link.createdAt)}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <form action={duplicateAction}>
            <button type="submit" className="tb-btn tb-btn-secondary text-sm">
              Duplicate
            </button>
          </form>
          {link.status === "active" || link.status === "completed" ? (
            <>
              <form action={closeLink}>
                <button type="submit" className="tb-btn tb-btn-secondary text-sm">
                  Close
                </button>
              </form>
              <form action={archiveLink}>
                <button type="submit" className="tb-btn tb-btn-ghost text-sm">
                  Archive
                </button>
              </form>
            </>
          ) : (
            <form action={reopenLink}>
              <button type="submit" className="tb-btn tb-btn-secondary text-sm">
                Reopen
              </button>
            </form>
          )}
        </div>
      </div>

      <div className="tb-panel mt-8">
        <p className="tb-label">Client link</p>
        <div className="flex flex-wrap items-center gap-3">
          <code className="break-all text-sm">{url}</code>
          <CopyButton value={url} />
        </div>
        {link.clientEmail && (
          <p className="mt-3 text-sm text-[color:var(--tb-slate-soft)]">
            Client: {link.clientEmail}
          </p>
        )}
      </div>

      {link.type === "checklist" && (
        <div className="tb-panel mt-6">
          <div className="mb-4">
            <ProgressBar
              percent={progress.percent}
              label={`${progress.done} of ${progress.total} complete`}
            />
          </div>
          <h2 className="font-semibold">Items</h2>
          <ul className="mt-4 space-y-2">
            {items.map((item) => (
              <li key={item.id} className="flex items-start gap-2 text-sm">
                <span
                  className={`mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                    item.done
                      ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                      : "border-[color:var(--tb-line)]"
                  }`}
                >
                  {item.done ? "✓" : ""}
                </span>
                <div>
                  <span
                    className={
                      item.done ? "text-[color:var(--tb-slate-soft)] line-through" : ""
                    }
                  >
                    {item.label}
                  </span>
                  <span className="ml-2 text-xs text-[color:var(--tb-slate-soft)]">
                    {item.itemType === "file"
                      ? "File upload"
                      : item.itemType === "text"
                        ? "Text answer"
                        : "Checkbox"}
                    {!item.required ? " · optional" : ""}
                  </span>
                  {item.answerText && (
                    <p className="mt-1 text-[color:var(--tb-slate-soft)]">
                      “{item.answerText}”
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {invoice && (
        <div className="tb-panel mt-6 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-semibold">Invoice</h2>
            {printUrl && (
              <Link
                href={printUrl}
                target="_blank"
                className="text-sm font-medium text-[color:var(--tb-orange-deep)]"
              >
                Print view
              </Link>
            )}
          </div>
          <p className="font-display text-3xl">
            {formatMoney(invoice.amountCents, invoice.currency)}
          </p>
          {invoice.description && (
            <p className="text-[color:var(--tb-slate-soft)]">{invoice.description}</p>
          )}
          <p className="text-sm">
            Status: <StatusPill status={invoice.status} />
            {invoice.paidManually && (
              <span className="ml-2 text-xs text-[color:var(--tb-slate-soft)]">
                (manual)
              </span>
            )}
            {invoice.dueAt && <> · Due {formatDate(invoice.dueAt)}</>}
          </p>
          {lineItems.length > 0 && (
            <table className="tb-card-table mt-2 text-sm">
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Qty</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {lineItems.map((li) => (
                  <tr key={li.id}>
                    <td>{li.description}</td>
                    <td>{li.quantity}</td>
                    <td>
                      {formatMoney(li.quantity * li.unitAmountCents, invoice.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {invoice.status !== "paid" && (
            <form action={markPaidManual}>
              <button type="submit" className="tb-btn tb-btn-secondary text-sm">
                Mark paid manually
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
