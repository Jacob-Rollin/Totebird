import { NextResponse } from "next/server";
import { getLinkByToken, updateChecklistItem } from "@/lib/data";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const link = await getLinkByToken(token);
  if (!link || link.type !== "checklist") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (
    link.status === "closed" ||
    link.status === "disabled" ||
    link.status === "archived"
  ) {
    return NextResponse.json({ error: "Link closed" }, { status: 403 });
  }

  const body = await req.json();
  const itemId = String(body.itemId || "");
  if (!itemId) {
    return NextResponse.json({ error: "itemId required" }, { status: 400 });
  }

  const patch: { done?: boolean; answerText?: string | null } = {};
  if (typeof body.done === "boolean") patch.done = body.done;
  if (typeof body.answerText === "string") patch.answerText = body.answerText;

  const item = await updateChecklistItem(itemId, link.id, patch);
  if (!item) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true, item });
}
