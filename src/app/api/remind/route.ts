import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import {
  getChecklistBundle,
  getInvoiceBundle,
  getLinkById,
  getLinkProgress,
} from "@/lib/data";
import { appUrl, hasDatabase, isDemoMode } from "@/lib/env";
import { sendEmail } from "@/lib/resend";
import { formatDate } from "@/lib/format";
import {
  checklistReminderEmail,
  invoiceOverdueEmail,
  invoicePaidEmail,
} from "@/lib/email-templates";
import { demoStore } from "@/db/demo-store";

export async function POST(req: Request) {
  const session = await requireSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const linkId = String(body.linkId || "");
  const kind = String(body.kind || "reminder");
  const link = await getLinkById(linkId);
  if (!link || link.userId !== session.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (!link.clientEmail) {
    return NextResponse.json(
      { error: "No client email on this link" },
      { status: 400 },
    );
  }

  const freelancerName = session.name || session.email;
  const path = link.type === "checklist" ? `/c/${link.token}` : `/i/${link.token}`;
  const url = `${appUrl()}${path}`;

  let email;
  if (link.type === "checklist") {
    const progress = await getLinkProgress(link.id);
    email = checklistReminderEmail({
      freelancerName,
      title: link.title,
      url,
      progressPercent: progress.percent,
    });
  } else {
    const bundle = await getInvoiceBundle(link.token);
    if (!bundle?.invoice) {
      return NextResponse.json({ error: "Invoice missing" }, { status: 404 });
    }
    if (kind === "paid" || bundle.invoice.status === "paid") {
      email = invoicePaidEmail({
        freelancerName,
        title: link.title,
        amountCents: bundle.invoice.amountCents,
        currency: bundle.invoice.currency,
        url,
      });
    } else {
      email = invoiceOverdueEmail({
        freelancerName,
        title: link.title,
        url,
        amountCents: bundle.invoice.amountCents,
        currency: bundle.invoice.currency,
        dueLabel: bundle.invoice.dueAt
          ? formatDate(bundle.invoice.dueAt)
          : "soon",
      });
    }
  }

  // Touch checklist bundle so demo store stays warm
  if (link.type === "checklist") await getChecklistBundle(link.token);

  const result = await sendEmail({
    to: link.clientEmail,
    subject: email.subject,
    html: email.html,
    text: email.text,
  });

  if (isDemoMode() || !hasDatabase()) {
    demoStore.addEvent({
      type: "reminder",
      linkId: link.id,
      userId: session.id,
      meta: JSON.stringify({
        to: link.clientEmail,
        subject: email.subject,
        demo: result.demo,
      }),
    });
  }

  return NextResponse.json({
    ok: result.ok || result.demo,
    message: result.ok
      ? "Email sent"
      : result.message || "Logged (email not configured)",
  });
}
