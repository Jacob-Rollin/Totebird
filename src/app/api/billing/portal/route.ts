import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { originFromRequest } from "@/lib/env-public";
import { createCustomerPortalSession } from "@/lib/stripe";

export async function POST(req: Request) {
  const session = await requireSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await createCustomerPortalSession({
    customerId: session.stripeCustomerId || "",
    returnBaseUrl: originFromRequest(req),
  });

  return NextResponse.json(result);
}
