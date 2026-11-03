"use client";

import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { ClientAppNav } from "@/components/client-app-nav";
import { TotebirdLogo } from "@/components/logo";
import { SoftBoundary } from "@/components/soft-boundary";

type GuestVariant = "changelog" | "legal" | "demo";

/**
 * Public/marketing header: AppNav (hamburger) when signed in;
 * guest links when signed out. Client-only — never calls auth().
 */
export function PublicSiteHeader({
  clerkEnabled,
  guest = "changelog",
}: {
  clerkEnabled: boolean;
  guest?: GuestVariant;
}) {
  if (!clerkEnabled) {
    return <GuestHeader variant={guest} />;
  }

  return (
    <SoftBoundary fallback={<GuestHeader variant={guest} />}>
      <AuthAwarePublicHeader guest={guest} />
    </SoftBoundary>
  );
}

function AuthAwarePublicHeader({ guest }: { guest: GuestVariant }) {
  const { isSignedIn, isLoaded } = useAuth();

  if (isLoaded && isSignedIn) {
    return <ClientAppNav />;
  }

  return <GuestHeader variant={guest} />;
}

function GuestHeader({ variant }: { variant: GuestVariant }) {
  return (
    <header className="border-b border-[color:var(--tb-line)] bg-white">
      <div className="tb-shell flex flex-wrap items-center justify-between gap-3 py-3">
        <TotebirdLogo size="sm" variant="header" href="/" />
        <nav className="flex items-center gap-4 text-sm font-medium text-[color:var(--tb-slate-soft)]">
          {variant === "changelog" && (
            <>
              <Link href="/" className="hover:text-[color:var(--tb-ink)]">
                Home
              </Link>
              <Link
                href="/sign-in"
                className="hover:text-[color:var(--tb-ink)]"
              >
                Sign in
              </Link>
            </>
          )}
          {variant === "legal" && (
            <Link href="/" className="hover:text-[color:var(--tb-ink)]">
              Home
            </Link>
          )}
          {variant === "demo" && (
            <Link href="/" className="hover:text-[color:var(--tb-ink)]">
              Back home
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
