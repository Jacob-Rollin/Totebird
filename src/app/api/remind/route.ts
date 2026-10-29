import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { getInvoiceBundle, getLinkById } from "@/lib/data";
import { appUrl } from "@/lib/env";
import { sendReminderEmail } from "@/lib/resend";
import { formatMoney } from "@/lib/format";
import { demoStore } from "@/db/demo-store";
import { isDemoMode, hasDatabase } from "@/lib/env";

export async function POST(req: Request) {
  const session = await requireSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { linkId } = await req.json();
  const link = await getLinkById(String(linkId || ""));
  if (!link || link.userId !== session.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (!link.clientEmail) {
    return NextResponse.json(
      { error: "No client email on this link" },
      { status: 400 },
    );
  }

  const path = link.type === "checklist" ? `/c/${link.token}` : `/i/${link.token}`;
  const url = `${appUrl()}${path}`;

  let subject = `Reminder: ${link.title}`;
  let html = `<p>Friendly reminder from ${session.name || session.email}.</p>
<p><a href="${url}">${link.title}</a></p>`;

  if (link.type === "invoice") {
    const bundle = await getInvoiceBundle(link.token);
    if (bundle?.invoice) {
      subject = `Invoice reminder: ${formatMoney(bundle.invoice.amountCents, bundle.invoice.currency)}`;
      html = `<p>Your invoice <strong>${link.title}</strong> for ${formatMoney(bundle.invoice.amountCents, bundle.invoice.currency)} is waiting.</p>
<p><a href="${url}">Pay now</a></p>`;
    }
  }

  const result = await sendReminderEmail({
    to: link.clientEmail,
    subject,
    html,
  });

  if (isDemoMode() || !hasDatabase()) {
    demoStore.addEvent({
      type: "reminder",
      linkId: link.id,
      userId: session.id,
      meta: JSON.stringify({ to: link.clientEmail, demo: result.demo }),
    });
  }

  return NextResponse.json({
    ok: result.ok || result.demo,
    message: result.ok
      ? "Reminder sent"
      : result.message || "Logged (email not configured)",
  });
}
