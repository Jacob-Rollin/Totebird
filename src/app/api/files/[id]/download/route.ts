import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import {
  createPresignedDownload,
  publicFileUrl,
} from "@/lib/b2";
import { getFileById, getLinkById } from "@/lib/data";

/**
 * Authenticated download for the link owner.
 * Prefers CDN (NEXT_PUBLIC_FILES_BASE_URL + storage key); otherwise
 * redirects to a short-lived B2 signed GET. Freelancers never need the
 * Backblaze console.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const file = await getFileById(id);
  if (!file) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const link = await getLinkById(file.linkId);
  if (!link || link.userId !== session.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const cdn = publicFileUrl(file.storageKey);
  if (cdn) {
    return NextResponse.redirect(cdn, 302);
  }

  const signed = await createPresignedDownload({
    storageKey: file.storageKey,
    filename: file.filename,
  });
  if (!signed.ok) {
    return NextResponse.json({ error: signed.error }, { status: 503 });
  }

  return NextResponse.redirect(signed.url, 302);
}
