import "server-only";

/**
 * Safe metadataBase for root layout — never throw on bad NEXT_PUBLIC_APP_URL.
 */
export function safeMetadataBase(): URL {
  const raw = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (raw) {
    try {
      return new URL(raw);
    } catch {
      // fall through
    }
  }
  return new URL("http://localhost:3000");
}
