import { integrationStatus } from "@/lib/env";

export function DemoBanner() {
  const status = integrationStatus();
  if (!status.demoMode) return null;

  const missing = [
    !status.database && "Neon",
    !status.clerk && "Clerk",
  ].filter(Boolean);
  const reason =
    missing.length > 0
      ? `Need ${missing.join(" + ")} for live mode.`
      : "DEMO_MODE is forced on.";

  return (
    <div className="border-b border-[color:var(--tb-orange)]/30 bg-[color:var(--tb-orange-soft)] px-4 py-2 text-center text-sm text-[color:var(--tb-slate)]">
      Demo mode — in-memory data. {reason} See README / <code>npm run prove:env</code>.
    </div>
  );
}
