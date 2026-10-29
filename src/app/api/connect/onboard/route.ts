import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { updateUserModeration } from "@/lib/data";
import { createExpressOnboardingLink } from "@/lib/stripe-connect";

/**
 * Start Stripe Connect Express onboarding (Account Link).
 * Requires STRIPE_CONNECT_ENABLED=true + STRIPE_SECRET_KEY.
 */
export async function POST() {
  const session = await requireSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await createExpressOnboardingLink({
    userId: session.id,
    email: session.email,
    existingAccountId: session.stripeConnectAccountId,
  });

  if (result.ok && result.accountId && result.accountId !== session.stripeConnectAccountId) {
    await updateUserModeration(session.id, {
      stripeConnectAccountId: result.accountId,
    });
  }

  return NextResponse.json(result);
}
