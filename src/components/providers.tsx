"use client";

import { ClerkProvider } from "@clerk/nextjs";
import type { ReactNode } from "react";
import { SoftBoundary } from "@/components/soft-boundary";

export function Providers({
  children,
  clerkEnabled,
}: {
  children: ReactNode;
  clerkEnabled: boolean;
}) {
  if (!clerkEnabled) return <>{children}</>;
  return (
    <SoftBoundary fallback={<>{children}</>}>
      <ClerkProvider>{children}</ClerkProvider>
    </SoftBoundary>
  );
}
