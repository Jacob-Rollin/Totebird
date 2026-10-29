import { NextResponse } from "next/server";
import { addFileRecord, getLinkByToken } from "@/lib/data";
import { createPresignedUpload } from "@/lib/r2";

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
  const filename = String(body.filename || "").slice(0, 200);
  const contentType = String(body.contentType || "application/octet-stream");
  const sizeBytes = Number(body.sizeBytes || 0);
  if (!filename || !Number.isFinite(sizeBytes) || sizeBytes <= 0) {
    return NextResponse.json({ error: "Invalid file" }, { status: 400 });
  }

  const presign = await createPresignedUpload({
    filename,
    contentType,
    sizeBytes,
    linkId: link.id,
  });
  if (!presign.ok) {
    return NextResponse.json({ error: presign.error }, { status: 400 });
  }

  const file = await addFileRecord({
    linkId: link.id,
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
