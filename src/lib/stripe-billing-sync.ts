import "server-only";

import type Stripe from "stripe";
import {
  getUserByEmailBilling,
  getUserByIdBilling,
  getUserByStripeCustomerId,
  updateUserBilling,
  type User,
} from "@/lib/data";
import { isDemoMode } from "@/lib/env";
import { getStripe } from "@/lib/stripe-client";
import { planFromPriceId } from "@/lib/stripe-prices";
import {
  comparePlans,
  isPaidPlan,
  type PaidPlan,
  type Plan,
} from "@/lib/plans";

type SubLike = {
  id?: string;
  status?: string;
  metadata?: { userId?: string; plan?: string } | null;
  customer?: string | { id?: string } | null;
  items?: { data?: { price?: { id?: string } | string; id?: string }[] };
};

const ACTIVE_STATUSES = new Set(["active", "trialing", "past_due"]);

export function subscriptionPriceId(sub: SubLike): string | null {
  const price = sub.items?.data?.[0]?.price;
  if (!price) return null;
  return typeof price === "string" ? price : price.id ?? null;
}

export function planFromSubscription(sub: SubLike): Plan | null {
  const fromPrice = planFromPriceId(subscriptionPriceId(sub));
  if (fromPrice === "solo" || fromPrice === "studio") return fromPrice;
  const meta = sub.metadata?.plan;
  if (meta === "solo" || meta === "studio") return meta;
  return null;
}

/** True when this subscription maps to a Totebird Solo/Studio price (or metadata.plan). */
export function isTotebirdPaidSubscription(sub: SubLike): boolean {
  return isPaidPlan(planFromSubscription(sub) ?? "free");
}

function customerIdOf(
  customer: string | { id?: string } | null | undefined,
): string | null {
  if (!customer) return null;
  return typeof customer === "string" ? customer : customer.id ?? null;
}

export async function resolveBillingUserId(input: {
  userId?: string | null;
  clientReferenceId?: string | null;
  customerId?: string | null;
  email?: string | null;
}): Promise<string | null> {
  const candidates = [input.userId, input.clientReferenceId].filter(
    (v): v is string => Boolean(v),
  );
  for (const id of candidates) {
    const user = await getUserByIdBilling(id);
    if (user) return user.id;
  }
  if (input.customerId) {
    const byCustomer = await getUserByStripeCustomerId(input.customerId);
    if (byCustomer) return byCustomer.id;
  }
  if (input.email) {
    const byEmail = await getUserByEmailBilling(input.email);
    if (byEmail) return byEmail.id;
  }
  // Prefer an explicit id even if the row wasn't readable yet (insert race).
  return candidates[0] ?? null;
}

export async function applyPaidPlanToUser(input: {
  userId: string;
  plan: PaidPlan;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
}): Promise<User | null> {
  const updated = await updateUserBilling(input.userId, {
    plan: input.plan,
    stripeCustomerId: input.stripeCustomerId || undefined,
    stripeSubscriptionId: input.stripeSubscriptionId || undefined,
  });
  if (!updated) {
    console.error(
      "[totebird] Stripe billing update matched 0 users",
      input.userId,
      input.plan,
    );
  }
  return updated;
}

export async function applyFreePlanToUser(input: {
  userId: string;
}): Promise<User | null> {
  return updateUserBilling(input.userId, {
    plan: "free",
    stripeSubscriptionId: null,
  });
}

export type RankedSubscription = {
  sub: Stripe.Subscription;
  plan: PaidPlan;
};

/** Pick studio over solo; ties prefer the preferred id, else newest. */
export function pickHighestSubscription(
  ranked: RankedSubscription[],
  preferSubscriptionId?: string | null,
): RankedSubscription | null {
  if (!ranked.length) return null;
  const sorted = [...ranked].sort((a, b) => {
    const byPlan = comparePlans(b.plan, a.plan);
    if (byPlan !== 0) return byPlan;
    if (preferSubscriptionId) {
      if (a.sub.id === preferSubscriptionId) return -1;
      if (b.sub.id === preferSubscriptionId) return 1;
    }
    return (b.sub.created ?? 0) - (a.sub.created ?? 0);
  });
  return sorted[0] ?? null;
}

export async function listActiveTotebirdSubscriptions(
  stripe: Stripe,
  customerId: string,
): Promise<RankedSubscription[]> {
  const statuses: Stripe.SubscriptionListParams["status"][] = [
    "active",
    "trialing",
    "past_due",
  ];
  const out: RankedSubscription[] = [];
  const seen = new Set<string>();
  for (const status of statuses) {
    const page = await stripe.subscriptions.list({
      customer: customerId,
      status,
      limit: 20,
    });
    for (const sub of page.data) {
      if (seen.has(sub.id)) continue;
      seen.add(sub.id);
      const plan = planFromSubscription(sub);
      if (plan === "solo" || plan === "studio") {
        out.push({ sub, plan });
      }
    }
  }
  return out;
}

/**
 * Cancel every Totebird paid subscription except `keepSubscriptionId`.
 * Immediate cancel so the customer is not double-billed.
 */
export async function cancelOtherTotebirdSubscriptions(
  stripe: Stripe,
  customerId: string,
  keepSubscriptionId: string,
): Promise<string[]> {
  const ranked = await listActiveTotebirdSubscriptions(stripe, customerId);
  const canceled: string[] = [];
  for (const { sub, plan } of ranked) {
    if (sub.id === keepSubscriptionId) continue;
    try {
      await stripe.subscriptions.cancel(sub.id);
      canceled.push(sub.id);
      console.info(
        "[totebird] canceled duplicate Totebird subscription",
        sub.id,
        plan,
        "kept",
        keepSubscriptionId,
      );
    } catch (err) {
      console.error(
        "[totebird] failed to cancel duplicate subscription",
        sub.id,
        err,
      );
    }
  }
  return canceled;
}

/**
 * Source of truth: among active Totebird subs, keep the highest plan,
 * cancel lower duplicates, write users.plan + stripe_subscription_id.
 */
export async function reconcileCustomerSubscriptions(input: {
  userId: string;
  customerId: string;
  preferSubscriptionId?: string | null;
  /** When set, still cancel others even if this id is the only one we just created. */
  ensureKeepSubscriptionId?: string | null;
}): Promise<User | null> {
  const stripe = getStripe();
  if (!stripe) return null;

  const ranked = await listActiveTotebirdSubscriptions(stripe, input.customerId);

  // Checkout can race list(): retrieve the new sub explicitly if missing.
  if (
    input.ensureKeepSubscriptionId &&
    !ranked.some((r) => r.sub.id === input.ensureKeepSubscriptionId)
  ) {
    try {
      const sub = await stripe.subscriptions.retrieve(
        input.ensureKeepSubscriptionId,
      );
      const plan = planFromSubscription(sub);
      if (
        (plan === "solo" || plan === "studio") &&
        ACTIVE_STATUSES.has(sub.status)
      ) {
        ranked.push({ sub, plan });
      }
    } catch (err) {
      console.error(
        "[totebird] reconcile: could not retrieve ensureKeepSubscriptionId",
        input.ensureKeepSubscriptionId,
        err,
      );
    }
  }

  // Always keep the highest Totebird plan (studio > solo). ensureKeep only
  // ensures the new sub is in the candidate set — it must not override Studio.
  const keep = pickHighestSubscription(
    ranked,
    input.preferSubscriptionId || input.ensureKeepSubscriptionId,
  );

  if (!keep) {
    return applyFreePlanToUser({ userId: input.userId });
  }

  await cancelOtherTotebirdSubscriptions(
    stripe,
    input.customerId,
    keep.sub.id,
  );

  return applyPaidPlanToUser({
    userId: input.userId,
    plan: keep.plan,
    stripeCustomerId: input.customerId,
    stripeSubscriptionId: keep.sub.id,
  });
}

async function planFromCheckoutSession(
  stripe: Stripe,
  session: Stripe.Checkout.Session,
): Promise<{
  plan: PaidPlan | null;
  subscriptionId: string | null;
}> {
  const metaPlan = session.metadata?.plan;
  if (metaPlan === "solo" || metaPlan === "studio") {
    const subscriptionId =
      typeof session.subscription === "string"
        ? session.subscription
        : session.subscription?.id ?? null;
    return { plan: metaPlan, subscriptionId };
  }

  const subscriptionId =
    typeof session.subscription === "string"
      ? session.subscription
      : session.subscription && typeof session.subscription !== "string"
        ? session.subscription.id
        : null;

  if (!subscriptionId) return { plan: null, subscriptionId: null };

  const sub =
    typeof session.subscription === "object" && session.subscription
      ? (session.subscription as Stripe.Subscription)
      : await stripe.subscriptions.retrieve(subscriptionId);

  const plan = planFromSubscription(sub);
  return {
    plan: plan === "solo" || plan === "studio" ? plan : null,
    subscriptionId,
  };
}

/** Apply a completed subscription Checkout Session to users.plan (+ Stripe ids). */
export async function syncUserFromCheckoutSession(
  session: Stripe.Checkout.Session,
  opts?: { preferUserId?: string | null; email?: string | null },
): Promise<User | null> {
  if (session.mode !== "subscription") return null;

  const stripe = getStripe();
  if (!stripe) return null;

  const { plan, subscriptionId } = await planFromCheckoutSession(stripe, session);
  if (!plan) {
    console.error(
      "[totebird] checkout.session.completed: could not resolve plan from metadata or Price ID",
      session.id,
    );
    return null;
  }

  const sessionEmail =
    opts?.email ||
    session.customer_email ||
    session.customer_details?.email ||
    null;

  const customerId = customerIdOf(session.customer);

  const userId = await resolveBillingUserId({
    userId: opts?.preferUserId || session.metadata?.userId,
    clientReferenceId: session.client_reference_id,
    customerId,
    email: sessionEmail,
  });
  if (!userId) {
    console.error(
      "[totebird] checkout.session.completed: no userId / client_reference_id / customer / email match",
      session.id,
    );
    return null;
  }

  // Prefer reconcile when we have a customer: cancels stacked Solo under Studio.
  if (customerId && subscriptionId) {
    const reconciled = await reconcileCustomerSubscriptions({
      userId,
      customerId,
      preferSubscriptionId: subscriptionId,
      ensureKeepSubscriptionId: subscriptionId,
    });
    if (reconciled) return reconciled;
  }

  const updated = await applyPaidPlanToUser({
    userId,
    plan,
    stripeCustomerId: customerId,
    stripeSubscriptionId: subscriptionId,
  });
  // If metadata pointed at a missing row, retry via email (Neon vs demo-store id skew).
  if (!updated && sessionEmail) {
    const byEmail = await getUserByEmailBilling(sessionEmail);
    if (byEmail && byEmail.id !== userId) {
      if (customerId && subscriptionId) {
        const reconciled = await reconcileCustomerSubscriptions({
          userId: byEmail.id,
          customerId,
          preferSubscriptionId: subscriptionId,
          ensureKeepSubscriptionId: subscriptionId,
        });
        if (reconciled) return reconciled;
      }
      return applyPaidPlanToUser({
        userId: byEmail.id,
        plan,
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscriptionId,
      });
    }
  }
  return updated;
}

export async function syncUserFromSubscriptionEvent(
  sub: SubLike,
  eventType: "customer.subscription.updated" | "customer.subscription.deleted",
  opts?: { preferUserId?: string | null; email?: string | null },
): Promise<User | null> {
  const customerId = customerIdOf(sub.customer);
  const userId = await resolveBillingUserId({
    userId: opts?.preferUserId || sub.metadata?.userId,
    customerId,
    email: opts?.email,
  });
  if (!userId) {
    console.error(
      "[totebird] subscription event: no user match",
      eventType,
      sub.id,
    );
    return null;
  }

  // Always reconcile against *all* active Totebird subs. Canceling a lower-tier
  // duplicate must not wipe Studio; a Solo-only cancel correctly returns Free.
  if (customerId) {
    const prefer =
      eventType === "customer.subscription.deleted" ||
      sub.status === "canceled" ||
      sub.status === "unpaid" ||
      sub.status === "incomplete_expired" ||
      !ACTIVE_STATUSES.has(sub.status || "")
        ? null
        : sub.id ?? null;
    return reconcileCustomerSubscriptions({
      userId,
      customerId,
      preferSubscriptionId: prefer,
    });
  }

  if (
    eventType === "customer.subscription.deleted" ||
    sub.status === "canceled" ||
    sub.status === "unpaid" ||
    sub.status === "incomplete_expired"
  ) {
    return applyFreePlanToUser({ userId });
  }

  const plan = planFromSubscription(sub);
  if (plan !== "solo" && plan !== "studio") {
    console.error(
      "[totebird] subscription.updated: could not map Price ID / metadata.plan",
      sub.id,
      subscriptionPriceId(sub),
    );
    return null;
  }

  return applyPaidPlanToUser({
    userId,
    plan,
    stripeCustomerId: customerId,
    stripeSubscriptionId: sub.id,
  });
}

/**
 * Soft migration / post-Checkout fallback: if the customer has multiple active
 * Totebird subscriptions, cancel lower tiers and set plan to the highest.
 * Also covers delayed webhooks via session_id.
 */
export async function syncPlanAfterUpgradeReturn(input: {
  userId: string;
  email: string;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  checkoutSessionId?: string | null;
}): Promise<User | null> {
  if (isDemoMode()) return null;
  const stripe = getStripe();
  if (!stripe) return null;

  try {
    if (input.checkoutSessionId) {
      const session = await stripe.checkout.sessions.retrieve(
        input.checkoutSessionId,
        { expand: ["subscription"] },
      );
      const sessionUser =
        session.metadata?.userId || session.client_reference_id || null;
      const sessionEmail =
        session.customer_email || session.customer_details?.email || null;
      const emailMatches =
        sessionEmail &&
        sessionEmail.toLowerCase() === input.email.toLowerCase();
      if (
        sessionUser &&
        sessionUser !== input.userId &&
        !emailMatches
      ) {
        console.error(
          "[totebird] upgrade return session_id user mismatch",
          input.userId,
          sessionUser,
        );
        return null;
      }
      if (session.status === "complete" || session.payment_status === "paid") {
        return syncUserFromCheckoutSession(session, {
          preferUserId: input.userId,
          email: input.email,
        });
      }
    }

    let customerId = input.stripeCustomerId || null;
    if (!customerId) {
      const found = await stripe.customers.list({
        email: input.email,
        limit: 5,
      });
      customerId = found.data[0]?.id ?? null;
    }
    if (!customerId) return null;

    return reconcileCustomerSubscriptions({
      userId: input.userId,
      customerId,
      preferSubscriptionId: input.stripeSubscriptionId,
    });
  } catch (err) {
    console.error("[totebird] syncPlanAfterUpgradeReturn failed", err);
    return null;
  }
}
