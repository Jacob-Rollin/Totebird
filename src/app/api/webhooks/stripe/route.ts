import { NextResponse } from "next/server";
import {
  getInvoiceByCheckoutSession,
  getUserById,
  markInvoicePaid,
  updateUserModeration,
} from "@/lib/data";
import { isDemoMode } from "@/lib/env";
import { planFromPriceId } from "@/lib/stripe";
import { parseConnectAccountEvent } from "@/lib/stripe-connect";
import { getStripe, hasStripeSafe } from "@/lib/stripe-webhook";
import type { Plan } from "@/lib/plans";

function subscriptionPriceId(sub: {
  items?: { data?: { price?: { id?: string } | string }[] };
}): string | null {
  const price = sub.items?.data?.[0]?.price;
  if (!price) return null;
  return typeof price === "string" ? price : price.id ?? null;
}

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
    } else if (isDemoMode()) {
      // Local/demo only — never accept unsigned webhooks when Clerk+DB are live.
      event = JSON.parse(body);
    } else {
      return NextResponse.json(
        {
          error:
            "STRIPE_WEBHOOK_SECRET is required when the app is not in demo mode",
        },
        { status: 500 },
      );
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
      subscription?: string | null;
      metadata?: { linkId?: string; userId?: string; plan?: string };
    };

    if (session.mode === "subscription") {
      const userId = session.metadata?.userId;
      const plan = session.metadata?.plan as Plan | undefined;
      if (userId && (plan === "solo" || plan === "studio")) {
        await updateUserModeration(userId, {
          plan,
          stripeCustomerId:
            typeof session.customer === "string" ? session.customer : undefined,
          stripeSubscriptionId:
            typeof session.subscription === "string"
              ? session.subscription
              : undefined,
        });
      }
    } else {
      const byMeta = session.metadata?.linkId;
      if (byMeta) {
        await markInvoicePaid(
          byMeta,
          typeof session.payment_intent === "string"
            ? session.payment_intent
            : null,
        );
      } else {
        const inv = await getInvoiceByCheckoutSession(session.id);
        if (inv) {
          await markInvoicePaid(
            inv.linkId,
            typeof session.payment_intent === "string"
              ? session.payment_intent
              : null,
          );
        }
      }
    }
  }

  if (
    event.type === "customer.subscription.deleted" ||
    event.type === "customer.subscription.updated"
  ) {
    const sub = event.data.object as {
      id?: string;
      status?: string;
      metadata?: { userId?: string; plan?: string };
      customer?: string;
      items?: { data?: { price?: { id?: string } | string }[] };
    };
    const userId = sub.metadata?.userId;
    if (userId) {
      const fromPrice = planFromPriceId(subscriptionPriceId(sub));
      const fromMeta =
        sub.metadata?.plan === "solo" || sub.metadata?.plan === "studio"
          ? (sub.metadata.plan as Plan)
          : null;
      const plan = fromPrice ?? fromMeta;

      if (
        event.type === "customer.subscription.deleted" ||
        sub.status === "canceled" ||
        sub.status === "unpaid" ||
        sub.status === "incomplete_expired"
      ) {
        await updateUserModeration(userId, {
          plan: "free",
          stripeSubscriptionId: null,
        });
      } else if (plan === "solo" || plan === "studio") {
        await updateUserModeration(userId, {
          plan,
          stripeCustomerId:
            typeof sub.customer === "string" ? sub.customer : undefined,
          stripeSubscriptionId: sub.id,
        });
      }
    }
  }

  // Connect Express lifecycle (Phase 2 scaffold — persists when account metadata has user id)
  if (
    event.type === "account.updated" ||
    event.type === "account.application.deauthorized"
  ) {
    const account = event.data.object as {
      id?: string;
      charges_enabled?: boolean;
      details_submitted?: boolean;
      metadata?: { totebirdUserId?: string };
    };

    if (event.type === "account.application.deauthorized") {
      const parsed = parseConnectAccountEvent(account);
      if (parsed.userId) {
        await updateUserModeration(parsed.userId, {
          stripeConnectAccountId: null,
          stripeConnectChargesEnabled: false,
          stripeConnectDetailsSubmitted: false,
        });
      }
    } else {
      const parsed = parseConnectAccountEvent(account);
      // TODO(Phase 3): if metadata.totebirdUserId missing, resolve via
      // stripe_connect_account_id unique index lookup.
      if (parsed.userId) {
        const existing = await getUserById(parsed.userId);
        if (existing) {
          await updateUserModeration(parsed.userId, {
            stripeConnectAccountId: parsed.accountId ?? undefined,
            stripeConnectChargesEnabled: parsed.chargesEnabled,
            stripeConnectDetailsSubmitted: parsed.detailsSubmitted,
          });
        }
      }
    }
  }

  return NextResponse.json({ received: true });
}
