import Link from "next/link";
import { PublicSiteHeader } from "@/components/public-site-header";
import { hasClerkPublishable } from "@/lib/env-public";

export const metadata = { title: "Privacy" };

/** Fixed date — avoids `new Date()` opting the page into dynamic SSR. */
const LAST_UPDATED = "November 4, 2026";

export const dynamic = "force-static";

export default function PrivacyPage() {
  return (
    <div className="min-h-dvh bg-[color:var(--tb-mist)]">
      <PublicSiteHeader
        clerkEnabled={hasClerkPublishable()}
        guest="legal"
      />
      <main className="tb-shell max-w-2xl py-12">
        <h1 className="font-display text-4xl text-[color:var(--tb-ink)]">
          Privacy Policy
        </h1>
        <p className="mt-4 text-[color:var(--tb-slate-soft)]">
          Last updated: {LAST_UPDATED}
        </p>
        <div className="mt-8 space-y-8 text-[color:var(--tb-slate)] leading-relaxed">
          <p>
            This Privacy Policy describes how Totebird (“we”, “us”, “our”)
            processes information when you use totebird.com, our client link
            pages, and the freelancer dashboard at{" "}
            <Link
              href="/app"
              className="text-[color:var(--tb-orange-deep)]"
            >
              /app
            </Link>
            .
          </p>

          <section className="space-y-3">
            <h2 className="font-display text-2xl text-[color:var(--tb-ink)]">
              01. Who we are
            </h2>
            <p>
              Totebird is software for independent contractors, freelancers, and
              small service providers.
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
                  Privacy &amp; support:
                </span>{" "}
                <a
                  className="text-[color:var(--tb-orange-deep)]"
                  href="mailto:hello@totebird.com"
                >
                  hello@totebird.com
                </a>
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-2xl text-[color:var(--tb-ink)]">
              02. What this covers
            </h2>
            <p>
              Totebird helps freelancers share passwordless checklist and invoice
              links with clients, collect deliverables, and get paid. Freelancer
              accounts use Clerk for passwordless sign-in. We do not store
              passwords on Totebird servers.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-2xl text-[color:var(--tb-ink)]">
              03. What we collect
            </h2>
            <p>
              Depending on whether you are a freelancer or a client using a
              shared link, we may process:
            </p>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                <span className="font-medium text-[color:var(--tb-ink)]">
                  Freelancer account details:
                </span>{" "}
                email, name, and account identifiers managed by Clerk.
              </li>
              <li>
                <span className="font-medium text-[color:var(--tb-ink)]">
                  Link and project data:
                </span>{" "}
                checklist items, notes, service line items, invoice amounts, due
                dates, project updates, and client email addresses you provide.
              </li>
              <li>
                <span className="font-medium text-[color:var(--tb-ink)]">
                  Client uploads:
                </span>{" "}
                files and photos clients upload to complete checklist steps.
              </li>
              <li>
                <span className="font-medium text-[color:var(--tb-ink)]">
                  Payment metadata:
                </span>{" "}
                Stripe transaction status, customer and payment-method
                references, Connect account references, and subscription details
                needed for invoice Checkout and billing. Card numbers and bank
                routing details stay with Stripe; Totebird does not store them.
              </li>
              <li>
                <span className="font-medium text-[color:var(--tb-ink)]">
                  Technical logs:
                </span>{" "}
                request and error logs from our Cloudflare Workers runtime used
                to operate and secure the service.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-2xl text-[color:var(--tb-ink)]">
              04. How we use information
            </h2>
            <p>We use information to:</p>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                Deliver public checklist and invoice links to the people you
                share them with.
              </li>
              <li>
                Power the freelancer dashboard at /app (progress, link
                management, settings).
              </li>
              <li>
                Send product emails you request or that the product needs
                (reminders, status notices) via Resend.
              </li>
              <li>
                Run invoice Checkout, freelancer payouts through Stripe Connect,
                and Totebird subscription billing via Stripe.
              </li>
              <li>
                Monitor errors, security events, and service reliability.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-2xl text-[color:var(--tb-ink)]">
              05. Sharing and selling data
            </h2>
            <p>
              <span className="font-medium text-[color:var(--tb-ink)]">
                We do not sell personal data.
              </span>{" "}
              We do not share freelancer or client identities with marketing
              networks or data brokers.
            </p>
            <p>
              We share information only with the processors listed below (to run
              the product), when required by law, or when you instruct us to
              (for example, showing files or payment status on a link page you
              share with a client).
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-2xl text-[color:var(--tb-ink)]">
              06. Processors and infrastructure
            </h2>
            <p>
              We rely on these processors to operate Totebird. Each handles data
              under its own terms, limited to the work they perform for us:
            </p>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                <span className="font-medium text-[color:var(--tb-ink)]">
                  Clerk:
                </span>{" "}
                authentication, sessions, and passwordless sign-in.
              </li>
              <li>
                <span className="font-medium text-[color:var(--tb-ink)]">
                  Stripe:
                </span>{" "}
                payments, invoice Checkout, subscription billing, and Stripe
                Connect for freelancer payouts.
              </li>
              <li>
                <span className="font-medium text-[color:var(--tb-ink)]">
                  Cloudflare:
                </span>{" "}
                Workers hosting, DNS/edge delivery, and optional Email Routing.
                Client file downloads may be served through a Cloudflare Worker
                CDN at files.totebird.com.
              </li>
              <li>
                <span className="font-medium text-[color:var(--tb-ink)]">
                  Neon:
                </span>{" "}
                Postgres database for structured application data.
              </li>
              <li>
                <span className="font-medium text-[color:var(--tb-ink)]">
                  Backblaze B2:
                </span>{" "}
                object storage for client uploads and related files.
              </li>
              <li>
                <span className="font-medium text-[color:var(--tb-ink)]">
                  Resend:
                </span>{" "}
                transactional product email (reminders and similar notices).
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-2xl text-[color:var(--tb-ink)]">
              07. Data retention and deletion
            </h2>
            <p>
              Checklist, deliverable, and invoice data for active links is kept
              so freelancers can continue their work.
            </p>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                <span className="font-medium text-[color:var(--tb-ink)]">
                  In-app controls:
                </span>{" "}
                freelancers can close links, update projects, and manage fields
                from the dashboard at /app.
              </li>
              <li>
                <span className="font-medium text-[color:var(--tb-ink)]">
                  Account deletion:
                </span>{" "}
                email{" "}
                <a
                  className="text-[color:var(--tb-orange-deep)]"
                  href="mailto:hello@totebird.com"
                >
                  hello@totebird.com
                </a>{" "}
                to request permanent closure of your account and related project
                data.
              </li>
              <li>
                <span className="font-medium text-[color:var(--tb-ink)]">
                  Timeline:
                </span>{" "}
                after we verify ownership, we delete or anonymize matching data
                in Neon and related objects in Backblaze B2 within 30 days.
                Backups, audit logs, or payment records may remain longer when
                needed for fraud prevention, security, or financial compliance.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-2xl text-[color:var(--tb-ink)]">
              08. Third-party links and files
            </h2>
            <p>
              Links and uploaded files may point to or include content outside
              Totebird. We do not control the privacy practices of external sites
              or third-party payment experiences beyond Stripe Checkout as
              described above.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-2xl text-[color:var(--tb-ink)]">
              09. Security and children
            </h2>
            <p>
              We use industry-standard protections appropriate for a small SaaS
              product: HTTPS in transit, access controls on freelancer accounts
              via Clerk, tokenized client links, and private object storage for
              uploads. No method of transmission or storage is perfectly secure;
              we work to reduce risk and respond to issues we become aware of.
            </p>
            <p>
              Totebird is not directed at children under 13, and we do not
              knowingly collect personal information from children under 13. If
              you believe a child has provided us information, contact{" "}
              <a
                className="text-[color:var(--tb-orange-deep)]"
                href="mailto:hello@totebird.com"
              >
                hello@totebird.com
              </a>{" "}
              and we will delete it.
            </p>
            <p>
              Our processors may process data in the United States and other
              countries where they operate. By using Totebird, you understand
              that information may be transferred to those locations as needed
              to provide the service.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-2xl text-[color:var(--tb-ink)]">
              10. Policy updates
            </h2>
            <p>
              We may update this Privacy Policy as Totebird changes. Updates take
              effect when we change the “Last updated” date above. Continued use
              of Totebird after an update means you have seen the revised
              policy.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-2xl text-[color:var(--tb-ink)]">
              11. Contact
            </h2>
            <p>
              For privacy questions, security concerns, or data access or
              deletion requests, email{" "}
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
