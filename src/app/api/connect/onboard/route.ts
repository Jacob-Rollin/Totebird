import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { updateUserModeration } from "@/lib/data";
import { originFromRequest } from "@/lib/env-public";
import { createExpressOnboardingLink } from "@/lib/stripe-connect";

/**
 * Start Stripe Connect Express onboarding (Account Link).
 * Requires STRIPE_CONNECT_ENABLED=true + STRIPE_SECRET_KEY.
 * Always returns JSON (never a bare 500 HTML page) so the Settings button
 * can show a visible error instead of a silent no-op.
 */
export async function POST(req: Request) {
  try {
    const session = await requireSession();
    if (!session) {
      return NextResponse.json(
        {
          ok: false,
          url: null,
          accountId: null,
          error: "Unauthorized",
          message: "Sign in again, then retry Connect Stripe.",
        },
        { status: 401 },
      );
    }

    const result = await createExpressOnboardingLink({
      userId: session.id,
      email: session.email,
      existingAccountId: session.stripeConnectAccountId,
      returnBaseUrl: originFromRequest(req),
    });

    if (
      result.ok &&
      result.accountId &&
      result.accountId !== session.stripeConnectAccountId
    ) {
      try {
        await updateUserModeration(session.id, {
          stripeConnectAccountId: result.accountId,
        });
      } catch (err) {
        // Still return the Account Link URL — orphaned acct_ is recoverable via Resume.
        console.error(
          "[totebird] connect onboard: failed to persist account id",
          err,
        );
      }
    }

    return NextResponse.json(result, { status: result.ok ? 200 : 400 });
  } catch (err) {
    console.error("[totebird] POST /api/connect/onboard failed", err);
    return NextResponse.json(
      {
        ok: false,
        url: null,
        accountId: null,
        error: "Connect onboard failed",
        message:
          err instanceof Error && err.message
            ? err.message
            : "Could not start Stripe Connect onboarding. Try again.",
      },
      { status: 500 },
    );
  }
}
