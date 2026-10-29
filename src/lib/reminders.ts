import { demoStore } from "@/db/demo-store";
import {
  getInvoiceBundle,
  getLinkProgress,
  listAllInvoices,
  listAllLinks,
} from "@/lib/data";
import {
  checklistReminderEmail,
  invoiceOverdueEmail,
} from "@/lib/email-templates";
import { appUrl, hasDatabase, isDemoMode } from "@/lib/env";
import { formatDate } from "@/lib/format";
import { sendEmail } from "@/lib/resend";

export type ReminderRunResult = {
  checked: number;
  sent: number;
  logged: number;
  skipped: number;
  details: { linkId: string; type: string; to: string; status: string }[];
};

/** Find incomplete checklists + overdue open invoices with client emails and nudge. */
export async function runDueReminders(): Promise<ReminderRunResult> {
  const details: ReminderRunResult["details"] = [];
  let sent = 0;
  let logged = 0;
  let skipped = 0;
  let checked = 0;

  const links = await listAllLinks();
  const now = Date.now();

  for (const link of links) {
    if (link.status !== "active") continue;
    if (!link.clientEmail) {
      skipped++;
      continue;
    }
    checked++;

    const ownerEmail =
      "ownerEmail" in link
        ? String((link as { ownerEmail?: string }).ownerEmail || "Totebird")
        : "Totebird";
    const url =
      link.type === "checklist"
        ? `${appUrl()}/c/${link.token}`
        : `${appUrl()}/i/${link.token}`;

    if (link.type === "checklist") {
      const progress = await getLinkProgress(link.id);
      if (progress.percent >= 100) {
        skipped++;
        continue;
      }
      const email = checklistReminderEmail({
        freelancerName: ownerEmail,
        title: link.title,
        url,
        progressPercent: progress.percent,
      });
      const result = await sendEmail({
        to: link.clientEmail,
        subject: email.subject,
        html: email.html,
        text: email.text,
      });
      if (result.ok) sent++;
      else logged++;
      details.push({
        linkId: link.id,
        type: "checklist",
        to: link.clientEmail,
        status: result.ok ? "sent" : result.demo ? "logged" : "error",
      });
      if (isDemoMode() || !hasDatabase()) {
        demoStore.addEvent({
          type: "cron_reminder",
          linkId: link.id,
          meta: JSON.stringify({ to: link.clientEmail, kind: "checklist" }),
        });
      }
      continue;
    }

    // Invoice: only if open and past due
    const bundle = await getInvoiceBundle(link.token);
    const inv = bundle?.invoice;
    if (!inv || inv.status === "paid" || inv.status === "void") {
      skipped++;
      continue;
    }
    const dueMs = inv.dueAt ? inv.dueAt.getTime() : 0;
    if (!dueMs || dueMs > now) {
      skipped++;
      continue;
    }

    const email = invoiceOverdueEmail({
      freelancerName: ownerEmail,
      title: link.title,
      url,
      amountCents: inv.amountCents,
      currency: inv.currency,
      dueLabel: formatDate(inv.dueAt),
    });
    const result = await sendEmail({
      to: link.clientEmail,
      subject: email.subject,
      html: email.html,
      text: email.text,
    });
    if (result.ok) sent++;
    else logged++;
    details.push({
      linkId: link.id,
      type: "invoice_overdue",
      to: link.clientEmail,
      status: result.ok ? "sent" : result.demo ? "logged" : "error",
    });
    if (isDemoMode() || !hasDatabase()) {
      demoStore.addEvent({
        type: "cron_reminder",
        linkId: link.id,
        meta: JSON.stringify({ to: link.clientEmail, kind: "invoice_overdue" }),
      });
    }
  }

  // Touch invoices list so cold demos stay warm
  await listAllInvoices();

  return { checked, sent, logged, skipped, details };
}
