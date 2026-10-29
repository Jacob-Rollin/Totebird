import Stripe from "stripe";
import { appUrl, hasStripe } from "@/lib/env";

export function getStripe() {
  if (!hasStripe()) return null;
  return new Stripe(process.env.STRIPE_SECRET_KEY!);
}

export async function createInvoiceCheckout(input: {
  amountCents: number;
  currency: string;
  title: string;
  description?: string | null;
  token: string;
  clientEmail?: string | null;
  linkId: string;
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

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: input.clientEmail || undefined,
    line_items: [
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
    ],
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
