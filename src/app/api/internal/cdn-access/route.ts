import { NextResponse } from "next/server";
import { getLinkById } from "@/lib/data";
import { linkAllowsCdnDownload } from "@/lib/link-access";

export const dynamic = "force-dynamic";

/**
 * Files CDN Worker → app: is this link still allowed to serve objects?
 * Auth: shared secret (FILES_CDN_CHECK_SECRET). Not for browsers.
 *
 * GET ?linkId=lnk_…
 * Authorization: Bearer <FILES_CDN_CHECK_SECRET>
 *   or X-Totebird-CDN-Secret: <secret>
 */
export async function GET(req: Request) {
  const secret = process.env.FILES_CDN_CHECK_SECRET?.trim();
  if (!secret) {
    return NextResponse.json(
      { error: "CDN access check is not configured" },
      { status: 503 },
    );
  }

  const auth = req.headers.get("authorization");
  const headerSecret = req.headers.get("x-totebird-cdn-secret");
  const bearer =
    auth && /^Bearer\s+/i.test(auth) ? auth.replace(/^Bearer\s+/i, "").trim() : "";
  const provided = bearer || headerSecret?.trim() || "";
  if (!provided || provided !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const linkId = new URL(req.url).searchParams.get("linkId")?.trim() || "";
  if (!linkId || linkId.length > 80) {
    return NextResponse.json({ error: "Missing linkId" }, { status: 400 });
  }

  const link = await getLinkById(linkId);
  if (!link) {
    return NextResponse.json({ allow: false, reason: "not_found" as const });
  }

  const allow = linkAllowsCdnDownload(link.status);
  return NextResponse.json({
    allow,
    status: link.status,
    reason: allow ? ("ok" as const) : ("inactive" as const),
  });
}
