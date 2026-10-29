export function formatMoney(cents: number, currency = "usd") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}

export function formatDate(d: Date | string | null | undefined) {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function clientLinkUrl(type: "checklist" | "invoice", token: string) {
  const base =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const path = type === "checklist" ? `/c/${token}` : `/i/${token}`;
  return `${base.replace(/\/$/, "")}${path}`;
}

export function statusLabel(status: string) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}
