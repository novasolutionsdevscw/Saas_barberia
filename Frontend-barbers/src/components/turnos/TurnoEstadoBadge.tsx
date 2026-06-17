import type { TurnoEstado } from '../../services/api';

const STYLES: Record<TurnoEstado, string> = {
  esperando_pago: 'border-orange-500/30 bg-orange-500/10 text-orange-200',
  pendiente_validacion: 'border-amber-500/30 bg-amber-500/10 text-amber-200',
  pendiente: 'border-yellow-500/30 bg-yellow-500/10 text-yellow-100',
  confirmado: 'border-indigo-500/30 bg-indigo-500/10 text-indigo-200',
  completado: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200',
  cancelado: 'border-slate-500/30 bg-slate-500/10 text-slate-400',
};

const LABELS: Record<TurnoEstado, string> = {
  esperando_pago: 'Esperando pago',
  pendiente_validacion: 'Validar pago',
  pendiente: 'Pendiente',
  confirmado: 'Confirmado',
  completado: 'Completado',
  cancelado: 'Cancelado',
};

type Props = { estado: TurnoEstado };

export function TurnoEstadoBadge({ estado }: Props) {
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${STYLES[estado]}`}
    >
      {LABELS[estado]}
    </span>
  );
}
