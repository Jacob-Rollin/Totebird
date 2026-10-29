import { NextResponse } from "next/server";
import type Stripe from "stripe";
import {
  getInvoiceByCheckoutSession,
  getUserById,
  markInvoicePaid,
  updateUserModeration,
} from "@/lib/data";
import { isDemoMode } from "@/lib/env";
import { parseConnectAccountEvent } from "@/lib/stripe-connect";
import {
  syncUserFromCheckoutSession,
  syncUserFromSubscriptionEvent,
} from "@/lib/stripe-billing-sync";
import { getStripe, hasStripeSafe } from "@/lib/stripe-webhook";

/** Node runtime so req.text() is the raw body Stripe signature verification needs on Netlify. */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!hasStripeSafe()) {
    return NextResponse.json(
      { error: "Stripe not configured" },
      { status: 503 },
    );
  }

  const stripe = getStripe()!;
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  // Raw body required — do not req.json() before constructEvent.
  const body = await req.text();

  let event: Stripe.Event;
  try {
    if (secret) {
      const sig = req.headers.get("stripe-signature");
      if (!sig) {
        return NextResponse.json({ error: "Missing signature" }, { status: 400 });
      }
      event = stripe.webhooks.constructEvent(body, sig, secret);
    } else if (isDemoMode()) {
      // Local/demo only — never accept unsigned webhooks when Clerk+DB are live.
      event = JSON.parse(body) as Stripe.Event;
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

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      if (session.mode === "subscription") {
        // Resolves plan from metadata.plan OR Price ID; user from metadata.userId,
        // client_reference_id, or stripeCustomerId. Writes Neon via updateUserBilling
        // (never in-memory demo store when Clerk+DB are live).
        const updated = await syncUserFromCheckoutSession(session);
        if (!updated) {
          console.error(
            "[totebird] checkout.session.completed subscription: plan not applied",
            {
              sessionId: session.id,
              metadata: session.metadata,
              client_reference_id: session.client_reference_id,
              customer: session.customer,
            },
          );
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
      const sub = event.data.object as Stripe.Subscription;
      const updated = await syncUserFromSubscriptionEvent(sub, event.type);
      if (!updated) {
        console.error(
          "[totebird] subscription event: plan not applied",
          event.type,
          sub.id,
          sub.metadata,
        );
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
  } catch (err) {
    // DB / Stripe retrieve failures — non-2xx so Stripe retries; avoid silent 200.
    console.error("[totebird] stripe webhook handler error", event.type, err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Webhook handler failed" },
      { status: 500 },
    );
  }

  return NextResponse.json({ received: true });
}
