type BarItem = {
  label: string;
  value: number;
  sublabel?: string;
};

type Props = {
  items: BarItem[];
  valueFormatter?: (n: number) => string;
  emptyMessage?: string;
};

export function SimpleBarChart({
  items,
  valueFormatter = (n) => String(n),
  emptyMessage = 'Sin datos en el periodo',
}: Props) {
  if (items.length === 0) {
    return <p className="py-6 text-center text-sm text-slate-500">{emptyMessage}</p>;
  }

  const max = Math.max(...items.map((i) => i.value), 1);

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.label}>
          <div className="mb-1 flex items-center justify-between gap-2 text-sm">
            <span className="truncate text-slate-300">{item.label}</span>
            <span className="shrink-0 font-medium text-white">{valueFormatter(item.value)}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-600 to-indigo-400 transition-all duration-500"
              style={{ width: `${Math.max(4, (item.value / max) * 100)}%` }}
            />
          </div>
          {item.sublabel && <p className="mt-0.5 text-xs text-slate-500">{item.sublabel}</p>}
        </div>
      ))}
    </div>
  );
}
