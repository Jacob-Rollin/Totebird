import type { Link } from "@/db/schema";

/**
 * Statuses that still allow guest capability CDN downloads.
 * Closed / archived / disabled revoke CDN; owner uses signed app download.
 */
export function linkAllowsCdnDownload(
  status: Link["status"] | string | null | undefined,
) {
  return status === "active" || status === "completed";
}

/** Guest write APIs (upload / item patch) — same non-active gate as today. */
export function linkIsGuestWritable(
  status: Link["status"] | string | null | undefined,
) {
  return (
    status !== "closed" &&
    status !== "disabled" &&
    status !== "archived"
  );
}
