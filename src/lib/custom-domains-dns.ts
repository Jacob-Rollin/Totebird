import "server-only";
import { promises as dns } from "node:dns";
import {
  CUSTOM_DOMAIN_CNAME_TARGET,
  txtRecordName,
  txtRecordValue,
  type DnsCheckResult,
} from "@/lib/custom-domains";

/**
 * Soft DNS check — Node only. Do not import from client components.
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
    detail:
      notes.join(" ") ||
      "DNS not ready yet — add the TXT record, wait for propagation, then Check DNS again.",
  };
}
