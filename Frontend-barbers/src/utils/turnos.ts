import type { Cliente, Turno, TurnoEstado } from '../services/api';

export const ESTADOS_TURNO: { value: TurnoEstado; label: string }[] = [
  { value: 'esperando_pago', label: 'Esperando pago' },
  { value: 'pendiente_validacion', label: 'Validar pago' },
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'confirmado', label: 'Confirmado' },
  { value: 'completado', label: 'Completado' },
  { value: 'cancelado', label: 'Cancelado' },
];

export const MOTIVOS_RECHAZO_PAGO = [
  { value: 'comprobante_ilegible', label: 'Comprobante ilegible' },
  { value: 'pago_no_encontrado', label: 'Pago no encontrado' },
  { value: 'valor_incorrecto', label: 'Valor incorrecto' },
  { value: 'horario_ocupado', label: 'Horario ya no disponible' },
] as const;

export function formatHora(hora: string): string {
  if (!hora) return '—';
  return hora.length >= 5 ? hora.slice(0, 5) : hora;
}

export function formatFecha(fecha: string): string {
  if (!fecha) return '—';
  const [y, m, d] = fecha.slice(0, 10).split('-');
  if (!y || !m || !d) return fecha;
  return `${d}/${m}/${y}`;
}

export function formatPrecioTurno(precio: number | string): string {
  const n = typeof precio === 'string' ? parseFloat(precio) : precio;
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(Number.isFinite(n) ? n : 0);
}

export function extractClientesFromTurnos(turnos: Turno[]): Cliente[] {
  const map = new Map<number, Cliente>();
  for (const t of turnos) {
    if (t.cliente && !map.has(t.cliente.id)) {
      map.set(t.cliente.id, t.cliente);
    }
  }
  return [...map.values()].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
}

export type ClienteResumen = Cliente & {
  totalTurnos: number;
  ultimaFecha: string | null;
};

export function buildClientesResumen(turnos: Turno[]): ClienteResumen[] {
  const stats = new Map<number, ClienteResumen>();

  for (const t of turnos) {
    if (!t.cliente) continue;
    const existing = stats.get(t.cliente.id);
    const fecha = t.fecha?.slice(0, 10) ?? '';

    if (!existing) {
      stats.set(t.cliente.id, {
        ...t.cliente,
        totalTurnos: 1,
        ultimaFecha: fecha || null,
      });
      continue;
    }

    existing.totalTurnos += 1;
    if (fecha && (!existing.ultimaFecha || fecha > existing.ultimaFecha)) {
      existing.ultimaFecha = fecha;
    }
  }

  return [...stats.values()].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
}

export function isTurnoActivo(estado: TurnoEstado): boolean {
  return (
    estado === 'esperando_pago' ||
    estado === 'pendiente_validacion' ||
    estado === 'pendiente' ||
    estado === 'confirmado'
  );
}

export function requiereValidacionPago(estado: TurnoEstado): boolean {
  return estado === 'pendiente_validacion';
}
