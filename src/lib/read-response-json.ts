/**
 * Safely read a fetch Response as JSON without throwing on empty / HTML / non-JSON bodies.
 * Use on the client so failed Netlify functions never surface raw JSON.parse errors.
 */
export async function readResponseJson<T extends Record<string, unknown> = Record<string, unknown>>(
  res: Response,
): Promise<{ data: T; raw: string }> {
  const raw = await res.text();
  if (!raw.trim()) {
    return { data: {} as T, raw };
  }
  try {
    return { data: JSON.parse(raw) as T, raw };
  } catch {
    return { data: {} as T, raw };
  }
}

/** Human-readable upload failure from a presign / register response. */
export function uploadStartErrorMessage(
  res: Response,
  data: { error?: unknown },
): string {
  const fromApi =
    typeof data.error === "string" && data.error.trim() ? data.error.trim() : null;
  if (fromApi) return fromApi;

  if (res.status === 502 || res.status === 503 || res.status === 504) {
    return "Upload isn’t available right now. Try again in a moment.";
  }
  if (res.status >= 500) {
    return "Couldn’t start upload — storage may not be configured.";
  }
  if (res.status === 404) {
    return "Couldn’t start upload — upload endpoint not found.";
  }
  if (!res.ok) {
    return "Couldn’t start upload.";
  }
  return "Couldn’t start upload.";
}
