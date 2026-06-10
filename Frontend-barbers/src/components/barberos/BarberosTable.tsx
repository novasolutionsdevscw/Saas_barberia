import { useCallback, useEffect, useState } from 'react';
import { CalendarClock, Loader2, Pencil, Plus, Trash2, Users } from 'lucide-react';
import { api, type Barbero } from '../../services/api';
import { Modal } from '../ui/Modal';
import { Tooltip } from '../ui/Tooltip';
import { BarberoFormModal } from './BarberoFormModal';
import { BarberoHorariosModal } from './BarberoHorariosModal';

type BarberosTableProps = {
  onToast?: (message: string, type: 'success' | 'error') => void;
};

export function BarberosTable({ onToast }: BarberosTableProps) {
  const [barberos, setBarberos] = useState<Barbero[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [selected, setSelected] = useState<Barbero | null>(null);
  const [deactivateTarget, setDeactivateTarget] = useState<Barbero | null>(null);
  const [horariosTarget, setHorariosTarget] = useState<Barbero | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getBarberos();
      setBarberos(data);
    } catch (err) {
      onToast?.(err instanceof Error ? err.message : 'Error al cargar barberos', 'error');
    } finally {
      setLoading(false);
    }
  }, [onToast]);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setFormMode('create');
    setSelected(null);
    setFormOpen(true);
  };

  const openEdit = (barbero: Barbero) => {
    setFormMode('edit');
    setSelected(barbero);
    setFormOpen(true);
  };

  const handleFormSuccess = (message: string, barbero: Barbero) => {
    if (!barbero.estado) {
      setBarberos((prev) => prev.filter((b) => b.id !== barbero.id));
    } else if (formMode === 'create') {
      setBarberos((prev) => [...prev, barbero]);
    } else {
      setBarberos((prev) => prev.map((b) => (b.id === barbero.id ? barbero : b)));
    }
    setFormOpen(false);
    onToast?.(message, 'success');
  };

  const handleDeactivate = async () => {
    if (!deactivateTarget) return;

    setActionLoading(true);
    try {
      const res = await api.deleteBarbero(deactivateTarget.id);
      setBarberos((prev) => prev.filter((b) => b.id !== deactivateTarget.id));
      onToast?.(res.message, 'success');
      setDeactivateTarget(null);
    } catch (err) {
      onToast?.(err instanceof Error ? err.message : 'Error al desactivar barbero', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-400">
          {barberos.length} barbero{barberos.length === 1 ? '' : 's'} activo
          {barberos.length === 1 ? '' : 's'}
        </p>
        <button type="button" className="btn-primary" onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Nuevo barbero
        </button>
      </div>

      {barberos.length === 0 ? (
        <div className="card flex flex-col items-center justify-center gap-3 py-16 text-center">
          <Users className="h-12 w-12 text-slate-600" />
          <div>
            <p className="font-medium text-white">No hay barberos registrados</p>
            <p className="mt-1 text-sm text-slate-400">
              Agrega el primer barbero de tu equipo para que pueda acceder al sistema.
            </p>
          </div>
          <button type="button" className="btn-primary mt-2" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Crear barbero
          </button>
        </div>
      ) : (
        <>
          {/* Vista móvil: cards */}
          <div className="space-y-3 md:hidden">
            {barberos.map((barbero) => (
              <article
                key={barbero.id}
                className="rounded-xl border border-[var(--color-border)] bg-white/[0.02] p-4"
              >
                <h3 className="font-medium text-white">{barbero.nombre}</h3>
                <dl className="mt-3 space-y-1.5 text-sm">
                  <div className="flex justify-between gap-2">
                    <dt className="text-slate-500">Email</dt>
                    <dd className="truncate text-slate-300">{barbero.user?.email ?? '—'}</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-slate-500">Teléfono</dt>
                    <dd className="text-slate-400">{barbero.telefono || '—'}</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-slate-500">Especialidad</dt>
                    <dd className="text-slate-400">{barbero.especialidad || '—'}</dd>
                  </div>
                </dl>
                <div className="mt-3 flex flex-wrap gap-2 border-t border-[var(--color-border)] pt-3">
                  <button
                    type="button"
                    onClick={() => setHorariosTarget(barbero)}
                    className="btn-ghost px-2 py-1.5 text-xs text-amber-300"
                  >
                    Horarios
                  </button>
                  <button
                    type="button"
                    onClick={() => openEdit(barbero)}
                    className="btn-ghost px-2 py-1.5 text-xs"
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeactivateTarget(barbero)}
                    className="btn-ghost px-2 py-1.5 text-xs text-red-400"
                  >
                    Desactivar
                  </button>
                </div>
              </article>
            ))}
          </div>

          {/* Vista desktop: tabla */}
          <div className="card hidden overflow-hidden p-0 md:block">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border)] bg-white/[0.02] text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3 font-medium">Nombre</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Teléfono</th>
                  <th className="px-4 py-3 font-medium">Especialidad</th>
                  <th className="px-4 py-3 text-right font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {barberos.map((barbero) => (
                  <tr key={barbero.id} className="transition hover:bg-white/[0.02]">
                    <td className="px-4 py-3 font-medium text-white">{barbero.nombre}</td>
                    <td className="px-4 py-3 text-slate-300">{barbero.user?.email ?? '—'}</td>
                    <td className="px-4 py-3 text-slate-400">{barbero.telefono || '—'}</td>
                    <td className="px-4 py-3 text-slate-400">{barbero.especialidad || '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Tooltip label="Horarios y bloqueos">
                          <button
                            type="button"
                            onClick={() => setHorariosTarget(barbero)}
                            className="rounded-lg p-2 text-slate-400 transition hover:bg-white/5 hover:text-amber-300"
                            aria-label={`Horarios de ${barbero.nombre}`}
                          >
                            <CalendarClock className="h-4 w-4" />
                          </button>
                        </Tooltip>
                        <Tooltip label="Editar">
                          <button
                            type="button"
                            onClick={() => openEdit(barbero)}
                            className="rounded-lg p-2 text-slate-400 transition hover:bg-white/5 hover:text-indigo-300"
                            aria-label={`Editar ${barbero.nombre}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                        </Tooltip>
                        <Tooltip label="Desactivar">
                          <button
                            type="button"
                            onClick={() => setDeactivateTarget(barbero)}
                            className="rounded-lg p-2 text-slate-400 transition hover:bg-red-500/10 hover:text-red-300"
                            aria-label={`Desactivar ${barbero.nombre}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </Tooltip>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        </>
      )}

      <BarberoFormModal
        open={formOpen}
        mode={formMode}
        barbero={selected}
        onClose={() => setFormOpen(false)}
        onSuccess={handleFormSuccess}
        onError={(msg) => onToast?.(msg, 'error')}
      />

      <BarberoHorariosModal
        open={!!horariosTarget}
        barbero={horariosTarget}
        onClose={() => setHorariosTarget(null)}
        onToast={(msg, type) => onToast?.(msg, type)}
      />

      <Modal
        open={!!deactivateTarget}
        onClose={() => setDeactivateTarget(null)}
        title="Desactivar barbero"
        footer={
          <>
            <button
              type="button"
              className="btn-ghost"
              onClick={() => setDeactivateTarget(null)}
              disabled={actionLoading}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="rounded-xl bg-red-500 px-4 py-2.5 font-medium text-white hover:bg-red-400 disabled:opacity-60"
              onClick={handleDeactivate}
              disabled={actionLoading}
            >
              {actionLoading ? 'Desactivando...' : 'Desactivar'}
            </button>
          </>
        }
      >
        <p>
          ¿Desactivar a <strong className="text-white">{deactivateTarget?.nombre}</strong>? Ya no
          aparecerá en la lista ni podrá operar hasta que lo reactives editándolo.
        </p>
      </Modal>
    </div>
  );
}
