import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { requireSession } from "@/lib/auth";
import { deleteFeedback, updateFeedback } from "@/lib/data";

export const dynamic = "force-dynamic";

const STATUSES = new Set([
  "new",
  "triaged",
  "planned",
  "done",
  "wontfix",
]);
const PRIORITIES = new Set(["low", "normal", "high"]);

/** Admin-only — patch status and/or priority. */
export async function PATCH(
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

  const body = await req.json().catch(() => ({}));
  const patch: {
    status?: "new" | "triaged" | "planned" | "done" | "wontfix";
    priority?: "low" | "normal" | "high";
  } = {};

  if (body.status != null) {
    const status = String(body.status);
    if (!STATUSES.has(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    patch.status = status as NonNullable<typeof patch.status>;
  }
  if (body.priority != null) {
    const priority = String(body.priority);
    if (!PRIORITIES.has(priority)) {
      return NextResponse.json({ error: "Invalid priority" }, { status: 400 });
    }
    patch.priority = priority as NonNullable<typeof patch.priority>;
  }

  if (!patch.status && !patch.priority) {
    return NextResponse.json(
      { error: "Provide status and/or priority" },
      { status: 400 },
    );
  }

  try {
    const row = await updateFeedback(id, patch);
    if (!row) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true, row });
  } catch (err) {
    console.error("[totebird] updateFeedback failed", err);
    return NextResponse.json(
      { error: "Could not update feedback" },
      { status: 503 },
    );
  }
}

/** Admin-only — delete feedback (noise / after publish). */
export async function DELETE(
  _req: Request,
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

  try {
    const ok = await deleteFeedback(id);
    if (!ok) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[totebird] deleteFeedback failed", err);
    return NextResponse.json(
      { error: "Could not delete feedback" },
      { status: 503 },
    );
  }
}
