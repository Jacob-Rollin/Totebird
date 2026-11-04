import Link from "next/link";
import { PublicSiteHeader } from "@/components/public-site-header";
import { hasClerkPublishable } from "@/lib/env-public";

export const metadata = { title: "Terms" };

/** Fixed date — avoids `new Date()` opting the page into dynamic SSR. */
const LAST_UPDATED = "November 4, 2026";

export const dynamic = "force-static";

export default function TermsPage() {
  return (
    <div className="min-h-dvh bg-[color:var(--tb-mist)]">
      <PublicSiteHeader
        clerkEnabled={hasClerkPublishable()}
        guest="legal"
      />
      <main className="tb-shell max-w-2xl py-12">
        <h1 className="font-display text-4xl text-[color:var(--tb-ink)]">
          Terms of Service
        </h1>
        <p className="mt-4 text-[color:var(--tb-slate-soft)]">
          Last updated: {LAST_UPDATED}
        </p>
        <div className="mt-8 space-y-8 text-[color:var(--tb-slate)] leading-relaxed">
          <p>
            These Terms of Service (“Terms”) govern your access to and use of
            totebird.com, our client link pages, and the freelancer dashboard at{" "}
            <Link
              href="/app"
              className="text-[color:var(--tb-orange-deep)]"
            >
              /app
            </Link>{" "}
            (together, the “Service”). By creating an account, creating project
            links, or using the Service, you agree to these Terms.
          </p>

          <section className="space-y-3">
            <h2 className="font-display text-2xl text-[color:var(--tb-ink)]">
              01. Agreement and project scope
            </h2>
            <p>
              The Service is operated under the brand name Totebird.
            </p>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                <span className="font-medium text-[color:var(--tb-ink)]">
                  Project:
                </span>{" "}
                Totebird
              </li>
              <li>
                <span className="font-medium text-[color:var(--tb-ink)]">
                  Website:
                </span>{" "}
                totebird.com
              </li>
              <li>
                <span className="font-medium text-[color:var(--tb-ink)]">
                  Support:
                </span>{" "}
                <a
                  className="text-[color:var(--tb-orange-deep)]"
                  href="mailto:hello@totebird.com"
                >
                  hello@totebird.com
                </a>
              </li>
            </ul>
            <p>
              By using Totebird, you represent that you are at least the age of
              majority in your jurisdiction and have the legal capacity to agree
              to these Terms for yourself or on behalf of a business you
              represent.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-2xl text-[color:var(--tb-ink)]">
              02. Service and access
            </h2>
            <p>
              Totebird provides passwordless checklist and invoice links for
              freelancers and their clients.
            </p>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                <span className="font-medium text-[color:var(--tb-ink)]">
                  Freelancer accounts:
                </span>{" "}
                freelancers sign in with passwordless authentication managed by
                Clerk. You are responsible for protecting access to your
                dashboard sessions at /app.
              </li>
              <li>
                <span className="font-medium text-[color:var(--tb-ink)]">
                  Client access:
                </span>{" "}
                clients do not create Totebird accounts. They open checklists,
                upload files, and pay invoices through unique tokenized links you
                send them.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-2xl text-[color:var(--tb-ink)]">
              03. Freelancer responsibility for links
            </h2>
            <p>
              Freelancers control how their Totebird links are created and
              shared. You agree that:
            </p>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                You are solely responsible for sending project links, billing
                details, and checklists to the correct recipients.
              </li>
              <li>
                Totebird is not responsible for data exposure, missed deadlines,
                or billing issues that result from a misdirected, lost, or leaked
                tokenized link.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-2xl text-[color:var(--tb-ink)]">
              04. Invoices, subscriptions, and payments
            </h2>
            <p>
              Payments started through Totebird are processed by Stripe. Totebird
              does not hold or escrow client funds.
            </p>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                <span className="font-medium text-[color:var(--tb-ink)]">
                  Client invoices:
                </span>{" "}
                Totebird helps you present invoices; client payments go via
                Stripe Connect Direct to your connected Stripe account. Free plan
                invoices may include a small Totebird application fee (currently
                1%); Solo and Studio plans have a 0% Totebird application fee.
                Stripe’s own fees still apply.
              </li>
              <li>
                <span className="font-medium text-[color:var(--tb-ink)]">
                  Freelancer subscriptions:
                </span>{" "}
                Solo and Studio (and similar paid tiers) are billed monthly or
                yearly through Stripe. You can manage or cancel a subscription in
                the Stripe Customer Portal from billing or settings in /app — not
                from the founder admin panel.
              </li>
              <li>
                <span className="font-medium text-[color:var(--tb-ink)]">
                  Pricing changes:
                </span>{" "}
                subscription rates may change with notice in the product
                changelog or by email. Applicable taxes may be calculated at
                checkout based on your location.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-2xl text-[color:var(--tb-ink)]">
              05. Client uploads and file storage
            </h2>
            <p>
              When checklists allow client uploads, files are stored with
              Backblaze B2 (and may be delivered via Cloudflare Workers, including
              files.totebird.com). You agree that:
            </p>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                You and your clients have the rights needed for any files
                uploaded to the Service.
              </li>
              <li>
                Totebird may enforce plan storage caps, file-type limits, and
                cleanup rules to keep the Service healthy and secure.
              </li>
              <li>
                Totebird storage is not a primary or indefinite backup. We are
                not liable for file corruption, failed uploads, or loss of
                historical files beyond what applicable law requires.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-2xl text-[color:var(--tb-ink)]">
              06. Acceptable use
            </h2>
            <p>
              You agree to use Totebird in compliance with applicable law. You
              may not:
            </p>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                Use Totebird links for malware, phishing, deceptive payment
                schemes, or abusive spam.
              </li>
              <li>
                Upload or link to content that is unlawful, fraudulent,
                defamatory, or that infringes others’ intellectual property.
              </li>
              <li>
                Interfere with the Service — including Cloudflare Workers
                hosting and edge delivery — or scrape or overload our systems
                without permission.
              </li>
            </ul>
            <p>
              We may deactivate accounts, close links, and remove related data
              when we find a violation of these rules.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-2xl text-[color:var(--tb-ink)]">
              07. Intellectual property
            </h2>
            <p>
              Totebird, totebird.com, our branding, interface, and codebase are
              owned by the Totebird project and its developers. Freelancers keep
              ownership of the text, checklist content, and invoice items they
              submit. You grant us a limited license to store and display that
              content as needed to operate your tokenized links and dashboard.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-2xl text-[color:var(--tb-ink)]">
              08. Processors and infrastructure
            </h2>
            <p>
              The Service relies on third-party processors consistent with our
              Privacy Policy, including:
            </p>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                <span className="font-medium text-[color:var(--tb-ink)]">
                  Clerk:
                </span>{" "}
                authentication and sessions.
              </li>
              <li>
                <span className="font-medium text-[color:var(--tb-ink)]">
                  Stripe:
                </span>{" "}
                subscriptions, invoice Checkout, and Connect for freelancer
                payouts.
              </li>
              <li>
                <span className="font-medium text-[color:var(--tb-ink)]">
                  Cloudflare:
                </span>{" "}
                Workers hosting and edge delivery.
              </li>
              <li>
                <span className="font-medium text-[color:var(--tb-ink)]">
                  Neon:
                </span>{" "}
                Postgres database for structured data.
              </li>
              <li>
                <span className="font-medium text-[color:var(--tb-ink)]">
                  Backblaze B2:
                </span>{" "}
                object storage for uploads.
              </li>
              <li>
                <span className="font-medium text-[color:var(--tb-ink)]">
                  Resend:
                </span>{" "}
                transactional product email.
              </li>
            </ul>
            <p>
              Their use of data is described further in the{" "}
              <Link
                href="/privacy"
                className="text-[color:var(--tb-orange-deep)]"
              >
                Privacy Policy
              </Link>
              .
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-2xl text-[color:var(--tb-ink)]">
              09. Disclaimer of warranties
            </h2>
            <p className="uppercase tracking-wide text-sm sm:normal-case sm:tracking-normal sm:text-base">
              The Service is provided on an “as is” and “as available” basis
              during early access. To the maximum extent permitted by law, we
              disclaim all warranties, express or implied, including
              merchantability, fitness for a particular purpose, and
              non-infringement.
            </p>
            <p>
              We do not warrant that links will be error-free, that the Service
              will have uninterrupted uptime, or that reminders will ensure
              timely client payments.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-2xl text-[color:var(--tb-ink)]">
              10. Limitation of liability
            </h2>
            <p>
              To the maximum extent permitted by law, Totebird and its developers
              are not liable for indirect, incidental, special, consequential, or
              punitive damages, including lost revenue, lost project data, or
              corrupted client uploads.
            </p>
            <p>
              Our aggregate liability for claims arising from your use of the
              Service will not exceed the total amount you paid Totebird for paid
              plans in the twelve (12) months before the claim (or USD $25.00 if
              you used only the free tier).
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-2xl text-[color:var(--tb-ink)]">
              11. Governing law
            </h2>
            <p>
              These Terms are governed by the laws of the United States,
              without regard to conflict-of-law principles, except where your
              local law requires otherwise.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-2xl text-[color:var(--tb-ink)]">
              12. Changes to these Terms
            </h2>
            <p>
              We may update these Terms as the Service changes. Updates take
              effect when we change the “Last updated” date above. Continued use
              of Totebird after an update means you accept the revised Terms.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-2xl text-[color:var(--tb-ink)]">
              13. Contact
            </h2>
            <p>
              For questions about these Terms, the Service, or account closure,
              email{" "}
              <a
                className="text-[color:var(--tb-orange-deep)]"
                href="mailto:hello@totebird.com"
              >
                hello@totebird.com
              </a>
              .
            </p>
          </section>
        </div>
        <p className="mt-10">
          <Link
            href="/"
            className="text-sm font-medium text-[color:var(--tb-orange-deep)]"
          >
            ← Back to Totebird
          </Link>
        </p>
      </main>
    </div>
  );
}
