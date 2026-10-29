import { NextResponse } from "next/server";
import { getInvoiceBundle, setCheckoutSession } from "@/lib/data";
import { isStripeConnectEnabled } from "@/lib/env";
import { createInvoiceCheckout } from "@/lib/stripe";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const bundle = await getInvoiceBundle(token);
  if (!bundle || !bundle.invoice) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const { link, invoice, lineItems, owner } = bundle;
  if (
    link.status === "closed" ||
    link.status === "disabled" ||
    link.status === "archived"
  ) {
    return NextResponse.json({ error: "Link closed" }, { status: 403 });
  }
  if (invoice.status === "paid") {
    return NextResponse.json({ error: "Already paid" }, { status: 400 });
  }

  const connectReady =
    isStripeConnectEnabled() &&
    Boolean(owner?.stripeConnectAccountId) &&
    Boolean(owner?.stripeConnectChargesEnabled);

  const checkout = await createInvoiceCheckout({
    amountCents: invoice.amountCents,
    currency: invoice.currency,
    title: link.title,
    description: invoice.description,
    token,
    clientEmail: link.clientEmail,
    linkId: link.id,
    lineItems: lineItems.map((li) => ({
      description: li.description,
      quantity: li.quantity,
      unitAmountCents: li.unitAmountCents,
    })),
    connectAccountId: connectReady ? owner!.stripeConnectAccountId : null,
    ownerPlan: owner?.plan ?? "free",
  });

  if (checkout.sessionId) {
    await setCheckoutSession(link.id, checkout.sessionId);
  }

  return NextResponse.json({
    ok: checkout.ok,
    url: checkout.url,
    message: checkout.message,
    demo: checkout.demo,
    connect: connectReady ? "direct" : "platform",
  });
}
