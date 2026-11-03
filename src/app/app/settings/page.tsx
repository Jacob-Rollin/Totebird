import Link from "next/link";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ConnectActions } from "@/components/connect-actions";
import { CustomDomainSettings } from "@/components/custom-domain-settings";
import { requireSession } from "@/lib/auth";
import {
  checkCustomDomainDns,
  normalizeHostname,
} from "@/lib/custom-domains";
import {
  clearCustomDomainForUser,
  getCustomDomainForUser,
  updateCustomDomainStatus,
  updateUserModeration,
  upsertCustomDomainForUser,
} from "@/lib/data";
import { filesBaseUrl } from "@/lib/b2";
import {
  integrationStatus,
  appUrl,
  isStripeConnectEnabled,
} from "@/lib/env";
import { PLAN_LIMITS } from "@/lib/plans";
import {
  connectFeatureStatus,
  createExpressOnboardingLink,
  refreshConnectAccount,
} from "@/lib/stripe-connect";

export const metadata = { title: "Settings" };

async function requestOriginFallback(): Promise<string> {
  const h = await headers();
  const proto = h.get("x-forwarded-proto")?.split(",")[0]?.trim() || "https";
  const host =
    h.get("x-forwarded-host")?.split(",")[0]?.trim() ||
    h.get("host")?.trim();
  if (host) return `${proto}://${host}`.replace(/\/$/, "");
  return appUrl();
}

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
  let connectReturnError: string | null = null;

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

    // Stripe docs: refresh_url must mint a new Account Link and redirect back.
    if (q.connect === "refresh" && !session.stripeConnectChargesEnabled) {
      const link = await createExpressOnboardingLink({
        userId: session.id,
        email: session.email,
        existingAccountId: session.stripeConnectAccountId,
        returnBaseUrl: await requestOriginFallback(),
      });
      if (link.ok && link.url) {
        redirect(link.url);
      }
      connectReturnError =
        link.message ||
        "Could not resume Stripe onboarding. Use Connect Stripe below.";
    }
  }

  const status = integrationStatus();
  const hasFilesCdn = Boolean(filesBaseUrl());
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
  const isStudio = session.plan === "studio";
  const customDomain = isStudio
    ? await getCustomDomainForUser(session.id)
    : null;

  async function saveCustomDomain(formData: FormData) {
    "use server";
    const s = await requireSession();
    if (!s) return { ok: false as const, error: "Sign in required." };
    if (s.plan !== "studio") {
      return { ok: false as const, error: "Custom domains are a Studio perk." };
    }
    const hostname = normalizeHostname(String(formData.get("hostname") || ""));
    if (!hostname) {
      return {
        ok: false as const,
        error: "Enter a valid hostname like portal.yourbrand.com.",
      };
    }
    try {
      await upsertCustomDomainForUser({ userId: s.id, hostname });
      revalidatePath("/app/settings");
      return { ok: true as const };
    } catch (err) {
      console.error("[totebird] save custom domain", err);
      return {
        ok: false as const,
        error: "Could not save. Hostname may already be taken.",
      };
    }
  }

  async function checkCustomDomain() {
    "use server";
    const s = await requireSession();
    if (!s) return { ok: false as const, error: "Sign in required." };
    if (s.plan !== "studio") {
      return { ok: false as const, error: "Custom domains are a Studio perk." };
    }
    const row = await getCustomDomainForUser(s.id);
    if (!row) {
      return { ok: false as const, error: "Save a hostname first." };
    }
    const result = await checkCustomDomainDns(row);
    await updateCustomDomainStatus(row.id, {
      status: result.status,
      lastCheckedAt: new Date(),
      verifiedAt: result.status === "verified" ? new Date() : null,
      statusDetail: result.detail,
    });
    revalidatePath("/app/settings");
    return { ok: true as const, detail: result.detail };
  }

  async function clearCustomDomain() {
    "use server";
    const s = await requireSession();
    if (!s) return { ok: false as const, error: "Sign in required." };
    await clearCustomDomainForUser(s.id);
    revalidatePath("/app/settings");
    return { ok: true as const };
  }

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
            ok={hasFilesCdn || status.b2}
            title="Files CDN (pretty download links)"
            hint={
              hasFilesCdn
                ? `Client uploads open via ${filesBaseUrl()}.`
                : status.b2
                  ? "Optional: set NEXT_PUBLIC_FILES_BASE_URL=https://files.totebird.com after the Cloudflare Worker is live. Until then, freelancers still download via a signed app link — no Backblaze console needed."
                  : "Set B2 first; then optionally add NEXT_PUBLIC_FILES_BASE_URL for CDN download URLs."
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
          (Direct charges). Billing subscriptions stay on the platform Stripe
          account. Totebird never stores full card numbers.
        </p>
        {connectReturnError && (
          <p
            role="alert"
            className="mt-3 rounded-lg border border-[color:var(--tb-orange-deep)] bg-[color:var(--tb-orange-soft)] px-3 py-2 text-sm text-[color:var(--tb-ink)]"
          >
            {connectReturnError}
          </p>
        )}
        {q.connect === "return" && connect.state === "pending" && (
          <p className="mt-3 rounded-lg border border-[color:var(--tb-line)] bg-white px-3 py-2 text-sm text-[color:var(--tb-slate)]">
            Stripe onboarding saved for later — finish it with{" "}
            <strong>Resume Stripe onboarding</strong> when ready.
          </p>
        )}
        <div className="mt-4">
          <ConnectActions
            connectEnabled={status.stripeConnect}
            chargesEnabled={connect.chargesEnabled}
            hasAccount={Boolean(connect.accountId)}
            state={connect.state}
            statusMessage={connect.message}
          />
        </div>
        <p className="mt-4 text-xs text-[color:var(--tb-slate-soft)]">
          Powered by Stripe Connect
        </p>
      </div>

      {isStudio ? (
        <div className="tb-panel mt-6">
          <CustomDomainSettings
            domain={customDomain}
            saveAction={saveCustomDomain}
            checkAction={checkCustomDomain}
            clearAction={clearCustomDomain}
          />
        </div>
      ) : (
        <div className="tb-panel mt-6">
          <h2 className="font-semibold">Custom domain</h2>
          <p className="mt-1 text-sm text-[color:var(--tb-slate-soft)]">
            Studio plans can map a client-facing hostname and get DNS
            instructions.{" "}
            <Link
              href="/app/billing"
              className="font-semibold text-[color:var(--tb-orange-deep)]"
            >
              Upgrade to Studio
            </Link>{" "}
            when you want brand overlay readiness (host mapping comes after the
            Cloudflare cutover).
          </p>
        </div>
      )}

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
