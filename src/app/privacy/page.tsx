import Link from "next/link";
import { TotebirdLogo } from "@/components/logo";

export const metadata = { title: "Privacy" };

/** Fixed stub date — avoids `new Date()` opting the page into dynamic SSR. */
const LAST_UPDATED = "2025-10-29";

export const dynamic = "force-static";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[color:var(--tb-mist)]">
      <header className="border-b border-[color:var(--tb-line)] bg-white">
        <div className="tb-shell py-3">
          <TotebirdLogo size="sm" variant="header" />
        </div>
      </header>
      <main className="tb-shell max-w-2xl py-12 prose-like">
        <p className="rounded-lg bg-[color:var(--tb-orange-soft)] px-3 py-2 text-sm text-[color:var(--tb-slate)]">
          Template / placeholder — replace with counsel-reviewed policy before
          production launch.
        </p>
        <h1 className="font-display mt-6 text-4xl">Privacy Policy</h1>
        <p className="mt-4 text-[color:var(--tb-slate-soft)]">
          Last updated: {LAST_UPDATED}
        </p>
        <div className="mt-8 space-y-6 text-[color:var(--tb-slate)] leading-relaxed">
          <p>
            Totebird (“we”) provides passwordless checklist and invoice links for
            freelancers. This stub describes how we intend to handle data.
          </p>
          <h2 className="font-display text-2xl">What we collect</h2>
          <ul className="list-disc space-y-2 pl-5">
            <li>Freelancer account info via Clerk (email, name).</li>
            <li>Link content you create (checklist items, invoices, client emails).</li>
            <li>Files uploaded by clients (stored in your configured R2 bucket).</li>
            <li>Payment metadata via Stripe (we do not store full card numbers).</li>
          </ul>
          <h2 className="font-display text-2xl">How we use it</h2>
          <p>
            To operate the product: deliver links, show dashboard status, send
            reminders you request, and process invoice Checkout. We do not sell
            personal data.
          </p>
          <h2 className="font-display text-2xl">Retention & deletion</h2>
          <p>
            You may close links and request account deletion by emailing{" "}
            <a className="text-[color:var(--tb-orange-deep)]" href="mailto:hello@totebird.com">
              hello@totebird.com
            </a>
            . Backups may persist briefly after deletion.
          </p>
          <h2 className="font-display text-2xl">Contact</h2>
          <p>Questions: hello@totebird.com</p>
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
