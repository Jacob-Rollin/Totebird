import Stripe from "stripe";
import { appUrl, hasStripe } from "@/lib/env";
import type { Plan } from "@/lib/plans";

export function getStripe() {
  if (!hasStripe()) return null;
  return new Stripe(process.env.STRIPE_SECRET_KEY!);
}

export function billingPriceId(plan: "solo" | "studio", interval: "month" | "year") {
  const map: Record<string, string | undefined> = {
    "solo:month": process.env.STRIPE_PRICE_SOLO_MONTHLY,
    "solo:year": process.env.STRIPE_PRICE_SOLO_YEARLY,
    "studio:month": process.env.STRIPE_PRICE_STUDIO_MONTHLY,
    "studio:year": process.env.STRIPE_PRICE_STUDIO_YEARLY,
  };
  return map[`${plan}:${interval}`] || null;
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

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: input.clientEmail || undefined,
    line_items,
    success_url: `${appUrl()}/i/${input.token}?paid=1`,
    cancel_url: `${appUrl()}/i/${input.token}?canceled=1`,
    metadata: {
      linkId: input.linkId,
      token: input.token,
    },
  });

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
}) {
  const stripe = getStripe();
  const priceId = billingPriceId(input.plan, input.interval);
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

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: input.customerId || undefined,
    customer_email: input.customerId ? undefined : input.customerEmail,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl()}/app/billing?upgraded=1`,
    cancel_url: `${appUrl()}/app/billing?canceled=1`,
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
  });

  return {
    ok: true as const,
    demo: false as const,
    url: session.url,
    message: null as string | null,
  };
}

export async function createCustomerPortalSession(input: {
  customerId: string;
}) {
  const stripe = getStripe();
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
    return_url: `${appUrl()}/app/billing`,
  });

  return {
    ok: true as const,
    demo: false as const,
    url: session.url,
    message: null as string | null,
  };
}
