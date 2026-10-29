import { NextResponse } from "next/server";
import { ensureUser } from "@/lib/data";

/** Optional Clerk user.created / user.updated sync. */
export async function POST(req: Request) {
  const secret = process.env.CLERK_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json(
      { ok: false, message: "CLERK_WEBHOOK_SECRET not set — skipping verify" },
      { status: 200 },
    );
  }

  // Without svix dependency: accept JSON in demo/dev; production should verify.
  try {
    const body = await req.json();
    const type = body.type as string;
    const data = body.data;
    if (
      (type === "user.created" || type === "user.updated") &&
      data?.id &&
      data?.email_addresses?.[0]?.email_address
    ) {
      await ensureUser({
        clerkId: data.id,
        email: data.email_addresses[0].email_address,
        name:
          [data.first_name, data.last_name].filter(Boolean).join(" ") || null,
      });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Bad payload" },
      { status: 400 },
    );
  }
}
