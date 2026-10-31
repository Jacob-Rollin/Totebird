import { appUrl, isStripeConnectEnabled, platformFeeBps } from "@/lib/env";
import { getStripe } from "@/lib/stripe-client";
import type { Plan } from "@/lib/plans";
import {
  CONNECT_REQUIRED_MESSAGE,
  isConnectReadyForInvoices,
} from "@/lib/stripe-connect";
import {
  applyPaidPlanToUser,
  cancelOtherTotebirdSubscriptions,
  listActiveTotebirdSubscriptions,
  pickHighestSubscription,
  planFromSubscription,
  subscriptionPriceId,
} from "@/lib/stripe-billing-sync";
import {
  billingPriceId,
  hasBillingPrices,
  planFromPriceId,
} from "@/lib/stripe-prices";

export { getStripe, billingPriceId, hasBillingPrices, planFromPriceId };

/** Application fee cents for Connect Direct charges (Free plan only). */
export function applicationFeeCents(amountCents: number, plan: Plan) {
  if (plan !== "free") return 0;
  const bps = platformFeeBps();
  if (bps <= 0) return 0;
  return Math.max(0, Math.round((amountCents * bps) / 10_000));
}

export async function createInvoiceCheckout(input: {
  amountCents: number;
  currency: string;
  title: string;
  description?: string | null;
  token: string;
  clientEmail?: string | null;
  linkId: string;
  lineItems?: { description: string; quantity: number; unitAmountCents: number }[];
  /** Express acct_… — required when Connect is enabled */
  connectAccountId?: string | null;
  /** Must be true when Connect is enabled (charges_enabled on the account) */
  connectChargesEnabled?: boolean | null;
  ownerPlan?: Plan;
}) {
  const stripe = getStripe();
  if (!stripe) {
    return {
      ok: false as const,
      demo: true as const,
      url: null as string | null,
      sessionId: null as string | null,
      message:
        "Stripe is not configured. Set STRIPE_SECRET_KEY to enable Checkout.",
    };
  }

  const connectOn = isStripeConnectEnabled();
  const connectReady = isConnectReadyForInvoices({
    stripeConnectAccountId: input.connectAccountId,
    stripeConnectChargesEnabled: input.connectChargesEnabled,
  });

  // Hard block: never charge the platform when Connect is required.
  if (connectOn && !connectReady) {
    return {
      ok: false as const,
      demo: false as const,
      url: null as string | null,
      sessionId: null as string | null,
      message: CONNECT_REQUIRED_MESSAGE,
    };
  }

  const line_items =
    input.lineItems && input.lineItems.length
      ? input.lineItems.map((li) => ({
          quantity: li.quantity,
          price_data: {
            currency: input.currency,
            unit_amount: li.unitAmountCents,
            product_data: { name: li.description },
          },
        }))
      : [
          {
            quantity: 1,
            price_data: {
              currency: input.currency,
              unit_amount: input.amountCents,
              product_data: {
                name: input.title,
                description: input.description || undefined,
              },
            },
          },
        ];

  const useConnect = connectReady;
  const fee = useConnect
    ? applicationFeeCents(input.amountCents, input.ownerPlan ?? "free")
    : 0;

  const sessionParams: Parameters<typeof stripe.checkout.sessions.create>[0] = {
    mode: "payment",
    customer_email: input.clientEmail || undefined,
    line_items,
    success_url: `${appUrl()}/i/${input.token}?paid=1`,
    cancel_url: `${appUrl()}/i/${input.token}?canceled=1`,
    client_reference_id: input.linkId,
    metadata: {
      linkId: input.linkId,
      token: input.token,
      connect: useConnect ? "direct" : "platform",
      applicationFeeCents: String(fee),
      ownerPlan: input.ownerPlan ?? "free",
    },
  };

  // Direct charge on connected account; Free plan takes platform application fee.
  if (useConnect) {
    sessionParams.payment_intent_data = {
      ...(fee > 0 ? { application_fee_amount: fee } : {}),
      metadata: {
        linkId: input.linkId,
        token: input.token,
        applicationFeeCents: String(fee),
      },
    };
  }

  const requestOptions = useConnect
    ? {
        stripeAccount: input.connectAccountId!,
        idempotencyKey: `inv_checkout_${input.linkId}_${input.amountCents}`,
      }
    : { idempotencyKey: `inv_checkout_${input.linkId}_${input.amountCents}` };

  const session = await stripe.checkout.sessions.create(
    sessionParams,
    requestOptions,
  );

  return {
    ok: true as const,
    demo: false as const,
    url: session.url,
    sessionId: session.id,
    message: null as string | null,
  };
}

/**
 * First paid plan → Checkout Session.
 * Existing Totebird sub → subscriptions.update (proration) so Solo→Studio
 * does not stack a second active subscription.
 */
export async function createSubscriptionCheckout(input: {
  plan: Exclude<Plan, "free">;
  interval: "month" | "year";
  customerEmail: string;
  customerId?: string | null;
  subscriptionId?: string | null;
  userId: string;
  /** Prefer request origin (www) over stale NEXT_PUBLIC_APP_URL. */
  returnBaseUrl?: string | null;
}) {
  const stripe = getStripe();
  const priceId = billingPriceId(input.plan, input.interval);
  const base = (input.returnBaseUrl || appUrl()).replace(/\/$/, "");
  if (!stripe) {
    return {
      ok: false as const,
      demo: true as const,
      url: null as string | null,
      message:
        "Stripe is not configured. Set STRIPE_SECRET_KEY and price IDs to enable upgrades.",
    };
  }
  if (!priceId) {
    return {
      ok: false as const,
      demo: true as const,
      url: null as string | null,
      message: `Missing Stripe Price ID for ${input.plan} (${input.interval}). See .env.example.`,
    };
  }

  let customerId = input.customerId || null;
  if (!customerId && input.subscriptionId) {
    try {
      const existing = await stripe.subscriptions.retrieve(input.subscriptionId);
      customerId =
        typeof existing.customer === "string"
          ? existing.customer
          : existing.customer?.id ?? null;
    } catch {
      /* fall through to Checkout */
    }
  }

  if (customerId) {
    try {
      const ranked = await listActiveTotebirdSubscriptions(stripe, customerId);
      // Always mutate the highest active Totebird sub (studio > solo). A stale
      // users.stripe_subscription_id pointing at Solo must not win over Studio.
      const current = pickHighestSubscription(ranked, input.subscriptionId);

      if (current) {
        const currentPrice = subscriptionPriceId(current.sub);
        if (currentPrice === priceId && current.plan === input.plan) {
          await cancelOtherTotebirdSubscriptions(
            stripe,
            customerId,
            current.sub.id,
          );
          await applyPaidPlanToUser({
            userId: input.userId,
            plan: input.plan,
            stripeCustomerId: customerId,
            stripeSubscriptionId: current.sub.id,
          });
          return {
            ok: true as const,
            demo: false as const,
            url: `${base}/app/billing?upgraded=1`,
            message: null as string | null,
          };
        }

        const itemId = current.sub.items.data[0]?.id;
        if (!itemId) {
          return {
            ok: false as const,
            demo: false as const,
            url: null as string | null,
            message: "Existing subscription has no line item to update.",
          };
        }

        const updated = await stripe.subscriptions.update(current.sub.id, {
          items: [{ id: itemId, price: priceId }],
          proration_behavior: "create_prorations",
          metadata: {
            userId: input.userId,
            plan: input.plan,
          },
          cancel_at_period_end: false,
        });

        await cancelOtherTotebirdSubscriptions(
          stripe,
          customerId,
          updated.id,
        );

        const fromSub = planFromSubscription(updated);
        const resolvedPlan =
          fromSub === "solo" || fromSub === "studio" ? fromSub : input.plan;

        await applyPaidPlanToUser({
          userId: input.userId,
          plan: resolvedPlan,
          stripeCustomerId: customerId,
          stripeSubscriptionId: updated.id,
        });

        return {
          ok: true as const,
          demo: false as const,
          url: `${base}/app/billing?upgraded=1`,
          message: null as string | null,
        };
      }
    } catch (err) {
      console.error(
        "[totebird] subscription update failed; falling back to Checkout",
        err,
      );
    }
  }

  // First paid plan (or no usable existing sub): Checkout Session.
  const session = await stripe.checkout.sessions.create(
    {
      mode: "subscription",
      customer: customerId || undefined,
      customer_email: customerId ? undefined : input.customerEmail,
      line_items: [{ price: priceId, quantity: 1 }],
      // {CHECKOUT_SESSION_ID} is replaced by Stripe so /billing can sync if the webhook lags.
      success_url: `${base}/app/billing?upgraded=1&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${base}/app/billing?canceled=1`,
      client_reference_id: input.userId,
      allow_promotion_codes: true,
      metadata: {
        userId: input.userId,
        plan: input.plan,
      },
      subscription_data: {
        metadata: {
          userId: input.userId,
          plan: input.plan,
        },
      },
    },
    {
      idempotencyKey: `sub_checkout_${input.userId}_${input.plan}_${input.interval}`,
    },
  );

  return {
    ok: true as const,
    demo: false as const,
    url: session.url,
    message: null as string | null,
  };
}

export async function createCustomerPortalSession(input: {
  customerId: string;
  returnBaseUrl?: string | null;
}) {
  const stripe = getStripe();
  const base = (input.returnBaseUrl || appUrl()).replace(/\/$/, "");
  if (!stripe) {
    return {
      ok: false as const,
      demo: true as const,
      url: null as string | null,
      message: "Stripe is not configured.",
    };
  }
  if (!input.customerId) {
    return {
      ok: false as const,
      demo: true as const,
      url: null as string | null,
      message:
        "No Stripe customer on this account yet. Upgrade once to open the Customer Portal.",
    };
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: input.customerId,
    return_url: `${base}/app/billing`,
  });

  return {
    ok: true as const,
    demo: false as const,
    url: session.url,
    message: null as string | null,
  };
}
