const COLORS: Record<string, string> = {
  active: "bg-[color:var(--tb-orange-soft)] text-[color:var(--tb-slate)]",
  completed: "bg-emerald-50 text-emerald-800",
  paid: "bg-emerald-50 text-emerald-800",
  open: "bg-sky-50 text-sky-800",
  draft: "bg-slate-100 text-slate-600",
  overdue: "bg-rose-50 text-rose-800",
  closed: "bg-slate-100 text-slate-600",
  disabled: "bg-rose-50 text-rose-700",
  void: "bg-slate-100 text-slate-500",
  free: "bg-slate-100 text-slate-700",
  solo: "bg-[color:var(--tb-orange-soft)] text-[color:var(--tb-slate)]",
  studio: "bg-[color:var(--tb-slate)] text-white",
};

export function StatusPill({ status }: { status: string }) {
  const cls = COLORS[status] || "bg-slate-100 text-slate-700";
  return (
    <span
      className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium capitalize ${cls}`}
    >
      {status}
    </span>
  );
}
