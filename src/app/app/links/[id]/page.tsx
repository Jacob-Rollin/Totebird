import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CopyButton } from "@/components/copy-button";
import { StatusPill } from "@/components/status-pill";
import { requireSession } from "@/lib/auth";
import {
  getChecklistBundle,
  getInvoiceBundle,
  getLinkById,
  updateLinkStatus,
} from "@/lib/data";
import { appUrl } from "@/lib/env";
import { formatDate, formatMoney } from "@/lib/format";

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

  let items: { id: string; label: string; done: boolean }[] = [];
  let invoice: {
    amountCents: number;
    currency: string;
    description: string | null;
    dueAt: Date | null;
    status: string;
  } | null = null;

  if (link.type === "checklist") {
    const bundle = await getChecklistBundle(link.token);
    items = bundle?.items ?? [];
  } else {
    const bundle = await getInvoiceBundle(link.token);
    invoice = bundle?.invoice ?? null;
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
        {link.status === "active" || link.status === "completed" ? (
          <form action={closeLink}>
            <button type="submit" className="tb-btn tb-btn-secondary text-sm">
              Close link
            </button>
          </form>
        ) : (
          <form action={reopenLink}>
            <button type="submit" className="tb-btn tb-btn-secondary text-sm">
              Reopen
            </button>
          </form>
        )}
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
          <h2 className="font-semibold">Items</h2>
          <ul className="mt-4 space-y-2">
            {items.map((item) => (
              <li key={item.id} className="flex items-center gap-2 text-sm">
                <span
                  className={`inline-flex h-5 w-5 items-center justify-center rounded border ${
                    item.done
                      ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                      : "border-[color:var(--tb-line)]"
                  }`}
                >
                  {item.done ? "✓" : ""}
                </span>
                <span className={item.done ? "text-[color:var(--tb-slate-soft)] line-through" : ""}>
                  {item.label}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {invoice && (
        <div className="tb-panel mt-6 space-y-2">
          <h2 className="font-semibold">Invoice</h2>
          <p className="font-display text-3xl">
            {formatMoney(invoice.amountCents, invoice.currency)}
          </p>
          {invoice.description && (
            <p className="text-[color:var(--tb-slate-soft)]">{invoice.description}</p>
          )}
          <p className="text-sm">
            Status: <StatusPill status={invoice.status} />
            {invoice.dueAt && <> · Due {formatDate(invoice.dueAt)}</>}
          </p>
        </div>
      )}
    </div>
  );
}
