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
import { planFromPriceId } from "@/lib/stripe";
import type { Plan } from "@/lib/plans";

type SubLike = {
  id?: string;
  status?: string;
  metadata?: { userId?: string; plan?: string } | null;
  customer?: string | { id?: string } | null;
  items?: { data?: { price?: { id?: string } | string }[] };
};

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
  plan: Exclude<Plan, "free">;
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

async function planFromCheckoutSession(
  stripe: Stripe,
  session: Stripe.Checkout.Session,
): Promise<{
  plan: Exclude<Plan, "free"> | null;
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

  const userId = await resolveBillingUserId({
    userId: opts?.preferUserId || session.metadata?.userId,
    clientReferenceId: session.client_reference_id,
    customerId: customerIdOf(session.customer),
    email: sessionEmail,
  });
  if (!userId) {
    console.error(
      "[totebird] checkout.session.completed: no userId / client_reference_id / customer / email match",
      session.id,
    );
    return null;
  }

  const updated = await applyPaidPlanToUser({
    userId,
    plan,
    stripeCustomerId: customerIdOf(session.customer),
    stripeSubscriptionId: subscriptionId,
  });
  // If metadata pointed at a missing row, retry via email (Neon vs demo-store id skew).
  if (!updated && sessionEmail) {
    const byEmail = await getUserByEmailBilling(sessionEmail);
    if (byEmail && byEmail.id !== userId) {
      return applyPaidPlanToUser({
        userId: byEmail.id,
        plan,
        stripeCustomerId: customerIdOf(session.customer),
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
  const userId = await resolveBillingUserId({
    userId: opts?.preferUserId || sub.metadata?.userId,
    customerId: customerIdOf(sub.customer),
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
    stripeCustomerId: customerIdOf(sub.customer),
    stripeSubscriptionId: sub.id,
  });
}

/**
 * Post-Checkout UX fallback: when the user lands on /app/billing?upgraded=1,
 * pull the session (or active subscription) from Stripe and write users.plan
 * even if the webhook is delayed or misconfigured.
 */
export async function syncPlanAfterUpgradeReturn(input: {
  userId: string;
  email: string;
  stripeCustomerId?: string | null;
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

    const active = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 5,
    });
    const trialing = await stripe.subscriptions.list({
      customer: customerId,
      status: "trialing",
      limit: 5,
    });
    const sub = [...active.data, ...trialing.data][0];
    if (!sub) return null;

    return syncUserFromSubscriptionEvent(sub, "customer.subscription.updated", {
      preferUserId: input.userId,
      email: input.email,
    });
  } catch (err) {
    console.error("[totebird] syncPlanAfterUpgradeReturn failed", err);
    return null;
  }
}
