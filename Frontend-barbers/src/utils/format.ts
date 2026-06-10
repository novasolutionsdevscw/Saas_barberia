export function formatMoney(value: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0);
}

/** Alias usado en landing y productos */
export const formatPrecio = formatMoney;

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('es-CO').format(value);
}

export function monthRange(offset = 0): { desde: string; hasta: string; label: string } {
  const d = new Date();
  d.setMonth(d.getMonth() + offset);
  const y = d.getFullYear();
  const m = d.getMonth();
  const desde = `${y}-${String(m + 1).padStart(2, '0')}-01`;
  const last = new Date(y, m + 1, 0).getDate();
  const hasta = `${y}-${String(m + 1).padStart(2, '0')}-${String(last).padStart(2, '0')}`;
  const label = d.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' });
  return { desde, hasta, label };
}

export function lastDaysRange(days: number): { desde: string; hasta: string; label: string } {
  const fin = new Date();
  const ini = new Date();
  ini.setDate(ini.getDate() - (days - 1));
  const fmt = (dt: Date) =>
    `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
  return {
    desde: fmt(ini),
    hasta: fmt(fin),
    label: `Últimos ${days} días`,
  };
}
