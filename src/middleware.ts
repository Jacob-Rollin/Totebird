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
 * Full DB/secret demo detection stays on the server; layout enables ClerkProvider
 * via hasClerkPublishable() so /sign-in works before DATABASE_URL exists.
 */
if (isDemoModeForced() || !hasClerkPublishable()) {
  middleware = () => NextResponse.next();
} else {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { clerkMiddleware, createRouteMatcher } = require("@clerk/nextjs/server");
  const isProtected = createRouteMatcher(["/app(.*)", "/admin(.*)"]);
  middleware = clerkMiddleware(async (auth: { protect: () => Promise<void> }, req: unknown) => {
    if (isProtected(req)) {
      await auth.protect();
    }
  });
}

export default middleware;

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
