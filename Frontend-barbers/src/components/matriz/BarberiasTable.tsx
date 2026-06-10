import { useCallback, useEffect, useState } from 'react';
import { Ban, CheckCircle, CreditCard, Loader2, Plus, QrCode } from 'lucide-react';
import { api, type BarberiaMatriz } from '../../services/api';
import { Modal } from '../ui/Modal';
import { Tooltip } from '../ui/Tooltip';
import { RegistrarBarberiaModal } from './RegistrarBarberiaModal';
import { BarberiaQrModal } from './BarberiaQrModal';
import { estadoPagoColor, estadoSistemaColor, formatEstadoLabel } from '../../utils/matrizStatus';

type ActionType = 'pago' | 'bloquear' | 'activar';

type BarberiasTableProps = {
  showFilters?: boolean;
  showRegisterButton?: boolean;
  onToast?: (message: string, type: 'success' | 'error') => void;
};

export function BarberiasTable({
  showFilters = true,
  showRegisterButton = true,
  onToast,
}: BarberiasTableProps) {
  const [barberias, setBarberias] = useState<BarberiaMatriz[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [estadoPago, setEstadoPago] = useState('todos');
  const [estadoSistema, setEstadoSistema] = useState('todos');
  const [modal, setModal] = useState<{ type: ActionType; barberia: BarberiaMatriz } | null>(null);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [qrBarberia, setQrBarberia] = useState<BarberiaMatriz | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getMatrizDashboard({
        estado_pago: estadoPago !== 'todos' ? estadoPago : undefined,
        estado_sistema: estadoSistema !== 'todos' ? estadoSistema : undefined,
      });
      setBarberias(data.barberias);
    } catch (err) {
      onToast?.(err instanceof Error ? err.message : 'Error al cargar barberías', 'error');
    } finally {
      setLoading(false);
    }
  }, [estadoPago, estadoSistema, onToast]);

  useEffect(() => {
    load();
  }, [load]);

  const runAction = async () => {
    if (!modal) return;

    const { type, barberia } = modal;
    setActionLoading(barberia.id);

    try {
      let res;
      if (type === 'pago') res = await api.matrizRegistrarPago(barberia.id);
      else if (type === 'bloquear') res = await api.matrizBloquear(barberia.id);
      else res = await api.matrizActivar(barberia.id);

      setBarberias((prev) => prev.map((b) => (b.id === barberia.id ? res.barberia : b)));
      onToast?.(res.message, 'success');
      setModal(null);
    } catch (err) {
      onToast?.(err instanceof Error ? err.message : 'Error en la acción', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const modalCopy = {
    pago: {
      title: 'Registrar pago',
      body: `¿Confirmas el pago de "${modal?.barberia.nombre}"? Se extenderá la suscripción 30 días y el estado pasará a activo.`,
      confirm: 'Registrar pago',
      className: 'btn-primary',
    },
    bloquear: {
      title: 'Bloquear barbería',
      body: `¿Bloquear manualmente a "${modal?.barberia.nombre}"? Los usuarios no podrán acceder al sistema.`,
      confirm: 'Bloquear',
      className: 'rounded-xl bg-red-500 px-4 py-2.5 font-medium text-white hover:bg-red-400',
    },
    activar: {
      title: 'Activar barbería',
      body: `¿Activar manualmente a "${modal?.barberia.nombre}"?`,
      confirm: 'Activar',
      className: 'rounded-xl bg-emerald-500 px-4 py-2.5 font-medium text-white hover:bg-emerald-400',
    },
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {showFilters && (
          <div className="flex flex-wrap gap-3">
            <select
              className="input-field max-w-[200px]"
              value={estadoPago}
              onChange={(e) => setEstadoPago(e.target.value)}
            >
              <option value="todos">Estado pago: Todos</option>
              <option value="pagado">Pagado</option>
              <option value="pendiente">Pendiente</option>
            </select>
            <select
              className="input-field max-w-[220px]"
              value={estadoSistema}
              onChange={(e) => setEstadoSistema(e.target.value)}
            >
              <option value="todos">Estado sistema: Todos</option>
              <option value="activo">Activo</option>
              <option value="en_gracia">En gracia</option>
              <option value="bloqueado">Bloqueado</option>
            </select>
          </div>
        )}
        {showRegisterButton && (
          <button type="button" className="btn-primary" onClick={() => setRegisterOpen(true)}>
            <Plus className="h-4 w-4" />
            Registrar barbería
          </button>
        )}
      </div>

      <div className="card overflow-hidden border-violet-500/10 p-0">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-slate-500" />
          </div>
        ) : barberias.length === 0 ? (
          <p className="px-4 py-12 text-center text-slate-500">
            No hay barberías con los filtros seleccionados.
          </p>
        ) : (
          <>
            {/* Vista móvil: cards */}
            <div className="space-y-3 p-4 md:hidden">
              {barberias.map((barberia) => (
                <article
                  key={barberia.id}
                  className="rounded-xl border border-[var(--color-border)] bg-white/[0.02] p-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium text-white">{barberia.nombre}</p>
                      <p className="text-xs text-slate-500">ID #{barberia.id}</p>
                    </div>
                    <span
                      className={`inline-flex shrink-0 rounded-full border px-2.5 py-0.5 text-xs capitalize ${estadoSistemaColor(barberia.estado_sistema)}`}
                    >
                      {formatEstadoLabel(barberia.estado_sistema)}
                    </span>
                  </div>
                  <dl className="mt-3 space-y-1.5 text-sm">
                    <div>
                      <dt className="text-xs text-slate-500">Admin</dt>
                      <dd className="text-slate-200">{barberia.admin_nombre || '—'}</dd>
                      <dd className="truncate text-xs text-slate-500">{barberia.admin_email}</dd>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1">
                      <div>
                        <dt className="text-xs text-slate-500">Vencimiento</dt>
                        <dd className="text-slate-300">{barberia.fecha_vencimiento || '—'}</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-slate-500">Días</dt>
                        <dd
                          className={
                            barberia.dias_restantes !== null && barberia.dias_restantes < 0
                              ? 'text-red-300'
                              : barberia.dias_restantes !== null && barberia.dias_restantes <= 7
                                ? 'text-amber-300'
                                : 'text-emerald-300'
                          }
                        >
                          {barberia.etiqueta_dias || '—'}
                        </dd>
                      </div>
                    </div>
                    <div>
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs capitalize ${estadoPagoColor(barberia.estado_pago)}`}
                      >
                        Pago: {barberia.estado_pago}
                      </span>
                    </div>
                  </dl>
                  <div className="mt-3 flex flex-wrap gap-2 border-t border-[var(--color-border)] pt-3">
                    <button
                      type="button"
                      disabled={actionLoading === barberia.id}
                      onClick={() => setQrBarberia(barberia)}
                      className="btn-ghost px-2 py-1.5 text-xs text-violet-300"
                    >
                      QR
                    </button>
                    <button
                      type="button"
                      disabled={actionLoading === barberia.id}
                      onClick={() => setModal({ type: 'pago', barberia })}
                      className="btn-ghost px-2 py-1.5 text-xs text-emerald-300"
                    >
                      Pago
                    </button>
                    <button
                      type="button"
                      disabled={actionLoading === barberia.id}
                      onClick={() => setModal({ type: 'activar', barberia })}
                      className="btn-ghost px-2 py-1.5 text-xs text-indigo-300"
                    >
                      Activar
                    </button>
                    <button
                      type="button"
                      disabled={actionLoading === barberia.id}
                      onClick={() => setModal({ type: 'bloquear', barberia })}
                      className="btn-ghost px-2 py-1.5 text-xs text-red-300"
                    >
                      Bloquear
                    </button>
                  </div>
                </article>
              ))}
            </div>

            {/* Vista desktop: tabla */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[980px] text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)] bg-white/[0.02] text-xs uppercase text-slate-500">
                <th className="px-4 py-3 font-medium">Barbería</th>
                <th className="px-4 py-3 font-medium">Admin</th>
                <th className="px-4 py-3 font-medium">Vencimiento</th>
                <th className="px-4 py-3 font-medium">Pago</th>
                <th className="px-4 py-3 font-medium">Sistema</th>
                <th className="px-4 py-3 font-medium">Días</th>
                <th className="px-4 py-3 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {barberias.map((barberia) => (
                  <tr
                    key={barberia.id}
                    className="border-b border-[var(--color-border)]/60 transition hover:bg-white/[0.02]"
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-white">{barberia.nombre}</p>
                      <p className="text-xs text-slate-500">ID #{barberia.id}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-slate-200">{barberia.admin_nombre || '—'}</p>
                      <p className="text-xs text-slate-500">{barberia.admin_email}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-300">
                      {barberia.fecha_vencimiento || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs capitalize ${estadoPagoColor(barberia.estado_pago)}`}
                      >
                        {barberia.estado_pago}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs capitalize ${estadoSistemaColor(barberia.estado_sistema)}`}
                      >
                        {formatEstadoLabel(barberia.estado_sistema)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          barberia.dias_restantes !== null && barberia.dias_restantes < 0
                            ? 'text-red-300'
                            : barberia.dias_restantes !== null && barberia.dias_restantes <= 7
                              ? 'text-amber-300'
                              : 'text-emerald-300'
                        }
                      >
                        {barberia.etiqueta_dias || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1.5">
                        <Tooltip label="Ver código QR con ID de la barbería">
                          <button
                            type="button"
                            disabled={actionLoading === barberia.id}
                            onClick={() => setQrBarberia(barberia)}
                            className="rounded-lg border border-violet-500/30 bg-violet-500/10 p-2 text-violet-300 transition hover:bg-violet-500/20 disabled:opacity-50"
                          >
                            <QrCode className="h-4 w-4" />
                          </button>
                        </Tooltip>
                        <Tooltip label="Registrar pago (+30 días)">
                          <button
                            type="button"
                            disabled={actionLoading === barberia.id}
                            onClick={() => setModal({ type: 'pago', barberia })}
                            className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-2 text-emerald-300 transition hover:bg-emerald-500/20 disabled:opacity-50"
                          >
                            <CreditCard className="h-4 w-4" />
                          </button>
                        </Tooltip>
                        <Tooltip label="Activar barbería manualmente">
                          <button
                            type="button"
                            disabled={actionLoading === barberia.id}
                            onClick={() => setModal({ type: 'activar', barberia })}
                            className="rounded-lg border border-indigo-500/30 bg-indigo-500/10 p-2 text-indigo-300 transition hover:bg-indigo-500/20 disabled:opacity-50"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </button>
                        </Tooltip>
                        <Tooltip label="Bloquear barbería manualmente">
                          <button
                            type="button"
                            disabled={actionLoading === barberia.id}
                            onClick={() => setModal({ type: 'bloquear', barberia })}
                            className="rounded-lg border border-red-500/30 bg-red-500/10 p-2 text-red-300 transition hover:bg-red-500/20 disabled:opacity-50"
                          >
                            <Ban className="h-4 w-4" />
                          </button>
                        </Tooltip>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
            </div>
          </>
        )}
      </div>

      <RegistrarBarberiaModal
        open={registerOpen}
        onClose={() => setRegisterOpen(false)}
        onSuccess={(msg, barberia) => {
          onToast?.(msg, 'success');
          load();
          setQrBarberia(barberia);
        }}
        onError={(msg) => onToast?.(msg, 'error')}
      />

      <BarberiaQrModal
        open={!!qrBarberia}
        barberia={qrBarberia}
        onClose={() => setQrBarberia(null)}
      />

      {modal && (
        <Modal
          open
          onClose={() => setModal(null)}
          title={modalCopy[modal.type].title}
          footer={
            <>
              <button type="button" className="btn-ghost" onClick={() => setModal(null)}>
                Cancelar
              </button>
              <button
                type="button"
                className={modalCopy[modal.type].className}
                disabled={actionLoading !== null}
                onClick={runAction}
              >
                {actionLoading !== null ? 'Procesando...' : modalCopy[modal.type].confirm}
              </button>
            </>
          }
        >
          {modalCopy[modal.type].body}
        </Modal>
      )}
    </div>
  );
}
