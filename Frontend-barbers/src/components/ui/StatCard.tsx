import type { LucideIcon } from 'lucide-react';

type Props = {
  label: string;
  value: string | number;
  hint?: string;
  icon?: LucideIcon;
  tone?: 'default' | 'success' | 'warning' | 'danger' | 'info';
};

const BOX: Record<NonNullable<Props['tone']>, string> = {
  default: 'border-white/8 bg-white/[0.02]',
  success: 'border-emerald-500/25 bg-emerald-500/5',
  warning: 'border-amber-500/25 bg-amber-500/5',
  danger: 'border-red-500/25 bg-red-500/5',
  info: 'border-sky-500/25 bg-sky-500/5',
};

const ICON: Record<NonNullable<Props['tone']>, string> = {
  default: 'text-indigo-400',
  success: 'text-emerald-400',
  warning: 'text-amber-400',
  danger: 'text-red-400',
  info: 'text-sky-400',
};

export function StatCard({ label, value, hint, icon: Icon, tone = 'default' }: Props) {
  return (
    <div className={`rounded-xl border p-4 ${BOX[tone]}`}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
        {Icon && <Icon className={`h-4 w-4 shrink-0 ${ICON[tone]}`} />}
      </div>
      <p className="mt-2 text-2xl font-bold text-white">{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}
