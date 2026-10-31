import { NextResponse } from "next/server";
import {
  addFileRecord,
  getLinkByToken,
  getUserById,
  storageUsedByUser,
} from "@/lib/data";
import { createPresignedUpload } from "@/lib/b2";
import { canAcceptUpload, type Plan } from "@/lib/plans";

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
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

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 },
      );
    }

    const filename = String(
      (body as { filename?: unknown }).filename || "",
    ).slice(0, 200);
    const contentType = String(
      (body as { contentType?: unknown }).contentType ||
        "application/octet-stream",
    );
    const sizeBytes = Number((body as { sizeBytes?: unknown }).sizeBytes || 0);
    const rawItemId = (body as { checklistItemId?: unknown }).checklistItemId;
    const checklistItemId = rawItemId ? String(rawItemId) : null;

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
      return NextResponse.json(
        { error: presign.error || "Upload isn’t configured" },
        { status: 503 },
      );
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
  } catch (err) {
    console.error(
      "[totebird] checklist upload failed",
      err instanceof Error ? err.message : err,
    );
    return NextResponse.json(
      {
        error:
          "Couldn’t start upload — storage may not be configured. Try again shortly.",
      },
      { status: 503 },
    );
  }
}
