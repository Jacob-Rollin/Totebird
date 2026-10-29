import Link from "next/link";
import { StatusPill } from "@/components/status-pill";
import { listAllInvoices } from "@/lib/data";
import { formatDate, formatMoney } from "@/lib/format";

export const metadata = { title: "Admin · Invoices" };

export default async function AdminInvoicesPage() {
  const rows = await listAllInvoices();

  return (
    <div>
      <h1 className="font-display text-3xl">Invoices</h1>
      <p className="mt-1 text-sm text-[color:var(--tb-slate-soft)]">
        Stripe Dashboard remains source of truth for payouts and refunds.
      </p>
      <div className="tb-panel mt-6 overflow-x-auto p-0">
        <table className="tb-card-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Owner</th>
              <th>Due</th>
              <th>Created</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="font-medium">{r.title}</td>
                <td>{formatMoney(r.amountCents, r.currency)}</td>
                <td>
                  <StatusPill status={r.status} />
                </td>
                <td className="text-sm">{r.ownerEmail}</td>
                <td>{formatDate(r.dueAt)}</td>
                <td>{formatDate(r.createdAt)}</td>
                <td>
                  <Link
                    href={`/i/${r.token}`}
                    className="text-sm text-[color:var(--tb-orange-deep)]"
                    target="_blank"
                  >
                    Open
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
