import Link from "next/link";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { PLAN_LIMITS, storageUsageMessage, type Plan } from "@/lib/plans";
import {
  countActiveLinks,
  getUserByIdBilling,
  storageUsedByUser,
  updateUserModeration,
} from "@/lib/data";
import { BillingActions } from "@/components/billing-actions";
import { isDemoMode } from "@/lib/env";
import { syncPlanAfterUpgradeReturn } from "@/lib/stripe-billing-sync";

export const metadata = { title: "Billing" };

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{
    upgraded?: string;
    canceled?: string;
    demoPlan?: string;
    session_id?: string;
  }>;
}) {
  const session = await requireSession();
  if (!session) redirect("/sign-in");
  const q = await searchParams;

  // Demo-only: simulate plan change without Stripe
  if (isDemoMode() && q.demoPlan && ["free", "solo", "studio"].includes(q.demoPlan)) {
    await updateUserModeration(session.id, { plan: q.demoPlan as Plan });
    redirect("/app/billing?upgraded=1");
  }

  // Live: ?upgraded=1 is only a Checkout return flag — not proof the webhook wrote Neon.
  // Sync from Stripe (session_id or active subscription by customer/email) so the UI
  // updates even when the webhook silently no-op'd or lagged.
  let plan = session.plan;
  if (q.upgraded === "1" && !isDemoMode() && plan === "free") {
    const synced = await syncPlanAfterUpgradeReturn({
      userId: session.id,
      email: session.email,
      stripeCustomerId: session.stripeCustomerId,
      checkoutSessionId: q.session_id || null,
    });
    if (synced?.plan) {
      plan = synced.plan;
    } else {
      // Re-read Neon in case the webhook landed between requireSession and now.
      const fresh = await getUserByIdBilling(session.id);
      if (fresh?.plan) plan = fresh.plan;
    }
  }

  const active = await countActiveLinks(session.id);
  const used = await storageUsedByUser(session.id);
  const limits = PLAN_LIMITS[plan];

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-display text-3xl">Billing & plan</h1>
      <p className="mt-1 text-[color:var(--tb-slate-soft)]">
        Stripe remains the source of truth for subscriptions and payouts.
      </p>

      {q.upgraded === "1" && (
        <p className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          Plan updated{isDemoMode() ? " (demo)" : ""}
          {!isDemoMode() && plan === "free"
            ? " — syncing subscription; refresh if plan still shows Free."
            : "."}
        </p>
      )}
      {q.canceled === "1" && (
        <p className="mt-4 rounded-lg bg-[color:var(--tb-orange-soft)] px-4 py-3 text-sm">
          Checkout canceled.
        </p>
      )}

      <div className="tb-panel mt-8">
        <p className="text-sm text-[color:var(--tb-slate-soft)]">Current plan</p>
        <p className="font-display mt-1 text-3xl">{limits.label}</p>
        <p className="mt-2 text-sm text-[color:var(--tb-slate-soft)]">
          {active} active of{" "}
          {Number.isFinite(limits.activeLinks) ? limits.activeLinks : "∞"} links ·{" "}
          {storageUsageMessage(used, plan)}
        </p>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {(["free", "solo", "studio"] as Plan[]).map((p) => {
          const meta = PLAN_LIMITS[p];
          const current = p === plan;
          return (
            <div
              key={p}
              className={`rounded-2xl border p-5 ${
                current
                  ? "border-[color:var(--tb-orange)] bg-white"
                  : "border-[color:var(--tb-line)] bg-white"
              }`}
            >
              <div className="flex items-baseline justify-between">
                <h2 className="font-semibold">{meta.label}</h2>
                {current && (
                  <span className="text-xs font-semibold text-[color:var(--tb-orange-deep)]">
                    Current
                  </span>
                )}
              </div>
              <p className="font-display mt-3 text-3xl">
                ${meta.priceMonthly}
                <span className="text-sm font-sans text-[color:var(--tb-slate-soft)]">
                  /mo
                </span>
              </p>
              {meta.priceYearly > 0 && (
                <p className="text-xs text-[color:var(--tb-slate-soft)]">
                  or ${meta.priceYearly}/yr
                </p>
              )}
              <ul className="mt-4 space-y-1.5 text-sm text-[color:var(--tb-slate)]">
                {meta.features.map((f) => (
                  <li key={f}>· {f}</li>
                ))}
              </ul>
              {!current && p !== "free" && (
                <div className="mt-5">
                  <BillingActions
                    plan={p}
                    mode="upgrade"
                    demoMode={isDemoMode()}
                  />
                </div>
              )}
              {current && p !== "free" && (
                <div className="mt-5">
                  <BillingActions
                    plan={p}
                    mode="portal"
                    demoMode={isDemoMode()}
                  />
                </div>
              )}
              {current && p === "free" && (
                <p className="mt-5 text-sm text-[color:var(--tb-slate-soft)]">
                  Upgrade to unlock more active links and auto reminders.
                </p>
              )}
            </div>
          );
        })}
      </div>

      <p className="mt-8 text-sm text-[color:var(--tb-slate-soft)]">
        Need help?{" "}
        <Link href="mailto:hello@totebird.com" className="text-[color:var(--tb-orange-deep)]">
          hello@totebird.com
        </Link>
      </p>
    </div>
  );
}
