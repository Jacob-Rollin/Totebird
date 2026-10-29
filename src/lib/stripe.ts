import { appUrl, platformFeeBps } from "@/lib/env";
import { getStripe } from "@/lib/stripe-client";
import type { Plan } from "@/lib/plans";

export { getStripe };

export function billingPriceId(
  plan: "solo" | "studio",
  interval: "month" | "year",
) {
  const map: Record<string, string | undefined> = {
    "solo:month": process.env.STRIPE_PRICE_SOLO_MONTHLY,
    "solo:year": process.env.STRIPE_PRICE_SOLO_YEARLY,
    "studio:month": process.env.STRIPE_PRICE_STUDIO_MONTHLY,
    "studio:year": process.env.STRIPE_PRICE_STUDIO_YEARLY,
  };
  return map[`${plan}:${interval}`] || null;
}

/** Map a Stripe Price ID back to Totebird plan (Customer Portal switches). */
export function planFromPriceId(priceId: string | null | undefined): Plan | null {
  if (!priceId) return null;
  const entries: [Plan, string | undefined][] = [
    ["solo", process.env.STRIPE_PRICE_SOLO_MONTHLY],
    ["solo", process.env.STRIPE_PRICE_SOLO_YEARLY],
    ["studio", process.env.STRIPE_PRICE_STUDIO_MONTHLY],
    ["studio", process.env.STRIPE_PRICE_STUDIO_YEARLY],
  ];
  for (const [plan, id] of entries) {
    if (id && id === priceId) return plan;
  }
  return null;
}

export function hasBillingPrices() {
  return Boolean(
    process.env.STRIPE_PRICE_SOLO_MONTHLY ||
      process.env.STRIPE_PRICE_SOLO_YEARLY ||
      process.env.STRIPE_PRICE_STUDIO_MONTHLY ||
      process.env.STRIPE_PRICE_STUDIO_YEARLY,
  );
}

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
  /** When Connect Direct is live: Express acct_… with charges_enabled */
  connectAccountId?: string | null;
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

  const useConnect =
    Boolean(input.connectAccountId) &&
    process.env.STRIPE_CONNECT_ENABLED === "true";

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
    },
  };

  // Direct charge: optional application fee on Free (Solo/Studio = 0)
  if (useConnect && fee > 0) {
    sessionParams.payment_intent_data = {
      application_fee_amount: fee,
    };
  }

  const requestOptions = useConnect
    ? {
        stripeAccount: input.connectAccountId!,
        idempotencyKey: `inv_checkout_${input.linkId}_${input.amountCents}`,
      }
    : { idempotencyKey: `inv_checkout_${input.linkId}_${input.amountCents}` };

  // TODO(Phase 3): when STRIPE_CONNECT_ENABLED and freelancer lacks charges_enabled,
  // prefer blocking pay with "Connect your Stripe" instead of silent platform Checkout.
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

export async function createSubscriptionCheckout(input: {
  plan: Exclude<Plan, "free">;
  interval: "month" | "year";
  customerEmail: string;
  customerId?: string | null;
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

  const session = await stripe.checkout.sessions.create(
    {
      mode: "subscription",
      customer: input.customerId || undefined,
      customer_email: input.customerId ? undefined : input.customerEmail,
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
    { idempotencyKey: `sub_checkout_${input.userId}_${input.plan}_${input.interval}` },
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
