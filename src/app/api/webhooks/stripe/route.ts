import { NextResponse } from "next/server";
import {
  getInvoiceByCheckoutSession,
  markInvoicePaid,
  updateUserModeration,
} from "@/lib/data";
import { getStripe, hasStripeSafe } from "@/lib/stripe-webhook";
import type { Plan } from "@/lib/plans";

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
      mode?: string;
      customer?: string | null;
      payment_intent?: string | null;
      metadata?: { linkId?: string; userId?: string; plan?: string };
    };

    if (session.mode === "subscription") {
      const userId = session.metadata?.userId;
      const plan = session.metadata?.plan as Plan | undefined;
      if (userId && (plan === "solo" || plan === "studio")) {
        await updateUserModeration(userId, {
          plan,
          stripeCustomerId: session.customer || undefined,
        });
      }
    } else {
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
  }

  if (
    event.type === "customer.subscription.deleted" ||
    event.type === "customer.subscription.updated"
  ) {
    const sub = event.data.object as {
      status?: string;
      metadata?: { userId?: string; plan?: string };
      customer?: string;
    };
    const userId = sub.metadata?.userId;
    if (userId) {
      if (event.type === "customer.subscription.deleted" || sub.status === "canceled") {
        await updateUserModeration(userId, { plan: "free" });
      } else if (sub.metadata?.plan === "solo" || sub.metadata?.plan === "studio") {
        await updateUserModeration(userId, {
          plan: sub.metadata.plan,
          stripeCustomerId: typeof sub.customer === "string" ? sub.customer : undefined,
        });
      }
    }
  }

  return NextResponse.json({ received: true });
}
