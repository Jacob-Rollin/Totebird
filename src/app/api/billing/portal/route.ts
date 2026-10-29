import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { createCustomerPortalSession } from "@/lib/stripe";

export async function POST() {
  const session = await requireSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await createCustomerPortalSession({
    customerId: session.stripeCustomerId || "",
  });

  return NextResponse.json(result);
}
