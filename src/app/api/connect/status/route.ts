import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { updateUserModeration } from "@/lib/data";
import {
  connectFeatureStatus,
  refreshConnectAccount,
} from "@/lib/stripe-connect";
import { isStripeConnectEnabled } from "@/lib/env";

/** Current Connect status; optional ?refresh=1 to pull from Stripe. */
export async function GET(req: Request) {
  const session = await requireSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const shouldRefresh = url.searchParams.get("refresh") === "1";

  if (
    shouldRefresh &&
    isStripeConnectEnabled() &&
    session.stripeConnectAccountId
  ) {
    const live = await refreshConnectAccount(session.stripeConnectAccountId);
    if (live) {
      await updateUserModeration(session.id, {
        stripeConnectChargesEnabled: live.chargesEnabled,
        stripeConnectDetailsSubmitted: live.detailsSubmitted,
      });
      session.stripeConnectChargesEnabled = live.chargesEnabled;
      session.stripeConnectDetailsSubmitted = live.detailsSubmitted;
    }
  }

  return NextResponse.json(connectFeatureStatus(session));
}
