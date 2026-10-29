import { NextResponse } from "next/server";
import type { NextMiddleware } from "next/server";
import {
  hasClerkPublishable,
  isDemoModeForced,
} from "@/lib/env-public";

let middleware: NextMiddleware;

/**
 * Edge-safe gating: never import `@/lib/env` (server-only secrets module).
 * - DEMO_MODE forced → passthrough (matches server isDemoMode()).
 * - No publishable key → passthrough (Clerk middleware cannot run).
 *
 * When the publishable key exists, run clerkMiddleware so auth() works in
 * server components — but do NOT auth.protect() here. /app and /admin layouts
 * call requireSession(); passwordless /c and /i stay public. Protecting in
 * middleware also 404s signed-out /app (Clerk protect-rewrite) and blocks the
 * demo dashboard when Clerk keys exist but DATABASE_URL does not (server still
 * in demo mode via isDemoMode()).
 */
if (isDemoModeForced() || !hasClerkPublishable()) {
  middleware = () => NextResponse.next();
} else {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { clerkMiddleware } = require("@clerk/nextjs/server");
  middleware = clerkMiddleware();
}

export default middleware;

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
