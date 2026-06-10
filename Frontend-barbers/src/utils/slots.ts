/** Genera slots HH:mm cada `intervaloMin` minutos entre inicio (inclusive) y fin (exclusive). */
export function generarSlotsHorario(
  horaInicio: string,
  horaFin: string,
  intervaloMin = 30,
): string[] {
  const toMinutes = (h: string) => {
    const [hh, mm] = h.slice(0, 5).split(':').map(Number);
    return hh * 60 + mm;
  };

  const format = (mins: number) => {
    const hh = Math.floor(mins / 60);
    const mm = mins % 60;
    return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
  };

  const start = toMinutes(horaInicio);
  const end = toMinutes(horaFin);
  const slots: string[] = [];

  for (let t = start; t < end; t += intervaloMin) {
    slots.push(format(t));
  }

  return slots;
}

export function filtrarSlotsLibres(slots: string[], ocupadas: string[] = []): string[] {
  const set = new Set(ocupadas.map((h) => h.slice(0, 5)));
  return slots.filter((s) => !set.has(s.slice(0, 5)));
}
