import Link from "next/link";
import { redirect } from "next/navigation";
import { ConnectActions } from "@/components/connect-actions";
import { requireSession } from "@/lib/auth";
import { updateUserModeration } from "@/lib/data";
import {
  integrationStatus,
  appUrl,
  isStripeConnectEnabled,
} from "@/lib/env";
import { PLAN_LIMITS } from "@/lib/plans";
import { connectFeatureStatus, refreshConnectAccount } from "@/lib/stripe-connect";

export const metadata = { title: "Settings" };

function Row({
  ok,
  title,
  hint,
}: {
  ok: boolean;
  title: string;
  hint: string;
}) {
  return (
    <li className="flex gap-3 border-b border-[color:var(--tb-line)] py-4 last:border-0">
      <span
        className={`mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
          ok
            ? "bg-emerald-50 text-emerald-700"
            : "bg-[color:var(--tb-orange-soft)] text-[color:var(--tb-orange-deep)]"
        }`}
        aria-hidden
      >
        {ok ? "✓" : "!"}
      </span>
      <div>
        <p className="font-semibold text-[color:var(--tb-ink)]">{title}</p>
        <p className="mt-1 text-sm text-[color:var(--tb-slate-soft)]">{hint}</p>
      </div>
    </li>
  );
}

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ connect?: string }>;
}) {
  const session = await requireSession();
  if (!session) redirect("/sign-in");
  const q = await searchParams;

  // Return/refresh from Stripe Express Account Link
  if (
    (q.connect === "return" || q.connect === "refresh") &&
    isStripeConnectEnabled() &&
    session.stripeConnectAccountId
  ) {
    const live = await refreshConnectAccount(session.stripeConnectAccountId);
    if (live) {
      await updateUserModeration(session.id, {
        stripeConnectChargesEnabled: live.chargesEnabled,
        stripeConnectDetailsSubmitted: live.detailsSubmitted,
      });
      session.stripeConnectChargesEnabled = live.chargesEnabled;
      session.stripeConnectDetailsSubmitted = live.detailsSubmitted;
    }
  }

  const status = integrationStatus();
  const hasBillingPrices = Boolean(
    process.env.STRIPE_PRICE_SOLO_MONTHLY ||
      process.env.STRIPE_PRICE_SOLO_YEARLY,
  );
  const hasCron = Boolean(process.env.CRON_SECRET);
  const allCore =
    status.database &&
    status.clerk &&
    status.stripe &&
    status.b2 &&
    status.resend;
  const connect = connectFeatureStatus(session);

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-display text-3xl">Settings</h1>
      <p className="mt-1 text-[color:var(--tb-slate-soft)]">
        Account · {session.email} · {PLAN_LIMITS[session.plan].label} plan
      </p>

      <div className="tb-panel mt-8">
        <h2 className="font-semibold">Connect your platforms</h2>
        <p className="mt-1 text-sm text-[color:var(--tb-slate-soft)]">
          Set these in Netlify → Environment variables (or local{" "}
          <code>.env.local</code>). Demo mode works until they&apos;re present.
        </p>
        <ul className="mt-2">
          <Row
            ok={status.database}
            title="Neon database"
            hint={
              status.database
                ? "DATABASE_URL is set — data can persist. If tables are missing at runtime, run npm run db:push once from a laptop with the same URL (not on Netlify)."
                : "Add DATABASE_URL in Netlify env (or .env.local). Schema push (npm run db:push) is a one-time local step later — not run on Netlify."
            }
          />
          <Row
            ok={status.clerk}
            title="Clerk auth"
            hint={
              status.clerk
                ? "Freelancer sign-in is live."
                : "Add NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY + CLERK_SECRET_KEY."
            }
          />
          <Row
            ok={status.stripe}
            title="Stripe payments"
            hint={
              status.stripe
                ? "Invoice Checkout can run. Add Price IDs for Solo/Studio billing."
                : "Add STRIPE_SECRET_KEY (+ webhook secret) for client pay."
            }
          />
          <Row
            ok={hasBillingPrices}
            title="Stripe Billing prices"
            hint={
              hasBillingPrices
                ? "Solo/Studio Price IDs detected."
                : "Add STRIPE_PRICE_SOLO_MONTHLY (and yearly/studio) for upgrades."
            }
          />
          <Row
            ok={connect.chargesEnabled}
            title={
              connect.state === "ready"
                ? "Stripe Connect — ready"
                : connect.state === "pending"
                  ? "Stripe Connect — pending"
                  : connect.state === "not_connected"
                    ? "Stripe Connect — not connected"
                    : "Stripe Connect (Express)"
            }
            hint={connect.message}
          />
          <Row
            ok={status.b2}
            title="Backblaze B2 uploads"
            hint={
              status.b2
                ? "Presigned uploads to the shared B2 bucket are enabled. B2_ENDPOINT must be https://s3.REGION.backblazeb2.com (not Worker host-only)."
                : "Add B2_KEY_ID, B2_APPLICATION_KEY, B2_BUCKET, and B2_ENDPOINT (full https:// URL) for real file drops."
            }
          />
          <Row
            ok={status.resend}
            title="Resend email"
            hint={
              status.resend
                ? "Reminders and receipts can send."
                : "Add RESEND_API_KEY — until then reminders only log."
            }
          />
          <Row
            ok={hasCron}
            title="Scheduled reminders"
            hint={
              hasCron
                ? "CRON_SECRET set — Netlify scheduled function can call /api/cron/reminders."
                : "Optional: set CRON_SECRET so the daily Netlify schedule is locked down."
            }
          />
        </ul>

        {status.demoMode && (
          <p className="mt-4 rounded-lg bg-[color:var(--tb-orange-soft)] px-4 py-3 text-sm">
            App is in <strong>demo mode</strong> (missing Neon and/or Clerk). UI
            still works with in-memory data.
          </p>
        )}
        {allCore && !status.demoMode && (
          <p className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
            Core platforms look connected. Smoke-test a live checklist upload and
            a Stripe test payment.
          </p>
        )}
      </div>

      <div className="tb-panel mt-6">
        <h2 className="font-semibold">Payouts — Stripe Connect</h2>
        <p className="mt-1 text-sm text-[color:var(--tb-slate-soft)]">
          Freelancer invoice money should land in your Stripe Express account
          (Direct charges). Billing subscriptions stay on the platform account.
        </p>
        <div className="mt-4">
          <ConnectActions
            connectEnabled={status.stripeConnect}
            chargesEnabled={connect.chargesEnabled}
            hasAccount={Boolean(connect.accountId)}
            state={connect.state}
            statusMessage={connect.message}
          />
        </div>
      </div>

      <div className="tb-panel mt-6 space-y-2 text-sm">
        <p>
          <span className="font-semibold">Public URL:</span>{" "}
          <code>{appUrl()}</code>
        </p>
        <p>
          <span className="font-semibold">Stripe webhook:</span>{" "}
          <code>{appUrl()}/api/webhooks/stripe</code>
        </p>
        <p>
          <span className="font-semibold">Reminder cron:</span>{" "}
          <code>{appUrl()}/api/cron/reminders</code>
        </p>
        <p className="text-[color:var(--tb-slate-soft)]">
          Step-by-step platform walkthrough lives in the Project docs (Netlify →
          Neon → Clerk → B2 → Resend → Stripe). Billing:{" "}
          <Link href="/app/billing" className="text-[color:var(--tb-orange-deep)]">
            /app/billing
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
