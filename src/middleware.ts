import { NextResponse } from "next/server";
import type { NextMiddleware } from "next/server";
import { hasClerk, isDemoMode } from "@/lib/env";

let middleware: NextMiddleware;

// Must match layout.tsx: skip Clerk when demo (missing DB and/or Clerk, or DEMO_MODE).
if (isDemoMode() || !hasClerk()) {
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
