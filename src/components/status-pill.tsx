const COLORS: Record<string, string> = {
  active: "bg-[color:var(--tb-orange-soft)] text-[color:var(--tb-slate)]",
  completed: "bg-emerald-50 text-emerald-800",
  paid: "bg-emerald-50 text-emerald-800",
  open: "bg-sky-50 text-sky-800",
  draft: "bg-slate-100 text-slate-600",
  overdue: "bg-rose-50 text-rose-800",
  closed: "bg-slate-100 text-slate-600",
  archived: "bg-slate-100 text-slate-500",
  disabled: "bg-rose-50 text-rose-700",
  void: "bg-slate-100 text-slate-500",
  free: "bg-slate-100 text-slate-700",
  solo: "bg-[color:var(--tb-orange-soft)] text-[color:var(--tb-slate)]",
  studio: "bg-[color:var(--tb-slate)] text-white",
  bug: "bg-rose-50 text-rose-800",
  suggestion: "bg-sky-50 text-sky-800",
  new: "bg-[color:var(--tb-orange-soft)] text-[color:var(--tb-slate)]",
  triaged: "bg-sky-50 text-sky-800",
  planned: "bg-amber-50 text-amber-900",
  done: "bg-emerald-50 text-emerald-800",
  wontfix: "bg-slate-100 text-slate-500",
  low: "bg-slate-100 text-slate-600",
  normal: "bg-slate-100 text-slate-700",
  high: "bg-[color:var(--tb-orange-soft)] text-[color:var(--tb-slate)]",
  feature: "bg-[color:var(--tb-orange-soft)] text-[color:var(--tb-slate)]",
  fix: "bg-emerald-50 text-emerald-800",
  improvement: "bg-sky-50 text-sky-800",
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
