/**
 * Netlify Scheduled Function — daily reminder pass.
 * Calls the Next.js route /api/cron/reminders with CRON_SECRET.
 *
 * Enable: deploys automatically with this file + schedule below.
 * Set CRON_SECRET and RESEND_API_KEY in Netlify env for real sends.
 */
import type { Config, Handler } from "@netlify/functions";

export const config: Config = {
  // 14:00 UTC daily
  schedule: "0 14 * * *",
};

export const handler: Handler = async () => {
  const base = (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.URL ||
    process.env.DEPLOY_PRIME_URL ||
    ""
  ).replace(/\/$/, "");

  if (!base) {
    console.warn("[scheduled-reminders] No NEXT_PUBLIC_APP_URL / URL — skip");
    return {
      statusCode: 200,
      body: JSON.stringify({ ok: false, message: "No base URL" }),
    };
  }

  const secret = process.env.CRON_SECRET;
  const url = `${base}/api/cron/reminders`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (secret) headers.Authorization = `Bearer ${secret}`;

  try {
    const res = await fetch(url, { method: "POST", headers });
    const text = await res.text();
    console.info("[scheduled-reminders]", res.status, text.slice(0, 500));
    return {
      statusCode: res.ok ? 200 : 502,
      body: text,
    };
  } catch (err) {
    console.error("[scheduled-reminders]", err);
    return {
      statusCode: 500,
      body: JSON.stringify({
        ok: false,
        error: err instanceof Error ? err.message : "fetch failed",
      }),
    };
  }
};
