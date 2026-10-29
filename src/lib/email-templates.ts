import { formatMoney } from "@/lib/format";

export function checklistReminderEmail(input: {
  freelancerName: string;
  title: string;
  url: string;
  progressPercent: number;
}) {
  const subject = `Reminder: ${input.title}`;
  const text = `${input.freelancerName} is waiting on “${input.title}”.
Progress: ${input.progressPercent}%
Open: ${input.url}`;
  const html = `
  <div style="font-family:Source Sans 3,Helvetica,Arial,sans-serif;color:#2a3542;max-width:520px">
    <p style="margin:0 0 12px">Hi — a quick nudge from <strong>${escapeHtml(input.freelancerName)}</strong>.</p>
    <p style="margin:0 0 12px">Please finish <strong>${escapeHtml(input.title)}</strong> (${input.progressPercent}% done).</p>
    <p style="margin:24px 0"><a href="${escapeAttr(input.url)}" style="background:#EE901F;color:#394554;padding:12px 18px;border-radius:8px;text-decoration:none;font-weight:700">Open checklist</a></p>
    <p style="font-size:12px;color:#4b5a6a">No account needed · Powered by Totebird</p>
  </div>`;
  return { subject, text, html };
}

export function invoiceOverdueEmail(input: {
  freelancerName: string;
  title: string;
  url: string;
  amountCents: number;
  currency: string;
  dueLabel: string;
}) {
  const amount = formatMoney(input.amountCents, input.currency);
  const subject = `Overdue invoice: ${amount} — ${input.title}`;
  const text = `Invoice “${input.title}” for ${amount} was due ${input.dueLabel}.
Pay: ${input.url}
From ${input.freelancerName}`;
  const html = `
  <div style="font-family:Source Sans 3,Helvetica,Arial,sans-serif;color:#2a3542;max-width:520px">
    <p style="margin:0 0 12px">Friendly reminder from <strong>${escapeHtml(input.freelancerName)}</strong>.</p>
    <p style="margin:0 0 12px">Invoice <strong>${escapeHtml(input.title)}</strong> for <strong>${amount}</strong> was due ${escapeHtml(input.dueLabel)}.</p>
    <p style="margin:24px 0"><a href="${escapeAttr(input.url)}" style="background:#EE901F;color:#394554;padding:12px 18px;border-radius:8px;text-decoration:none;font-weight:700">Pay invoice</a></p>
    <p style="font-size:12px;color:#4b5a6a">Payments via Stripe · Powered by Totebird</p>
  </div>`;
  return { subject, text, html };
}

export function invoicePaidEmail(input: {
  freelancerName: string;
  title: string;
  amountCents: number;
  currency: string;
  url: string;
}) {
  const amount = formatMoney(input.amountCents, input.currency);
  const subject = `Payment received: ${amount} — ${input.title}`;
  const text = `Thanks — ${amount} for “${input.title}” is marked paid.
Receipt: ${input.url}
${input.freelancerName}`;
  const html = `
  <div style="font-family:Source Sans 3,Helvetica,Arial,sans-serif;color:#2a3542;max-width:520px">
    <p style="margin:0 0 12px">Payment received. Thank you.</p>
    <p style="margin:0 0 12px"><strong>${escapeHtml(input.title)}</strong> · ${amount}</p>
    <p style="margin:24px 0"><a href="${escapeAttr(input.url)}" style="color:#EE901F;font-weight:600">View invoice</a></p>
    <p style="font-size:12px;color:#4b5a6a">${escapeHtml(input.freelancerName)} · Totebird</p>
  </div>`;
  return { subject, text, html };
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeAttr(s: string) {
  return escapeHtml(s).replace(/'/g, "&#39;");
}
