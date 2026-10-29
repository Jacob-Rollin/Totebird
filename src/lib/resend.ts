import { Resend } from "resend";
import { hasResend } from "@/lib/env";

export async function sendReminderEmail(input: {
  to: string;
  subject: string;
  html: string;
}) {
  if (!hasResend()) {
    return {
      ok: false as const,
      demo: true as const,
      message: "Resend is not configured. Reminder logged only.",
    };
  }

  const resend = new Resend(process.env.RESEND_API_KEY!);
  const from =
    process.env.RESEND_FROM_EMAIL || "Totebird <onboarding@resend.dev>";
  const { error } = await resend.emails.send({
    from,
    to: input.to,
    subject: input.subject,
    html: input.html,
  });

  if (error) {
    return { ok: false as const, demo: false as const, message: error.message };
  }
  return { ok: true as const, demo: false as const, message: null as string | null };
}
