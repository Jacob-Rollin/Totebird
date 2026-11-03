import { promises as dns } from "node:dns";
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

/**
 * Soft DNS check — no Cloudflare for SaaS required.
 * Verified = TXT present; CNAME is informational until host mapping ships.
 */
export async function checkCustomDomainDns(domain: {
  hostname: string;
  verificationToken: string;
}): Promise<DnsCheckResult> {
  const expectedTxt = txtRecordValue(domain.verificationToken);
  const txtName = txtRecordName(domain.hostname);

  let txtOk = false;
  let cnameOk = false;
  const notes: string[] = [];

  try {
    const records = await dns.resolveTxt(txtName);
    const flat = records.map((parts) => parts.join(""));
    txtOk = flat.some((v) => v.trim() === expectedTxt);
    if (!txtOk) {
      notes.push(`TXT at ${txtName} did not match yet.`);
    }
  } catch {
    notes.push(`TXT at ${txtName} not found yet.`);
  }

  try {
    const cnames = await dns.resolveCname(domain.hostname);
    cnameOk = cnames.some(
      (c) =>
        c.replace(/\.$/, "").toLowerCase() === CUSTOM_DOMAIN_CNAME_TARGET,
    );
    if (!cnameOk) {
      notes.push(
        `CNAME does not yet point to ${CUSTOM_DOMAIN_CNAME_TARGET} (optional until host mapping).`,
      );
    }
  } catch {
    notes.push(
      `CNAME for ${domain.hostname} not found yet (optional until host mapping).`,
    );
  }

  if (txtOk) {
    return {
      txtOk,
      cnameOk,
      status: "verified",
      detail: cnameOk
        ? "Ownership verified and CNAME looks correct. Guest portals still open on totebird.com until host mapping ships."
        : "Ownership verified via TXT. Add the CNAME when you are ready; portals still use totebird.com tokens for now.",
    };
  }

  return {
    txtOk,
    cnameOk,
    status: "pending",
    detail: notes.join(" ") || "DNS not ready yet — add the TXT record, wait for propagation, then Check DNS again.",
  };
}
