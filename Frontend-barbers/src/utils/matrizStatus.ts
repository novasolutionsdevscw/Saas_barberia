export function estadoSistemaColor(estado: string): string {
  switch (estado) {
    case 'activo':
      return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
    case 'en_gracia':
      return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
    case 'bloqueado':
      return 'bg-red-500/15 text-red-300 border-red-500/30';
    default:
      return 'bg-slate-500/15 text-slate-300 border-slate-500/30';
  }
}

export function estadoPagoColor(estado: string): string {
  return estado === 'pagado'
    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
    : 'bg-amber-500/15 text-amber-300 border-amber-500/30';
}

export function formatEstadoLabel(estado: string): string {
  return estado.replace(/_/g, ' ');
}
