import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { requireSession } from "@/lib/auth";
import {
  ChangelogTableMissingError,
  defaultChangelogKindFromFeedback,
  defaultChangelogTitleFromBody,
  getFeedbackById,
  publishFeedbackToChangelog,
} from "@/lib/data";

export const dynamic = "force-dynamic";

const KINDS = new Set(["feature", "fix", "improvement"]);

/**
 * Admin-only — publish a done feedback item to the public changelog,
 * then remove it from triage ("Publish & remove").
 */
export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const session = await requireSession();
  if (!requireAdmin(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await ctx.params;
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const existing = await getFeedbackById(id);
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (existing.status !== "done") {
    return NextResponse.json(
      { error: "Only done feedback can be published" },
      { status: 400 },
    );
  }

  const body = await req.json().catch(() => ({}));
  const titleRaw =
    typeof body.title === "string" ? body.title.trim() : "";
  const title =
    titleRaw || defaultChangelogTitleFromBody(existing.body);
  if (title.length < 3) {
    return NextResponse.json(
      { error: "Title needs at least 3 characters" },
      { status: 400 },
    );
  }
  if (title.length > 200) {
    return NextResponse.json({ error: "Title is too long" }, { status: 400 });
  }

  const kindRaw =
    typeof body.kind === "string" ? body.kind : defaultChangelogKindFromFeedback(existing.type);
  if (!KINDS.has(kindRaw)) {
    return NextResponse.json({ error: "Invalid kind" }, { status: 400 });
  }
  const kind = kindRaw as "feature" | "fix" | "improvement";

  const entryBody =
    typeof body.body === "string"
      ? body.body.trim() || null
      : existing.body;

  try {
    const result = await publishFeedbackToChangelog(id, {
      title,
      body: entryBody,
      kind,
    });
    return NextResponse.json({
      ok: true,
      entry: result.entry,
      deleted: result.deleted,
    });
  } catch (err) {
    if (err instanceof ChangelogTableMissingError) {
      return NextResponse.json(
        {
          error:
            "Changelog isn’t set up yet. Run neon-changelog-table.sql in Neon SQL Editor.",
        },
        { status: 503 },
      );
    }
    const msg = err instanceof Error ? err.message : "";
    if (msg === "FEEDBACK_NOT_FOUND") {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (msg === "FEEDBACK_NOT_DONE") {
      return NextResponse.json(
        { error: "Only done feedback can be published" },
        { status: 400 },
      );
    }
    console.error("[totebird] publishFeedbackToChangelog failed", err);
    return NextResponse.json(
      { error: "Could not publish feedback" },
      { status: 503 },
    );
  }
}
