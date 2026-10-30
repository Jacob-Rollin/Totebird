import { NextResponse } from "next/server";
import {
  addFileRecord,
  getLinkByToken,
  getUserById,
  storageUsedByUser,
} from "@/lib/data";
import { createPresignedUpload } from "@/lib/b2";
import { canAcceptUpload, type Plan } from "@/lib/plans";

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
  const filename = String(body.filename || "").slice(0, 200);
  const contentType = String(body.contentType || "application/octet-stream");
  const sizeBytes = Number(body.sizeBytes || 0);
  const checklistItemId = body.checklistItemId
    ? String(body.checklistItemId)
    : null;
  if (!filename || !Number.isFinite(sizeBytes) || sizeBytes <= 0) {
    return NextResponse.json({ error: "Invalid file" }, { status: 400 });
  }

  const owner = await getUserById(link.userId);
  const plan = (owner?.plan ?? "free") as Plan;
  const usedBytes = await storageUsedByUser(link.userId);
  if (!canAcceptUpload(plan, usedBytes, sizeBytes)) {
    return NextResponse.json(
      {
        error:
          "Storage limit reached for this plan. Upgrade or remove files to free space.",
      },
      { status: 403 },
    );
  }

  const presign = await createPresignedUpload({
    filename,
    contentType,
    sizeBytes,
    userId: link.userId,
    linkId: link.id,
  });
  if (!presign.ok) {
    return NextResponse.json({ error: presign.error }, { status: 400 });
  }

  const file = await addFileRecord({
    linkId: link.id,
    checklistItemId,
    filename,
    contentType,
    sizeBytes,
    storageKey: presign.key,
  });

  return NextResponse.json({
    ok: true,
    fileId: file.id,
    uploadUrl: presign.uploadUrl,
    publicUrl: presign.publicUrl,
    message: presign.message,
    demo: "demo" in presign ? presign.demo : false,
  });
}
