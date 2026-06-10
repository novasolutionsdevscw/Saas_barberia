import { FormEvent, useCallback, useEffect, useState } from 'react';
import { Calendar, Clock, Loader2, Plus, Trash2 } from 'lucide-react';
import { api, type Barbero, type BloqueoBarbero, type HorarioBarbero } from '../../services/api';
import { DIAS_SEMANA, normalizeHora, todayIsoDate } from '../../utils/horarios';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';

type DayRow = {
  dia_semana: number;
  hora_inicio: string;
  hora_fin: string;
  activo: boolean;
};

type Props = {
  open: boolean;
  barbero: Barbero | null;
  onClose: () => void;
  onToast: (message: string, type: 'success' | 'error') => void;
};

function buildDefaultRows(existing: HorarioBarbero[]): DayRow[] {
  return DIAS_SEMANA.map(({ value }) => {
    const found = existing.find((h) => h.dia_semana === value);
    return {
      dia_semana: value,
      hora_inicio: normalizeHora(found?.hora_inicio ?? '09:00'),
      hora_fin: normalizeHora(found?.hora_fin ?? '18:00'),
      activo: found?.activo ?? false,
    };
  });
}

export function BarberoHorariosModal({ open, barbero, onClose, onToast }: Props) {
  const [tab, setTab] = useState<'horarios' | 'bloqueos'>('horarios');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [rows, setRows] = useState<DayRow[]>(buildDefaultRows([]));
  const [bloqueos, setBloqueos] = useState<BloqueoBarbero[]>([]);
  const [nuevaFecha, setNuevaFecha] = useState('');
  const [nuevoMotivo, setNuevoMotivo] = useState('');
  const [bloqueoLoading, setBloqueoLoading] = useState(false);
  const [diasConHorario, setDiasConHorario] = useState<number[]>([]);

  const barberoKey = barbero?.uuid || (barbero?.id != null ? String(barbero.id) : '');

  const load = useCallback(async () => {
    if (!barberoKey) return;

    setLoading(true);
    try {
      const [horarios, bloqueosData] = await Promise.all([
        api.getBarberoHorarios(barberoKey),
        api.getBarberoBloqueos(barberoKey),
      ]);
      setRows(buildDefaultRows(horarios));
      setDiasConHorario(horarios.map((h) => h.dia_semana));
      setBloqueos(bloqueosData);
    } catch (err) {
      onToast(err instanceof Error ? err.message : 'Error al cargar horarios', 'error');
    } finally {
      setLoading(false);
    }
  }, [barberoKey, onToast]);

  useEffect(() => {
    if (open && barbero) {
      setTab('horarios');
      setNuevaFecha('');
      setNuevoMotivo('');
      load();
    }
  }, [open, barbero, load]);

  const handleSaveHorarios = async (e: FormEvent) => {
    e.preventDefault();
    if (!barberoKey) return;

    const activos = rows.filter((r) => r.activo);
    for (const row of activos) {
      if (row.hora_inicio >= row.hora_fin) {
        onToast(`Horario inválido en ${DIAS_SEMANA.find((d) => d.value === row.dia_semana)?.label}`, 'error');
        return;
      }
    }

    setSaving(true);
    try {
      const inactivos = rows.filter((r) => !r.activo && diasConHorario.includes(r.dia_semana));
      await Promise.all(
        inactivos.map((r) => api.deleteBarberoHorario(barberoKey, r.dia_semana)),
      );

      const res =
        activos.length > 0
          ? await api.syncBarberoHorarios(
              barberoKey,
              activos.map((r) => ({
                dia_semana: r.dia_semana,
                hora_inicio: r.hora_inicio,
                hora_fin: r.hora_fin,
                activo: true,
              })),
            )
          : { message: 'Horarios actualizados.', horarios: [] as HorarioBarbero[] };

      setRows(buildDefaultRows(res.horarios));
      setDiasConHorario(res.horarios.map((h) => h.dia_semana));
      onToast(res.message, 'success');
    } catch (err) {
      onToast(err instanceof Error ? err.message : 'Error al guardar horarios', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleAddBloqueo = async (e: FormEvent) => {
    e.preventDefault();
    if (!barbero?.uuid || !nuevaFecha) return;

    setBloqueoLoading(true);
    try {
      const res = await api.createBarberoBloqueo(barberoKey, {
        fecha: nuevaFecha,
        motivo: nuevoMotivo.trim() || undefined,
      });
      setBloqueos((prev) => [...prev, res.bloqueo].sort((a, b) => a.fecha.localeCompare(b.fecha)));
      setNuevaFecha('');
      setNuevoMotivo('');
      onToast(res.message, 'success');
    } catch (err) {
      onToast(err instanceof Error ? err.message : 'Error al registrar bloqueo', 'error');
    } finally {
      setBloqueoLoading(false);
    }
  };

  const handleDeleteBloqueo = async (fecha: string) => {
    if (!barberoKey) return;

    setBloqueoLoading(true);
    try {
      const res = await api.deleteBarberoBloqueo(barberoKey, fecha);
      setBloqueos((prev) => prev.filter((b) => b.fecha !== fecha));
      onToast(res.message, 'success');
    } catch (err) {
      onToast(err instanceof Error ? err.message : 'Error al eliminar bloqueo', 'error');
    } finally {
      setBloqueoLoading(false);
    }
  };

  const updateRow = (dia: number, patch: Partial<DayRow>) => {
    setRows((prev) => prev.map((r) => (r.dia_semana === dia ? { ...r, ...patch } : r)));
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={barbero ? `Horarios — ${barbero.nombre}` : 'Horarios'}
      wide
      footer={
        <button type="button" className="btn-ghost" onClick={onClose}>
          Cerrar
        </button>
      }
    >
      <div className="mb-4 flex gap-2 border-b border-[var(--color-border)] pb-3">
        <button
          type="button"
          onClick={() => setTab('horarios')}
          className={`rounded-lg px-3 py-1.5 text-sm transition ${
            tab === 'horarios'
              ? 'bg-indigo-500/20 text-indigo-200'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Clock className="mr-1.5 inline h-4 w-4" />
          Horario semanal
        </button>
        <button
          type="button"
          onClick={() => setTab('bloqueos')}
          className={`rounded-lg px-3 py-1.5 text-sm transition ${
            tab === 'bloqueos'
              ? 'bg-indigo-500/20 text-indigo-200'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Calendar className="mr-1.5 inline h-4 w-4" />
          Bloqueos
        </button>
      </div>

      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
        </div>
      ) : tab === 'horarios' ? (
        <form onSubmit={handleSaveHorarios} className="space-y-3">
          <p className="text-sm text-slate-400">
            Marca los días laborables y el rango de horas. Solo los días activos se guardan.
          </p>
          <div className="space-y-2">
            {rows.map((row) => {
              const label = DIAS_SEMANA.find((d) => d.value === row.dia_semana)?.label ?? '';
              return (
                <div
                  key={row.dia_semana}
                  className="flex flex-col gap-2 rounded-xl border border-[var(--color-border)] bg-white/[0.02] px-3 py-2.5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3"
                >
                  <label className="flex min-w-0 items-center gap-2 sm:min-w-[120px]">
                    <input
                      type="checkbox"
                      checked={row.activo}
                      onChange={(e) => updateRow(row.dia_semana, { activo: e.target.checked })}
                      className="h-4 w-4 shrink-0 rounded border-slate-600 text-indigo-500"
                    />
                    <span className="text-sm font-medium text-slate-200">{label}</span>
                  </label>
                  <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
                    <input
                      type="time"
                      value={row.hora_inicio}
                      disabled={!row.activo}
                      onChange={(e) => updateRow(row.dia_semana, { hora_inicio: e.target.value })}
                      className="input-field w-full min-w-0 text-sm disabled:opacity-40 sm:w-28"
                    />
                    <span className="hidden text-slate-500 sm:inline">a</span>
                    <input
                      type="time"
                      value={row.hora_fin}
                      disabled={!row.activo}
                      onChange={(e) => updateRow(row.dia_semana, { hora_fin: e.target.value })}
                      className="input-field w-full min-w-0 text-sm disabled:opacity-40 sm:w-28"
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar horarios'}
          </button>
        </form>
      ) : (
        <div className="space-y-4">
          <form onSubmit={handleAddBloqueo} className="flex flex-wrap items-end gap-3 rounded-xl border border-[var(--color-border)] bg-white/[0.02] p-4">
            <div className="min-w-[160px] flex-1">
              <label className="mb-1 block text-sm font-medium text-slate-300">Fecha</label>
              <input
                type="date"
                min={todayIsoDate()}
                value={nuevaFecha}
                onChange={(e) => setNuevaFecha(e.target.value)}
                className="input-field w-full"
                required
              />
            </div>
            <div className="min-w-[200px] flex-[2]">
              <Input
                label="Motivo (opcional)"
                value={nuevoMotivo}
                onChange={(e) => setNuevoMotivo(e.target.value)}
                placeholder="Vacaciones, cita médica..."
              />
            </div>
            <button type="submit" className="btn-primary shrink-0" disabled={bloqueoLoading}>
              <Plus className="h-4 w-4" />
              Agregar bloqueo
            </button>
          </form>

          {bloqueos.length === 0 ? (
            <p className="text-center text-sm text-slate-500 py-6">No hay bloqueos registrados.</p>
          ) : (
            <ul className="divide-y divide-[var(--color-border)] rounded-xl border border-[var(--color-border)]">
              {bloqueos.map((b) => (
                <li
                  key={b.fecha}
                  className="flex items-center justify-between gap-3 px-4 py-3 text-sm"
                >
                  <div>
                    <p className="font-medium text-white">{b.fecha}</p>
                    {b.motivo && <p className="text-slate-400">{b.motivo}</p>}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteBloqueo(b.fecha)}
                    disabled={bloqueoLoading}
                    className="rounded-lg p-2 text-slate-400 hover:bg-red-500/10 hover:text-red-300"
                    aria-label={`Eliminar bloqueo ${b.fecha}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </Modal>
  );
}
