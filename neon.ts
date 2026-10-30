import { defineConfig } from "@neon/config/v1";

/**
 * Totebird Neon config — Postgres only.
 * Do NOT enable Managed Better Auth or Object Storage here:
 * the app uses Clerk + Backblaze B2.
 *
 * After `neon login`:
 *   neon env pull
 *   neon config plan
 *   neon deploy
 * Then: npm run db:push && npm run prove:db
 */
export default defineConfig({
  // Explicitly off — freelancers auth via Clerk; files via B2
  auth: false,

  // Branch policy: per-branch tuning
  branch: (branch) => {
    if (branch.isDefault) {
      // production / default: no overrides
      return {};
    }
    if (!branch.exists) {
      // New non-default branches: auto-expire
      return { ttl: "7d" };
    }
    return {};
  },
});
