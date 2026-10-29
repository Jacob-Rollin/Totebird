import Link from "next/link";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { integrationStatus, appUrl } from "@/lib/env";
import { PLAN_LIMITS } from "@/lib/plans";

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

export default async function SettingsPage() {
  const session = await requireSession();
  if (!session) redirect("/sign-in");

  const status = integrationStatus();
  const hasBillingPrices = Boolean(
    process.env.STRIPE_PRICE_SOLO_MONTHLY ||
      process.env.STRIPE_PRICE_SOLO_YEARLY,
  );
  const hasCron = Boolean(process.env.CRON_SECRET);
  const allCore =
    status.database && status.clerk && status.stripe && status.r2 && status.resend;

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
            ok={status.r2}
            title="Cloudflare R2 uploads"
            hint={
              status.r2
                ? "Presigned uploads enabled."
                : "Add R2_ACCOUNT_ID, keys, and R2_BUCKET_NAME for real file drops."
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
          Neon → Clerk → R2 → Resend → Stripe). Billing:{" "}
          <Link href="/app/billing" className="text-[color:var(--tb-orange-deep)]">
            /app/billing
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
