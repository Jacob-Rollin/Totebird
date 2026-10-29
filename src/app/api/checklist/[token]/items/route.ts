import { NextResponse } from "next/server";
import { getLinkByToken, toggleChecklistItem } from "@/lib/data";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const link = await getLinkByToken(token);
  if (!link || link.type !== "checklist") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (link.status === "closed" || link.status === "disabled") {
    return NextResponse.json({ error: "Link closed" }, { status: 403 });
  }

  const body = await req.json();
  const itemId = String(body.itemId || "");
  const done = Boolean(body.done);
  if (!itemId) {
    return NextResponse.json({ error: "itemId required" }, { status: 400 });
  }

  const item = await toggleChecklistItem(itemId, done, link.id);
  if (!item) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true, item });
}
