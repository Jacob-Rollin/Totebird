import { NextResponse } from "next/server";
import type { NextMiddleware } from "next/server";

const hasClerk = Boolean(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY,
);
const forceDemo = process.env.DEMO_MODE === "true";

let middleware: NextMiddleware;

if (!hasClerk || forceDemo) {
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
