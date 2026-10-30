import Link from "next/link";
import { TotebirdLogo } from "@/components/logo";

export const metadata = { title: "Terms" };

/** Fixed stub date — avoids `new Date()` opting the page into dynamic SSR. */
const LAST_UPDATED = "2025-10-29";

export const dynamic = "force-static";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[color:var(--tb-mist)]">
      <header className="border-b border-[color:var(--tb-line)] bg-white">
        <div className="tb-shell py-3">
          <TotebirdLogo size="sm" variant="header" />
        </div>
      </header>
      <main className="tb-shell max-w-2xl py-12">
        <p className="rounded-lg bg-[color:var(--tb-orange-soft)] px-3 py-2 text-sm text-[color:var(--tb-slate)]">
          Template / placeholder — replace with counsel-reviewed terms before
          production launch.
        </p>
        <h1 className="font-display mt-6 text-4xl">Terms of Service</h1>
        <p className="mt-4 text-[color:var(--tb-slate-soft)]">
          Last updated: {LAST_UPDATED}
        </p>
        <div className="mt-8 space-y-6 text-[color:var(--tb-slate)] leading-relaxed">
          <p>
            By using Totebird you agree to these placeholder terms. The service
            provides passwordless client links for checklists and invoices.
          </p>
          <h2 className="font-display text-2xl">Accounts</h2>
          <p>
            Freelancers authenticate with Clerk. Clients do not create accounts;
            access is via tokenized links you send. You are responsible for who
            receives those links.
          </p>
          <h2 className="font-display text-2xl">Payments</h2>
          <p>
            Invoice payments are processed by Stripe. Totebird does not hold
            client funds. Subscription billing for Solo/Studio (when enabled) is
            also via Stripe; cancel anytime in the Customer Portal.
          </p>
          <h2 className="font-display text-2xl">Acceptable use</h2>
          <p>
            Do not use Totebird for unlawful content, malware, or abusive spam.
            We may disable accounts that harm the platform or other users.
          </p>
          <h2 className="font-display text-2xl">Disclaimer</h2>
          <p>
            The service is provided “as is” during early access. We are not
            liable for lost files, missed payments, or downtime beyond what the
            law requires.
          </p>
          <h2 className="font-display text-2xl">Contact</h2>
          <p>hello@totebird.com</p>
        </div>
        <p className="mt-10">
          <Link href="/" className="text-sm font-medium text-[color:var(--tb-orange-deep)]">
            ← Back to Totebird
          </Link>
        </p>
      </main>
    </div>
  );
}
