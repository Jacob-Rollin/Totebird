import Link from "next/link";
import { TotebirdLogo } from "@/components/logo";
import { demoStore } from "@/db/demo-store";
import { formatMoney } from "@/lib/format";

export const metadata = {
  title: "Try demo",
};

export default function DemoPage() {
  demoStore.getLinks();
  const inv = demoStore.getInvoiceByLinkId("lnk_demo_invoice");
  const items = demoStore.getItemsForLink("lnk_demo_checklist");
  const done = items.filter((i) => i.done).length;

  return (
    <div className="min-h-screen tb-hero-bg">
      <header className="border-b border-[color:var(--tb-line)]/70 bg-white/70 backdrop-blur">
        <div className="tb-shell flex items-center justify-between py-3">
          <TotebirdLogo size="md" variant="header" />
          <Link href="/" className="text-sm font-medium text-[color:var(--tb-slate-soft)]">
            Back home
          </Link>
        </div>
      </header>

      <main className="tb-shell py-12 sm:py-16">
        <h1 className="font-display text-3xl text-[color:var(--tb-ink)] sm:text-4xl">
          Try Totebird without an account
        </h1>
        <p className="mt-3 max-w-xl text-lg text-[color:var(--tb-slate-soft)]">
          Seeded passwordless checklist and invoice — same pages your clients
          see. No signup required.
        </p>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <Link
            href="/c/demo-checklist"
            className="rounded-2xl border border-[color:var(--tb-line)] bg-white p-7 transition hover:-translate-y-0.5 hover:border-[color:var(--tb-orange)]"
          >
            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[color:var(--tb-orange-deep)]">
              Checklist demo
            </p>
            <h2 className="mt-2 text-2xl font-semibold">Web design kickoff</h2>
            <p className="mt-2 text-[color:var(--tb-slate-soft)]">
              Checkbox, text, and file items · {done}/{items.length} already done
            </p>
            <span className="tb-btn tb-btn-primary mt-6">Open checklist</span>
          </Link>

          <Link
            href="/i/demo-invoice"
            className="rounded-2xl border border-[color:var(--tb-line)] bg-white p-7 transition hover:-translate-y-0.5 hover:border-[color:var(--tb-orange)]"
          >
            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[color:var(--tb-orange-deep)]">
              Invoice demo
            </p>
            <h2 className="mt-2 text-2xl font-semibold">Website redesign</h2>
            <p className="mt-2 text-[color:var(--tb-slate-soft)]">
              Line items totaling{" "}
              {inv ? formatMoney(inv.amountCents, inv.currency) : "$2,750"} · print
              view included
            </p>
            <span className="tb-btn tb-btn-secondary mt-6">Open invoice</span>
          </Link>
        </div>

        <p className="mt-10 text-sm text-[color:var(--tb-slate-soft)]">
          Freelancer side?{" "}
          <Link href="/app" className="font-semibold text-[color:var(--tb-orange-deep)]">
            Open the dashboard
          </Link>{" "}
          · Founder{" "}
          <Link href="/admin" className="font-semibold text-[color:var(--tb-orange-deep)]">
            admin
          </Link>{" "}
          (demo mode works without keys).
        </p>
      </main>
    </div>
  );
}
