import { NextResponse } from "next/server";
import { runDueReminders } from "@/lib/reminders";
import { hasResend } from "@/lib/env";

function authorized(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    // Allow in demo/local without secret, but warn
    return { ok: true, mode: "open" as const };
  }
  const header = req.headers.get("authorization") || "";
  const bearer = header.startsWith("Bearer ") ? header.slice(7) : "";
  const query = new URL(req.url).searchParams.get("secret") || "";
  if (bearer === secret || query === secret) {
    return { ok: true, mode: "secret" as const };
  }
  return { ok: false, mode: "secret" as const };
}

export async function GET(req: Request) {
  return run(req);
}

export async function POST(req: Request) {
  return run(req);
}

async function run(req: Request) {
  const auth = authorized(req);
  if (!auth.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await runDueReminders();
  return NextResponse.json({
    ok: true,
    resendConfigured: hasResend(),
    authMode: auth.mode,
    message: hasResend()
      ? "Reminder pass complete"
      : "Reminder pass complete — emails logged only (set RESEND_API_KEY to send)",
    ...result,
  });
}
