import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ChecklistFileList,
  type ChecklistFileView,
} from "@/components/checklist-file-list";
import { CopyButton } from "@/components/copy-button";
import { ProgressBar } from "@/components/progress-bar";
import { StatusPill } from "@/components/status-pill";
import { requireSession } from "@/lib/auth";
import { filesBaseUrl, resolveFileDownloadHref } from "@/lib/b2";
import {
  countActiveLinks,
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
import {
  CONNECT_REQUIRED_MESSAGE,
  invoiceConnectGate,
} from "@/lib/stripe-connect";

export default async function LinkDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await requireSession();
  if (!session) redirect("/sign-in");
  const { id } = await params;
  const q = await searchParams;
  const link = await getLinkById(id);
  if (!link || link.userId !== session.id) notFound();

  const base = appUrl();
  const path = link.type === "checklist" ? `/c/${link.token}` : `/i/${link.token}`;
  const url = `${base}${path}`;
  const printUrl = link.type === "invoice" ? `${base}/i/${link.token}/print` : null;
  const connectGate = invoiceConnectGate(session);
  const invoicePayBlocked =
    link.type === "invoice" && !connectGate.ok;

  let items: {
    id: string;
    label: string;
    done: boolean;
    itemType: string;
    required: boolean;
    answerText: string | null;
  }[] = [];
  type FileWithSlot = ChecklistFileView & { checklistItemId: string | null };
  let linkFiles: FileWithSlot[] = [];
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
    linkFiles = (bundle?.files ?? []).map((f) => ({
      id: f.id,
      filename: f.filename,
      sizeBytes: f.sizeBytes,
      downloadHref: resolveFileDownloadHref({
        fileId: f.id,
        storageKey: f.storageKey,
      }),
      checklistItemId: f.checklistItemId ?? null,
    }));
    progress = await getLinkProgress(link.id);
  } else {
    const bundle = await getInvoiceBundle(link.token);
    invoice = bundle?.invoice ?? null;
    lineItems = bundle?.lineItems ?? [];
  }

  const filesForItem = (itemId: string) =>
    linkFiles.filter((f) => f.checklistItemId === itemId);
  const extraFiles = linkFiles.filter((f) => !f.checklistItemId);
  const cdnConfigured = Boolean(filesBaseUrl());

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
    if (l.type === "invoice") {
      const gate = invoiceConnectGate(s);
      if (!gate.ok) {
        redirect(`/app/links/${id}?error=connect`);
      }
    }
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
      {q.error === "connect" && (
        <p className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
          {CONNECT_REQUIRED_MESSAGE}{" "}
          <Link
            href="/app/settings"
            className="font-semibold underline-offset-2 hover:underline"
          >
            Open Settings
          </Link>
        </p>
      )}

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
        {invoicePayBlocked && (
          <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900">
            {CONNECT_REQUIRED_MESSAGE} Guest pay is blocked until Stripe is
            ready.{" "}
            <Link
              href="/app/settings"
              className="font-semibold underline-offset-2 hover:underline"
            >
              Open Settings
            </Link>
          </p>
        )}
        {link.clientEmail && (
          <p className="mt-3 text-sm text-[color:var(--tb-slate-soft)]">
            Client: {link.clientEmail}
          </p>
        )}
      </div>

      {link.type === "checklist" && (
        <>
          <div className="tb-panel mt-6">
            <div className="mb-4">
              <ProgressBar
                percent={progress.percent}
                label={`${progress.done} of ${progress.total} complete`}
              />
            </div>
            <h2 className="font-semibold">Items</h2>
            <ul className="mt-4 space-y-4">
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
                  <div className="min-w-0 flex-1">
                    <span
                      className={
                        item.done
                          ? "text-[color:var(--tb-slate-soft)] line-through"
                          : ""
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
                    {item.itemType === "file" && (
                      <ChecklistFileList files={filesForItem(item.id)} />
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="tb-panel mt-6">
            <h2 className="font-semibold">Extra uploads</h2>
            <p className="mt-1 text-sm text-[color:var(--tb-slate-soft)]">
              Files the client dropped outside a specific checklist slot.
            </p>
            <ChecklistFileList
              files={extraFiles}
              emptyLabel="No extra uploads"
            />
            {!cdnConfigured && linkFiles.length > 0 && (
              <p className="mt-4 text-xs text-[color:var(--tb-slate-soft)]">
                Downloads use a signed app link until{" "}
                <code className="text-[0.7rem]">NEXT_PUBLIC_FILES_BASE_URL</code>{" "}
                is set (e.g.{" "}
                <code className="text-[0.7rem]">https://files.totebird.com</code>
                ). See Settings.
              </p>
            )}
          </div>
        </>
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
