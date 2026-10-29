export function ProgressBar({
  percent,
  label,
}: {
  percent: number;
  label?: string;
}) {
  const p = Math.max(0, Math.min(100, percent));
  return (
    <div className="w-full">
      {label && (
        <div className="mb-1 flex justify-between text-xs text-[color:var(--tb-slate-soft)]">
          <span>{label}</span>
          <span>{p}%</span>
        </div>
      )}
      <div className="h-2 overflow-hidden rounded-full bg-[color:var(--tb-line)]">
        <div
          className="h-full rounded-full bg-[color:var(--tb-orange)] transition-[width] duration-300"
          style={{ width: `${p}%` }}
        />
      </div>
    </div>
  );
}
