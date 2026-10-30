import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { requireSession } from "@/lib/auth";
import {
  createFeedback,
  FeedbackTableMissingError,
  listFeedback,
} from "@/lib/data";
import { newFeedbackEmail } from "@/lib/email-templates";
import { adminEmails, appUrl } from "@/lib/env";
import { sendEmail } from "@/lib/resend";

export const dynamic = "force-dynamic";

const FEEDBACK_TYPES = new Set(["bug", "suggestion"]);
const FEEDBACK_STATUSES = new Set([
  "new",
  "triaged",
  "planned",
  "done",
  "wontfix",
]);

/** Authenticated freelancer — create feedback. */
export async function POST(req: Request) {
  const session = await requireSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const type = String(body.type || "");
  const message = String(body.body || body.message || "").trim();
  const pageUrl =
    typeof body.pageUrl === "string"
      ? body.pageUrl.trim().slice(0, 2000)
      : null;

  if (!FEEDBACK_TYPES.has(type)) {
    return NextResponse.json(
      { error: "type must be bug or suggestion" },
      { status: 400 },
    );
  }
  if (!message || message.length < 3) {
    return NextResponse.json(
      { error: "Message is required (at least 3 characters)" },
      { status: 400 },
    );
  }
  if (message.length > 8000) {
    return NextResponse.json(
      { error: "Message is too long" },
      { status: 400 },
    );
  }

  try {
    const row = await createFeedback({
      userId: session.id,
      type: type as "bug" | "suggestion",
      body: message,
      pageUrl,
    });

    const notifyTo = adminEmails()[0];
    if (notifyTo) {
      const email = newFeedbackEmail({
        type: row.type,
        body: row.body,
        pageUrl: row.pageUrl,
        fromEmail: session.email,
        adminUrl: `${appUrl()}/admin/feedback`,
      });
      // Soft no-op when Resend is missing — sendEmail already logs/demo-returns.
      await sendEmail({
        to: notifyTo,
        subject: email.subject,
        html: email.html,
        text: email.text,
      }).catch((err) => {
        console.error("[totebird] feedback notify failed", err);
      });
    }

    return NextResponse.json({ ok: true, id: row.id });
  } catch (err) {
    if (err instanceof FeedbackTableMissingError) {
      return NextResponse.json(
        {
          error:
            "Feedback isn’t set up on the database yet. Ask the founder to run neon-feedback-table.sql in Neon.",
        },
        { status: 503 },
      );
    }
    console.error("[totebird] createFeedback failed", err);
    return NextResponse.json(
      { error: "Could not save feedback. Try again shortly." },
      { status: 503 },
    );
  }
}

/** Admin-only — list feedback (newest first), optional type/status filters. */
export async function GET(req: Request) {
  const session = await requireSession();
  if (!requireAdmin(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(req.url);
  const typeRaw = url.searchParams.get("type") || undefined;
  const statusRaw = url.searchParams.get("status") || undefined;
  const type =
    typeRaw && FEEDBACK_TYPES.has(typeRaw)
      ? (typeRaw as "bug" | "suggestion")
      : undefined;
  const status =
    statusRaw && FEEDBACK_STATUSES.has(statusRaw)
      ? (statusRaw as "new" | "triaged" | "planned" | "done" | "wontfix")
      : undefined;

  try {
    const rows = await listFeedback({ type, status });
    return NextResponse.json({ rows });
  } catch (err) {
    console.error("[totebird] listFeedback failed", err);
    return NextResponse.json({ rows: [] });
  }
}
