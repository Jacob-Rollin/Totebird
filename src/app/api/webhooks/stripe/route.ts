import { NextResponse } from "next/server";
import {
  getInvoiceByCheckoutSession,
  markInvoicePaid,
} from "@/lib/data";
import { getStripe, hasStripeSafe } from "@/lib/stripe-webhook";

export async function POST(req: Request) {
  if (!hasStripeSafe()) {
    return NextResponse.json(
      { error: "Stripe not configured" },
      { status: 503 },
    );
  }

  const stripe = getStripe()!;
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const body = await req.text();

  let event;
  try {
    if (secret) {
      const sig = req.headers.get("stripe-signature");
      if (!sig) {
        return NextResponse.json({ error: "Missing signature" }, { status: 400 });
      }
      event = stripe.webhooks.constructEvent(body, sig, secret);
    } else {
      event = JSON.parse(body);
    }
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Invalid payload" },
      { status: 400 },
    );
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as {
      id: string;
      payment_intent?: string | null;
      metadata?: { linkId?: string };
    };
    const byMeta = session.metadata?.linkId;
    if (byMeta) {
      await markInvoicePaid(byMeta, session.payment_intent ?? null);
    } else {
      const inv = await getInvoiceByCheckoutSession(session.id);
      if (inv) {
        await markInvoicePaid(inv.linkId, session.payment_intent ?? null);
      }
    }
  }

  return NextResponse.json({ received: true });
}
