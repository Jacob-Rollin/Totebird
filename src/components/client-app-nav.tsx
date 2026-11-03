"use client";

import { useUser } from "@clerk/nextjs";
import { AppNav } from "@/components/app-nav";
import { SoftBoundary } from "@/components/soft-boundary";

/**
 * AppNav powered by Clerk client session (no server auth()).
 * Used on public/marketing pages so signed-in chrome matches /app.
 */
export function ClientAppNav() {
  return (
    <SoftBoundary fallback={<AppNavShell email="" />}>
      <ClerkClientAppNav />
    </SoftBoundary>
  );
}

function ClerkClientAppNav() {
  const { user, isLoaded } = useUser();
  const email =
    user?.primaryEmailAddress?.emailAddress ||
    user?.emailAddresses?.[0]?.emailAddress ||
    "";

  if (!isLoaded) {
    return <AppNavShell email="" />;
  }

  return <AppNav user={{ email, isAdmin: false }} section="app" />;
}

/** Stable header chrome while Clerk hydrates (avoids layout jump). */
function AppNavShell({ email }: { email: string }) {
  return <AppNav user={{ email, isAdmin: false }} section="app" />;
}
