import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { originFromRequest } from "@/lib/env-public";
import { createSubscriptionCheckout } from "@/lib/stripe";

export async function POST(req: Request) {
  const session = await requireSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const plan = body.plan === "studio" ? "studio" : "solo";
  const interval = body.interval === "year" ? "year" : "month";

  const result = await createSubscriptionCheckout({
    plan,
    interval,
    customerEmail: session.email,
    customerId: session.stripeCustomerId,
    subscriptionId: session.stripeSubscriptionId,
    userId: session.id,
    returnBaseUrl: originFromRequest(req),
  });

  return NextResponse.json(result);
}
