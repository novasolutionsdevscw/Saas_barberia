import { useCallback, useEffect, useState } from 'react';
import { Loader2, Pencil, Plus, Scissors, Trash2 } from 'lucide-react';
import { api, type Servicio } from '../../services/api';
import { Modal } from '../ui/Modal';
import { Tooltip } from '../ui/Tooltip';
import { ServicioFormModal } from './ServicioFormModal';

type ServiciosTableProps = {
  onToast?: (message: string, type: 'success' | 'error') => void;
};

function formatPrecio(precio: number) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(precio);
}

export function ServiciosTable({ onToast }: ServiciosTableProps) {
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [selected, setSelected] = useState<Servicio | null>(null);
  const [deactivateTarget, setDeactivateTarget] = useState<Servicio | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getServicios();
      setServicios(data);
    } catch (err) {
      onToast?.(err instanceof Error ? err.message : 'Error al cargar servicios', 'error');
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

  const openEdit = (servicio: Servicio) => {
    setFormMode('edit');
    setSelected(servicio);
    setFormOpen(true);
  };

  const handleFormSuccess = (message: string, servicio: Servicio) => {
    if (!servicio.estado) {
      setServicios((prev) => prev.filter((s) => s.id !== servicio.id));
    } else if (formMode === 'create') {
      setServicios((prev) => [...prev, servicio]);
    } else {
      setServicios((prev) => prev.map((s) => (s.id === servicio.id ? servicio : s)));
    }
    setFormOpen(false);
    onToast?.(message, 'success');
  };

  const handleDeactivate = async () => {
    if (!deactivateTarget) return;

    setActionLoading(true);
    try {
      const res = await api.deleteServicio(deactivateTarget.id);
      setServicios((prev) => prev.filter((s) => s.id !== deactivateTarget.id));
      onToast?.(res.message, 'success');
      setDeactivateTarget(null);
    } catch (err) {
      onToast?.(err instanceof Error ? err.message : 'Error al desactivar servicio', 'error');
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
          {servicios.length} servicio{servicios.length === 1 ? '' : 's'} activo
          {servicios.length === 1 ? '' : 's'}
        </p>
        <button type="button" className="btn-primary" onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Nuevo servicio
        </button>
      </div>

      {servicios.length === 0 ? (
        <div className="card flex flex-col items-center justify-center gap-3 py-16 text-center">
          <Scissors className="h-12 w-12 text-slate-600" />
          <div>
            <p className="font-medium text-white">No hay servicios registrados</p>
            <p className="mt-1 text-sm text-slate-400">
              Define los servicios que ofrece tu barbería para mostrarlos en la landing.
            </p>
          </div>
          <button type="button" className="btn-primary mt-2" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Crear servicio
          </button>
        </div>
      ) : (
        <>
          {/* Vista móvil: cards */}
          <div className="space-y-3 md:hidden">
            {servicios.map((servicio) => (
              <article
                key={servicio.id}
                className="rounded-xl border border-[var(--color-border)] bg-white/[0.02] p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-medium text-white">{servicio.nombre}</h3>
                  <span className="shrink-0 text-sm font-medium text-indigo-300">
                    {formatPrecio(servicio.precio)}
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-400">{servicio.duracion} min</p>
                <div className="mt-3 flex flex-wrap gap-2 border-t border-[var(--color-border)] pt-3">
                  <button
                    type="button"
                    onClick={() => openEdit(servicio)}
                    className="btn-ghost px-2 py-1.5 text-xs"
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeactivateTarget(servicio)}
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
              <table className="w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border)] bg-white/[0.02] text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3 font-medium">Nombre</th>
                  <th className="px-4 py-3 font-medium">Precio</th>
                  <th className="px-4 py-3 font-medium">Duración</th>
                  <th className="px-4 py-3 text-right font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {servicios.map((servicio) => (
                  <tr key={servicio.id} className="transition hover:bg-white/[0.02]">
                    <td className="px-4 py-3 font-medium text-white">{servicio.nombre}</td>
                    <td className="px-4 py-3 text-slate-300">{formatPrecio(servicio.precio)}</td>
                    <td className="px-4 py-3 text-slate-400">{servicio.duracion} min</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Tooltip label="Editar">
                          <button
                            type="button"
                            onClick={() => openEdit(servicio)}
                            className="rounded-lg p-2 text-slate-400 transition hover:bg-white/5 hover:text-indigo-300"
                            aria-label={`Editar ${servicio.nombre}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                        </Tooltip>
                        <Tooltip label="Desactivar">
                          <button
                            type="button"
                            onClick={() => setDeactivateTarget(servicio)}
                            className="rounded-lg p-2 text-slate-400 transition hover:bg-red-500/10 hover:text-red-300"
                            aria-label={`Desactivar ${servicio.nombre}`}
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

      <ServicioFormModal
        open={formOpen}
        mode={formMode}
        servicio={selected}
        onClose={() => setFormOpen(false)}
        onSuccess={handleFormSuccess}
        onError={(msg) => onToast?.(msg, 'error')}
      />

      <Modal
        open={!!deactivateTarget}
        onClose={() => setDeactivateTarget(null)}
        title="Desactivar servicio"
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
          ¿Desactivar <strong className="text-white">{deactivateTarget?.nombre}</strong>? Dejará de
          mostrarse en la landing pública.
        </p>
      </Modal>
    </div>
  );
}
