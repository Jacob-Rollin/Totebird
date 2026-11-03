"use client";

import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import type { ComponentProps, ReactNode } from "react";
import { SoftBoundary } from "@/components/soft-boundary";

type SessionLinkProps = Omit<ComponentProps<typeof Link>, "href"> & {
  /** Href when signed out / Clerk unavailable. */
  whenGuest: string;
  /** Href when Clerk reports an active session. */
  whenSignedIn: string;
  /** False → always use whenGuest (no useAuth; safe outside ClerkProvider). */
  clerkEnabled: boolean;
  /**
   * Label when signed in. Guests keep `children`.
   * Fixes “Sign in” still reading logged-out while href already goes to /app.
   */
  signedInLabel?: ReactNode;
};

/**
 * Marketing CTAs that prefer guest hrefs on the server and only swap after
 * Clerk hydrates. Never calls server auth() — domain cutover / allowlist
 * misconfig must not 500 the landing page.
 */
export function SessionLink({
  whenGuest,
  whenSignedIn,
  clerkEnabled,
  signedInLabel,
  children,
  ...props
}: SessionLinkProps) {
  if (!clerkEnabled) {
    return (
      <Link href={whenGuest} {...props}>
        {children}
      </Link>
    );
  }
  return (
    <SoftBoundary
      fallback={
        <Link href={whenGuest} {...props}>
          {children}
        </Link>
      }
    >
      <ClerkSessionLink
        whenGuest={whenGuest}
        whenSignedIn={whenSignedIn}
        signedInLabel={signedInLabel}
        {...props}
      >
        {children}
      </ClerkSessionLink>
    </SoftBoundary>
  );
}

function ClerkSessionLink({
  whenGuest,
  whenSignedIn,
  signedInLabel,
  children,
  ...props
}: Omit<SessionLinkProps, "clerkEnabled">) {
  const { isSignedIn } = useAuth();
  const label =
    isSignedIn && signedInLabel != null ? signedInLabel : children;
  return (
    <Link href={isSignedIn ? whenSignedIn : whenGuest} {...props}>
      {label}
    </Link>
  );
}
