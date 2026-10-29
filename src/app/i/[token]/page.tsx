import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { InvoiceClient } from "@/components/invoice-client";
import { StatusPill } from "@/components/status-pill";
import { getInvoiceBundle } from "@/lib/data";
import { formatDate, formatMoney } from "@/lib/format";

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

  const { link, invoice, owner } = bundle;
  const closed = link.status === "closed" || link.status === "disabled";
  const paid = invoice.status === "paid" || q.paid === "1";

  return (
    <div className="min-h-screen bg-[color:var(--tb-mist)]">
      <header className="border-b border-[color:var(--tb-line)] bg-white">
        <div className="tb-shell flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <Image
              src="/brand/icon/icon-orange-bird.png"
              alt=""
              width={36}
              height={36}
            />
            <div>
              <p className="text-xs uppercase tracking-[0.12em] text-[color:var(--tb-slate-soft)]">
                Invoice from {owner?.name || owner?.email || "your freelancer"}
              </p>
              <h1 className="text-lg font-semibold">{link.title}</h1>
            </div>
          </div>
          <Link href="/" className="hidden sm:block">
            <Image
              src="/brand/wordmark-slate-orange.png"
              alt="Totebird"
              width={140}
              height={35}
              className="h-7 w-auto"
            />
          </Link>
        </div>
      </header>

      <main className="tb-shell max-w-lg py-10">
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

          {!closed && (
            <InvoiceClient
              token={token}
              amountCents={invoice.amountCents}
              currency={invoice.currency}
              paid={paid}
              readOnly={closed}
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
