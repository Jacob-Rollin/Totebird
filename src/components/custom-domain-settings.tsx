"use client";

import { useState, useTransition } from "react";
import type { CustomDomain } from "@/db/schema";
import {
  CUSTOM_DOMAIN_CNAME_TARGET,
  dnsInstructions,
} from "@/lib/custom-domains";

export function CustomDomainSettings({
  domain,
  saveAction,
  checkAction,
  clearAction,
}: {
  domain: CustomDomain | null;
  saveAction: (formData: FormData) => Promise<{ ok: boolean; error?: string }>;
  checkAction: () => Promise<{ ok: boolean; detail?: string; error?: string }>;
  clearAction: () => Promise<{ ok: boolean; error?: string }>;
}) {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const instructions = domain ? dnsInstructions(domain) : null;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-semibold">Custom domain</h2>
        <p className="mt-1 text-sm text-[color:var(--tb-slate-soft)]">
          Map a client-facing hostname (e.g.{" "}
          <code className="text-xs">portal.yourbrand.com</code>). Studio v1 saves
          DNS instructions and verification status — guest checklist and invoice
          links still open on <strong>totebird.com</strong> until host mapping
          ships with the Cloudflare cutover.
        </p>
      </div>

      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          setMessage(null);
          setError(null);
          startTransition(async () => {
            const res = await saveAction(fd);
            if (!res.ok) setError(res.error || "Could not save domain.");
            else setMessage("Domain saved. Add the DNS records below, then Check DNS.");
          });
        }}
      >
        <div>
          <label className="tb-label" htmlFor="hostname">
            Hostname
          </label>
          <input
            id="hostname"
            name="hostname"
            className="tb-input"
            placeholder="portal.yourbrand.com"
            defaultValue={domain?.hostname ?? ""}
            required
            disabled={pending}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            className="tb-btn tb-btn-primary text-sm"
            disabled={pending}
          >
            {domain ? "Update domain" : "Save domain"}
          </button>
          {domain && (
            <>
              <button
                type="button"
                className="tb-btn tb-btn-secondary text-sm"
                disabled={pending}
                onClick={() => {
                  setMessage(null);
                  setError(null);
                  startTransition(async () => {
                    const res = await checkAction();
                    if (!res.ok) setError(res.error || "DNS check failed.");
                    else setMessage(res.detail || "DNS checked.");
                  });
                }}
              >
                Check DNS
              </button>
              <button
                type="button"
                className="tb-btn tb-btn-ghost text-sm text-rose-700"
                disabled={pending}
                onClick={() => {
                  setMessage(null);
                  setError(null);
                  startTransition(async () => {
                    const res = await clearAction();
                    if (!res.ok) setError(res.error || "Could not remove domain.");
                    else setMessage("Custom domain removed.");
                  });
                }}
              >
                Remove
              </button>
            </>
          )}
        </div>
      </form>

      {domain && (
        <div className="rounded-xl border border-[color:var(--tb-line)] bg-[color:var(--tb-mist)]/50 p-4 text-sm">
          <p className="font-semibold text-[color:var(--tb-ink)]">
            Status:{" "}
            <span className="capitalize text-[color:var(--tb-orange-deep)]">
              {domain.status}
            </span>
          </p>
          {domain.statusDetail && (
            <p className="mt-1 text-[color:var(--tb-slate-soft)]">
              {domain.statusDetail}
            </p>
          )}

          {instructions && (
            <ol className="mt-4 space-y-4">
              <li>
                <p className="font-medium">1. CNAME record</p>
                <p className="mt-1 text-[color:var(--tb-slate-soft)]">
                  {instructions.cname.note}
                </p>
                <dl className="mt-2 grid gap-1 font-mono text-xs sm:grid-cols-[5rem_1fr]">
                  <dt className="text-[color:var(--tb-slate-soft)]">Host</dt>
                  <dd>{instructions.cname.host}</dd>
                  <dt className="text-[color:var(--tb-slate-soft)]">Target</dt>
                  <dd>{instructions.cname.target}</dd>
                </dl>
              </li>
              <li>
                <p className="font-medium">2. TXT verification</p>
                <p className="mt-1 text-[color:var(--tb-slate-soft)]">
                  {instructions.txt.note}
                </p>
                <dl className="mt-2 grid gap-1 font-mono text-xs sm:grid-cols-[5rem_1fr]">
                  <dt className="text-[color:var(--tb-slate-soft)]">Host</dt>
                  <dd className="break-all">{instructions.txt.host}</dd>
                  <dt className="text-[color:var(--tb-slate-soft)]">Value</dt>
                  <dd className="break-all">{instructions.txt.value}</dd>
                </dl>
              </li>
            </ol>
          )}

          <p className="mt-4 text-xs text-[color:var(--tb-slate-soft)]">
            CNAME target <code>{CUSTOM_DOMAIN_CNAME_TARGET}</code> is reserved for
            future host mapping. Until then, share{" "}
            <code>/c/…</code> and <code>/i/…</code> links on the Totebird app host.
          </p>
        </div>
      )}

      {message && (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          {message}
        </p>
      )}
      {error && (
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {error}
        </p>
      )}
    </div>
  );
}
