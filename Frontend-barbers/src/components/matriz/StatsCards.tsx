import { Building2, CheckCircle2, Clock, Lock, DollarSign } from 'lucide-react';
import type { MatrizStats } from '../../services/api';

type StatsCardsProps = {
  stats: MatrizStats;
};

const items = [
  { key: 'total_barberias' as const, label: 'Total barberías', icon: Building2, color: 'text-violet-400' },
  { key: 'activas' as const, label: 'Activas', icon: CheckCircle2, color: 'text-emerald-400' },
  { key: 'en_gracia' as const, label: 'En gracia', icon: Clock, color: 'text-amber-400' },
  { key: 'bloqueadas' as const, label: 'Bloqueadas', icon: Lock, color: 'text-red-400' },
  { key: 'ingresos_totales' as const, label: 'Ingresos totales', icon: DollarSign, color: 'text-sky-400', prefix: '$' },
];

export function StatsCards({ stats }: StatsCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      {items.map((item) => (
        <div key={item.key} className="card border-violet-500/10">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-slate-500">{item.label}</p>
              <p className="mt-2 text-2xl font-bold text-white">
                {item.prefix ?? ''}
                {stats[item.key].toLocaleString('es')}
              </p>
            </div>
            <item.icon className={`h-5 w-5 ${item.color}`} />
          </div>
        </div>
      ))}
    </div>
  );
}
