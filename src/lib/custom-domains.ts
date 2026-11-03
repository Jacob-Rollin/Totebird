import type { CustomDomain } from "@/db/schema";

/** Future edge host for customer CNAMEs — not live until CF Workers cutover. */
export const CUSTOM_DOMAIN_CNAME_TARGET = "custom.totebird.com";

export const CUSTOM_DOMAIN_TXT_PREFIX = "totebird-verify=";

export function normalizeHostname(raw: string): string | null {
  let host = raw.trim().toLowerCase();
  host = host.replace(/^https?:\/\//, "");
  host = host.split("/")[0] ?? "";
  host = host.split(":")[0] ?? "";
  host = host.replace(/\.$/, "");
  if (!host || host.includes(" ") || host.includes("..")) return null;
  // Reject apex-only bare labels without a dot (need a real hostname)
  if (!host.includes(".")) return null;
  // Block our own product hosts
  if (
    host === "totebird.com" ||
    host.endsWith(".totebird.com") ||
    host === "localhost" ||
    host.endsWith(".local")
  ) {
    return null;
  }
  if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/.test(host)) {
    return null;
  }
  return host;
}

export function txtRecordName(hostname: string) {
  return `_totebird-verify.${hostname}`;
}

export function txtRecordValue(token: string) {
  return `${CUSTOM_DOMAIN_TXT_PREFIX}${token}`;
}

export function dnsInstructions(domain: Pick<CustomDomain, "hostname" | "verificationToken">) {
  return {
    cname: {
      host: domain.hostname,
      target: CUSTOM_DOMAIN_CNAME_TARGET,
      note: "Point your hostname at Totebird. Host mapping goes live after the Cloudflare Workers cutover — guest links stay on totebird.com until then.",
    },
    txt: {
      host: txtRecordName(domain.hostname),
      value: txtRecordValue(domain.verificationToken),
      note: "Proves you control the domain. Use “Check DNS” after the record propagates.",
    },
  };
}

export type DnsCheckResult = {
  txtOk: boolean;
  cnameOk: boolean;
  status: "verified" | "pending" | "failed";
  detail: string;
};
