import Link from "next/link";
import { adminMetrics } from "@/lib/data";
import { formatMoney } from "@/lib/format";

export const metadata = { title: "Admin" };

export default async function AdminOverviewPage() {
  const m = await adminMetrics();

  const cards = [
    { label: "Users", value: String(m.users), href: "/admin/users" },
    {
      label: "Active checklists",
      value: String(m.activeChecklists),
      href: "/admin/links",
    },
    {
      label: "Active invoices",
      value: String(m.activeInvoices),
      href: "/admin/invoices",
    },
    {
      label: "Paid invoices",
      value: String(m.paidInvoices),
      href: "/admin/invoices",
    },
    {
      label: "GMV (paid)",
      value: formatMoney(m.gmvCents),
      href: "/admin/invoices",
    },
    {
      label: "Signups (7d)",
      value: String(m.recentSignups),
      href: "/admin/users",
    },
  ];

  return (
    <div>
      <h1 className="font-display text-3xl">Founder admin</h1>
      <p className="mt-1 text-[color:var(--tb-slate-soft)]">
        Day-to-day ops without jumping across Clerk / Stripe / Neon consoles.
        Stripe remains source of truth for money movement.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <Link
            key={c.label}
            href={c.href}
            className="tb-panel transition hover:border-[color:var(--tb-orange)]"
          >
            <p className="text-sm text-[color:var(--tb-slate-soft)]">{c.label}</p>
            <p className="font-display mt-2 text-3xl">{c.value}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
