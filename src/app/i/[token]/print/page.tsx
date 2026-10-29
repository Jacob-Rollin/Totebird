import { notFound } from "next/navigation";
import { getInvoiceBundle } from "@/lib/data";
import { formatDate, formatMoney } from "@/lib/format";

export default async function InvoicePrintPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const bundle = await getInvoiceBundle(token);
  if (!bundle || !bundle.invoice) notFound();
  const { link, invoice, lineItems, owner } = bundle;

  return (
    <div className="mx-auto max-w-2xl bg-white px-6 py-10 text-[color:var(--tb-ink)] print:px-0">
      <div className="flex items-start justify-between gap-4 border-b border-[color:var(--tb-line)] pb-6">
        <div>
          <p className="text-sm uppercase tracking-[0.14em] text-[color:var(--tb-slate-soft)]">
            Invoice
          </p>
          <h1 className="font-display mt-1 text-3xl">{link.title}</h1>
          <p className="mt-2 text-sm text-[color:var(--tb-slate-soft)]">
            From {owner?.name || owner?.email || "Freelancer"}
            {link.clientEmail ? ` · To ${link.clientEmail}` : ""}
          </p>
        </div>
        <div className="text-right text-sm">
          <p>Status: {invoice.status}</p>
          {invoice.dueAt && <p>Due {formatDate(invoice.dueAt)}</p>}
          {invoice.paidAt && <p>Paid {formatDate(invoice.paidAt)}</p>}
        </div>
      </div>

      {invoice.description && (
        <p className="mt-6 text-[color:var(--tb-slate-soft)]">{invoice.description}</p>
      )}

      <table className="mt-8 w-full text-sm">
        <thead>
          <tr className="border-b border-[color:var(--tb-line)] text-left">
            <th className="py-2">Description</th>
            <th className="py-2">Qty</th>
            <th className="py-2 text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          {(lineItems.length
            ? lineItems
            : [
                {
                  id: "fallback",
                  description: invoice.description || link.title,
                  quantity: 1,
                  unitAmountCents: invoice.amountCents,
                },
              ]
          ).map((li) => (
            <tr key={li.id} className="border-b border-[color:var(--tb-line)]">
              <td className="py-3">{li.description}</td>
              <td className="py-3">{li.quantity}</td>
              <td className="py-3 text-right">
                {formatMoney(li.quantity * li.unitAmountCents, invoice.currency)}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={2} className="py-4 text-right font-semibold">
              Total
            </td>
            <td className="py-4 text-right font-display text-xl">
              {formatMoney(invoice.amountCents, invoice.currency)}
            </td>
          </tr>
        </tfoot>
      </table>

      <p className="mt-12 text-xs text-[color:var(--tb-slate-soft)] print:hidden">
        Tip: use your browser’s Print → Save as PDF.
      </p>
    </div>
  );
}
