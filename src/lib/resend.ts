import { Resend } from "resend";
import { hasResend } from "@/lib/env";

export async function sendEmail(input: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}) {
  if (!hasResend()) {
    console.info("[totebird:email:demo]", {
      to: input.to,
      subject: input.subject,
      text: input.text?.slice(0, 200),
    });
    return {
      ok: false as const,
      demo: true as const,
      message: "Resend is not configured. Email logged to console only.",
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
    text: input.text,
  });

  if (error) {
    return { ok: false as const, demo: false as const, message: error.message };
  }
  return { ok: true as const, demo: false as const, message: null as string | null };
}

/** @deprecated use sendEmail */
export async function sendReminderEmail(input: {
  to: string;
  subject: string;
  html: string;
}) {
  return sendEmail(input);
}
