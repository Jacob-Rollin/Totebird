import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { InvoiceClient } from "@/components/invoice-client";
import { StatusPill } from "@/components/status-pill";
import { getInvoiceBundle } from "@/lib/data";
import { formatDate, formatMoney } from "@/lib/format";
import { invoiceConnectGate } from "@/lib/stripe-connect";

export default async function ClientInvoicePage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ paid?: string; canceled?: string }>;
}) {
  const { token } = await params;
  const q = await searchParams;
  const bundle = await getInvoiceBundle(token);
  if (!bundle || !bundle.invoice) notFound();

  const { link, invoice, lineItems, owner } = bundle;
  const closed =
    link.status === "closed" ||
    link.status === "disabled" ||
    link.status === "archived";
  const paid = invoice.status === "paid" || q.paid === "1";
  const gate = invoiceConnectGate(owner ?? {});
  const payBlockedMessage =
    !paid && !closed && !gate.ok ? gate.message : null;

  return (
    <div className="min-h-screen bg-[color:var(--tb-mist)]">
      <header className="border-b border-[color:var(--tb-line)] bg-white">
        <div className="tb-shell flex items-center justify-between gap-3 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <Image
              src="/brand/icon/icon-orange-bird.png"
              alt=""
              width={36}
              height={36}
              className="shrink-0"
            />
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-[0.12em] text-[color:var(--tb-slate-soft)]">
                Invoice from {owner?.name || owner?.email || "your freelancer"}
              </p>
              <h1 className="truncate text-lg font-semibold">{link.title}</h1>
            </div>
          </div>
          <Link href={`/i/${token}/print`} className="text-sm font-medium text-[color:var(--tb-slate-soft)]">
            Print
          </Link>
        </div>
      </header>

      <main className="tb-shell max-w-lg py-8 sm:py-10">
        {q.canceled === "1" && (
          <p className="mb-4 rounded-lg bg-[color:var(--tb-orange-soft)] px-4 py-3 text-sm">
            Checkout canceled — you can try again anytime.
          </p>
        )}

        <div className="tb-panel space-y-4">
          <div className="flex items-center justify-between gap-3">
            <StatusPill status={paid ? "paid" : invoice.status} />
            {invoice.dueAt && (
              <span className="text-sm text-[color:var(--tb-slate-soft)]">
                Due {formatDate(invoice.dueAt)}
              </span>
            )}
          </div>
          <p className="font-display text-4xl">
            {formatMoney(invoice.amountCents, invoice.currency)}
          </p>
          {invoice.description && (
            <p className="text-[color:var(--tb-slate-soft)]">{invoice.description}</p>
          )}

          {lineItems.length > 0 && (
            <ul className="space-y-2 border-t border-[color:var(--tb-line)] pt-4 text-sm">
              {lineItems.map((li) => (
                <li key={li.id} className="flex justify-between gap-3">
                  <span>
                    {li.description}
                    {li.quantity > 1 ? ` × ${li.quantity}` : ""}
                  </span>
                  <span>
                    {formatMoney(
                      li.quantity * li.unitAmountCents,
                      invoice.currency,
                    )}
                  </span>
                </li>
              ))}
            </ul>
          )}

          {!closed && (
            <InvoiceClient
              token={token}
              amountCents={invoice.amountCents}
              currency={invoice.currency}
              paid={paid}
              readOnly={closed}
              payBlockedMessage={payBlockedMessage}
            />
          )}
          {closed && !paid && (
            <p className="text-sm text-[color:var(--tb-slate-soft)]">
              This invoice link is closed.
            </p>
          )}
        </div>
        <p className="mt-10 text-center text-xs text-[color:var(--tb-slate-soft)]">
          Powered by Totebird · Payments via Stripe
        </p>
      </main>
    </div>
  );
}
