import { integrationStatus } from "@/lib/env";

export function DemoBanner() {
  const status = integrationStatus();
  if (!status.demoMode) return null;

  const missing = [
    !status.database && "Neon",
    !status.clerk && "Clerk",
    !status.r2 && "R2",
    !status.resend && "Resend",
    !status.stripe && "Stripe",
  ].filter(Boolean);

  return (
    <div className="border-b border-[color:var(--tb-orange)]/30 bg-[color:var(--tb-orange-soft)] px-4 py-2 text-center text-sm text-[color:var(--tb-slate)]">
      Demo mode — in-memory data. Missing keys: {missing.join(", ") || "none"}. See README.
    </div>
  );
}
