import { LandingPage } from "@/components/landing";
import { hasClerkPublishable } from "@/lib/env-public";

/** Session-aware CTAs — must not bake guest hrefs into a static shell. */
export const dynamic = "force-dynamic";

/**
 * Active Clerk session only — never treat demo-mode fallback as "signed in".
 * Guests always get hard /sign-in and /sign-up links.
 */
async function hasActiveClerkSession(): Promise<boolean> {
  if (!hasClerkPublishable()) return false;
  try {
    const { auth } = await import("@clerk/nextjs/server");
    const { userId } = await auth();
    return Boolean(userId);
  } catch {
    return false;
  }
}

export default async function Home() {
  const signedIn = await hasActiveClerkSession();

  return (
    <LandingPage
      signInHref={signedIn ? "/app" : "/sign-in"}
      startFreeHref={signedIn ? "/app" : "/sign-up"}
      startSoloHref={signedIn ? "/app/billing" : "/sign-up"}
      startStudioHref={signedIn ? "/app/billing" : "/sign-up"}
    />
  );
}
