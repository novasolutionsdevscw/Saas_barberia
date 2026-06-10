import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Calendar,
  Check,
  Loader2,
  MessageCircle,
  Pencil,
  Plus,
  Trash2,
  XCircle,
} from 'lucide-react';
import { api, type Turno, type TurnoEstado } from '../../services/api';
import {
  ESTADOS_TURNO,
  formatFecha,
  formatHora,
  formatPrecioTurno,
  isTurnoActivo,
} from '../../utils/turnos';
import type { Cliente } from '../../services/api';
import { todayIsoDate } from '../../utils/horarios';
import { buildWhatsAppUrl, enviarConfirmacionWhatsApp, openWhatsAppUrl } from '../../utils/whatsapp';
import { Modal } from '../ui/Modal';
import { Tooltip } from '../ui/Tooltip';
import { TurnoEstadoBadge } from './TurnoEstadoBadge';
import { TurnoFormModal } from './TurnoFormModal';

type Props = {
  onToast?: (message: string, type: 'success' | 'error') => void;
};

type FiltroFecha = 'todos' | 'hoy' | 'futuros' | 'pasados';

export function TurnosTable({ onToast }: Props) {
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [barberos, setBarberos] = useState<Awaited<ReturnType<typeof api.getBarberos>>>([]);
  const [servicios, setServicios] = useState<Awaited<ReturnType<typeof api.getServicios>>>([]);
  const [loading, setLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState<TurnoEstado | 'todos'>('todos');
  const [filtroFecha, setFiltroFecha] = useState<FiltroFecha>('todos');
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [selected, setSelected] = useState<Turno | null>(null);
  const [cancelTarget, setCancelTarget] = useState<Turno | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [confirmingId, setConfirmingId] = useState<number | null>(null);
  const [clientes, setClientes] = useState<Cliente[]>([]);

  const hoy = todayIsoDate();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [turnosData, barberosData, serviciosData, clientesData] = await Promise.all([
        api.getAdminTurnos(),
        api.getBarberos(),
        api.getServicios(),
        api.getAdminClientes(),
      ]);
      setTurnos(turnosData);
      setBarberos(barberosData.filter((b) => b.estado));
      setServicios(serviciosData.filter((s) => s.estado));
      setClientes(clientesData);
    } catch (err) {
      onToast?.(err instanceof Error ? err.message : 'Error al cargar turnos', 'error');
    } finally {
      setLoading(false);
    }
  }, [onToast]);

  useEffect(() => {
    load();
  }, [load]);

  const filtrados = useMemo(() => {
    return turnos.filter((t) => {
      const fecha = t.fecha?.slice(0, 10) ?? '';
      if (filtroEstado !== 'todos' && t.estado !== filtroEstado) return false;
      if (filtroFecha === 'hoy' && fecha !== hoy) return false;
      if (filtroFecha === 'futuros' && fecha < hoy) return false;
      if (filtroFecha === 'pasados' && fecha >= hoy) return false;
      return true;
    });
  }, [turnos, filtroEstado, filtroFecha, hoy]);

  const openCreate = () => {
    setFormMode('create');
    setSelected(null);
    setFormOpen(true);
  };

  const openEdit = (turno: Turno) => {
    setFormMode('edit');
    setSelected(turno);
    setFormOpen(true);
  };

  const handleFormSuccess = (message: string, turno: Turno) => {
    if (formMode === 'create') {
      setTurnos((prev) => [...prev, turno].sort(sortTurnos));
    } else {
      setTurnos((prev) => prev.map((t) => (t.id === turno.id ? turno : t)).sort(sortTurnos));
    }
    setFormOpen(false);
    onToast?.(message, 'success');
  };

  const handleCancel = async () => {
    if (!cancelTarget) return;
    setActionLoading(true);
    try {
      const res = await api.cancelAdminTurno(cancelTarget.id);
      setTurnos((prev) =>
        prev.map((t) =>
          t.id === cancelTarget.id ? { ...t, estado: 'cancelado' as const } : t,
        ),
      );
      onToast?.(res.message, 'success');
      setCancelTarget(null);
    } catch (err) {
      onToast?.(err instanceof Error ? err.message : 'Error al cancelar', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmar = async (turno: Turno) => {
    setConfirmingId(turno.id);
    try {
      const res = await api.confirmarTurnoAdmin(turno.id);
      const clienteTelefono = res.cliente_telefono ?? turno.cliente?.telefono;
      const modo = await enviarConfirmacionWhatsApp({
        whatsappUrl: res.whatsapp_url,
        whatsappMensaje: res.whatsapp_mensaje,
        clienteTelefono,
        citaTarjetaUrl: res.cita_tarjeta_url ?? res.qr_url,
      });
      const whatsappUrl =
        res.whatsapp_url ??
        (clienteTelefono && res.whatsapp_mensaje
          ? buildWhatsAppUrl(clienteTelefono, res.whatsapp_mensaje)
          : null);
      setTurnos((prev) =>
        prev.map((t) =>
          t.id === turno.id
            ? { ...t, estado: 'confirmado' as const, whatsapp_url: whatsappUrl }
            : t,
        ),
      );
      onToast?.(
        modo === 'share'
          ? 'Cita confirmada. Comparte la tarjeta QR con el cliente en WhatsApp.'
          : modo === 'wame'
            ? `Cita confirmada. WhatsApp abierto — adjunta la tarjeta descargada${clienteTelefono ? ` (${clienteTelefono})` : ''}.`
            : res.message,
        'success',
      );
    } catch (err) {
      onToast?.(err instanceof Error ? err.message : 'Error al confirmar', 'error');
    } finally {
      setConfirmingId(null);
    }
  };

  const handleQuickEstado = async (turno: Turno, nuevoEstado: TurnoEstado) => {
    try {
      const res = await api.cambiarEstadoTurno(turno.id, nuevoEstado);
      setTurnos((prev) => prev.map((t) => (t.id === turno.id ? res.data : t)));
      onToast?.(res.message, 'success');
    } catch (err) {
      onToast?.(err instanceof Error ? err.message : 'Error al cambiar estado', 'error');
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
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <p className="text-sm text-slate-400">
          {filtrados.length} de {turnos.length} turno(s)
        </p>
        <button type="button" className="btn-primary" onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Nuevo turno
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <select
          value={filtroFecha}
          onChange={(e) => setFiltroFecha(e.target.value as FiltroFecha)}
          className="input-field text-sm"
          aria-label="Filtrar por fecha"
        >
          <option value="todos">Todas las fechas</option>
          <option value="hoy">Hoy</option>
          <option value="futuros">Próximos</option>
          <option value="pasados">Pasados</option>
        </select>
        <select
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value as TurnoEstado | 'todos')}
          className="input-field text-sm"
          aria-label="Filtrar por estado"
        >
          <option value="todos">Todos los estados</option>
          {ESTADOS_TURNO.map((e) => (
            <option key={e.value} value={e.value}>
              {e.label}
            </option>
          ))}
        </select>
      </div>

      {filtrados.length === 0 ? (
        <div className="card flex flex-col items-center py-12 text-center">
          <Calendar className="h-10 w-10 text-slate-600" />
          <p className="mt-4 font-medium text-white">Sin turnos</p>
          <p className="mt-1 max-w-sm text-sm text-slate-400">
            Crea el primer turno o ajusta los filtros. Recuerda configurar horarios en cada barbero.
          </p>
        </div>
      ) : (
        <>
          {/* Vista móvil: cards */}
          <div className="space-y-3 md:hidden">
            {filtrados.map((t) => (
              <article
                key={t.id}
                className="rounded-xl border border-white/8 bg-white/[0.02] p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-white">
                      {formatFecha(String(t.fecha))}{' '}
                      <span className="text-slate-400">{formatHora(String(t.hora))}</span>
                    </p>
                    <p className="mt-1 truncate text-sm text-slate-200">{t.cliente?.nombre ?? '—'}</p>
                    <p className="text-xs text-slate-500">{t.cliente?.telefono}</p>
                  </div>
                  <TurnoEstadoBadge estado={t.estado} />
                </div>
                <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <dt className="text-slate-500">Barbero</dt>
                    <dd className="truncate text-slate-300">{t.barbero?.nombre ?? '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Servicio</dt>
                    <dd className="truncate text-slate-300">{t.servicio?.nombre ?? '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Precio</dt>
                    <dd className="text-slate-300">{formatPrecioTurno(t.precio)}</dd>
                  </div>
                </dl>
                <div className="mt-3 flex flex-wrap gap-2 border-t border-white/8 pt-3">
                  {isTurnoActivo(t.estado) && t.estado === 'pendiente' && (
                    <button
                      type="button"
                      className="btn-ghost px-2 py-1.5 text-xs text-emerald-400"
                      disabled={confirmingId === t.id}
                      onClick={() => handleConfirmar(t)}
                    >
                      {confirmingId === t.id ? 'Confirmando...' : 'Confirmar'}
                    </button>
                  )}
                  {isTurnoActivo(t.estado) && t.estado === 'confirmado' && (
                    <>
                      {t.whatsapp_url && (
                        <button
                          type="button"
                          className="btn-ghost px-2 py-1.5 text-xs text-emerald-400"
                          onClick={() => openWhatsAppUrl(t.whatsapp_url!)}
                        >
                          <MessageCircle className="mr-1 inline h-3.5 w-3.5" />
                          WhatsApp cliente
                        </button>
                      )}
                      <button
                        type="button"
                        className="btn-ghost px-2 py-1.5 text-xs text-indigo-400"
                        onClick={() => handleQuickEstado(t, 'completado')}
                      >
                        Completar
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    className="btn-ghost px-2 py-1.5 text-xs"
                    onClick={() => openEdit(t)}
                  >
                    Editar
                  </button>
                  {isTurnoActivo(t.estado) && (
                    <button
                      type="button"
                      className="btn-ghost px-2 py-1.5 text-xs text-red-400"
                      onClick={() => setCancelTarget(t)}
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>

          {/* Vista desktop: tabla */}
          <div className="hidden overflow-x-auto rounded-xl border border-white/8 md:block">
            <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-white/8 bg-white/[0.02] text-slate-400">
                <th className="px-4 py-3 font-medium">Fecha / Hora</th>
                <th className="px-4 py-3 font-medium">Cliente</th>
                <th className="px-4 py-3 font-medium">Barbero</th>
                <th className="px-4 py-3 font-medium">Servicio</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium">Precio</th>
                <th className="px-4 py-3 font-medium text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((t) => (
                <tr key={t.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                  <td className="px-4 py-3 whitespace-nowrap text-white">
                    <span className="font-medium">{formatFecha(String(t.fecha))}</span>
                    <span className="ml-2 text-slate-400">{formatHora(String(t.hora))}</span>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-200">{t.cliente?.nombre ?? '—'}</p>
                    <p className="text-xs text-slate-500">{t.cliente?.telefono}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-300">{t.barbero?.nombre ?? '—'}</td>
                  <td className="px-4 py-3 text-slate-300">{t.servicio?.nombre ?? '—'}</td>
                  <td className="px-4 py-3">
                    <TurnoEstadoBadge estado={t.estado} />
                  </td>
                  <td className="px-4 py-3 text-slate-300">{formatPrecioTurno(t.precio)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      {isTurnoActivo(t.estado) && t.estado === 'pendiente' && (
                        <Tooltip label="Confirmar y abrir WhatsApp">
                          <button
                            type="button"
                            className="btn-ghost p-2 text-emerald-400"
                            disabled={confirmingId === t.id}
                            onClick={() => handleConfirmar(t)}
                            aria-label="Confirmar turno"
                          >
                            {confirmingId === t.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Check className="h-4 w-4" />
                            )}
                          </button>
                        </Tooltip>
                      )}
                      {isTurnoActivo(t.estado) && t.estado === 'confirmado' && (
                        <>
                          {t.whatsapp_url && (
                            <Tooltip label={`WhatsApp al cliente (${t.cliente?.telefono ?? ''})`}>
                              <button
                                type="button"
                                className="btn-ghost p-2 text-emerald-400"
                                onClick={() => openWhatsAppUrl(t.whatsapp_url!)}
                                aria-label="Enviar WhatsApp al cliente"
                              >
                                <MessageCircle className="h-4 w-4" />
                              </button>
                            </Tooltip>
                          )}
                          <Tooltip label="Marcar completado">
                            <button
                              type="button"
                              className="btn-ghost p-2 text-indigo-400"
                              onClick={() => handleQuickEstado(t, 'completado')}
                              aria-label="Completar turno"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                          </Tooltip>
                        </>
                      )}
                      <Tooltip label="Editar">
                        <button
                          type="button"
                          className="btn-ghost p-2"
                          onClick={() => openEdit(t)}
                          aria-label="Editar turno"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                      </Tooltip>
                      {isTurnoActivo(t.estado) && (
                        <Tooltip label="Cancelar">
                          <button
                            type="button"
                            className="btn-ghost p-2 text-red-400"
                            onClick={() => setCancelTarget(t)}
                            aria-label="Cancelar turno"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </Tooltip>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </>
      )}

      <TurnoFormModal
        open={formOpen}
        mode={formMode}
        turno={selected}
        clientes={clientes}
        barberos={barberos}
        servicios={servicios}
        onClose={() => setFormOpen(false)}
        onSuccess={handleFormSuccess}
        onError={(m) => onToast?.(m, 'error')}
      />

      <Modal
        open={!!cancelTarget}
        onClose={() => !actionLoading && setCancelTarget(null)}
        title="Cancelar turno"
        footer={
          <>
            <button
              type="button"
              className="btn-ghost"
              onClick={() => setCancelTarget(null)}
              disabled={actionLoading}
            >
              Volver
            </button>
            <button
              type="button"
              className="btn-primary bg-red-600 hover:bg-red-500"
              onClick={handleCancel}
              disabled={actionLoading}
            >
              {actionLoading ? 'Cancelando...' : 'Sí, cancelar'}
            </button>
          </>
        }
      >
        <div className="flex items-start gap-3 text-slate-300">
          <XCircle className="h-5 w-5 shrink-0 text-red-400" />
          <p>
            ¿Cancelar la cita de <strong>{cancelTarget?.cliente?.nombre}</strong> el{' '}
            {cancelTarget && formatFecha(String(cancelTarget.fecha))} a las{' '}
            {cancelTarget && formatHora(String(cancelTarget.hora))}?
          </p>
        </div>
      </Modal>
    </div>
  );
}

function sortTurnos(a: Turno, b: Turno) {
  const fa = a.fecha?.slice(0, 10) ?? '';
  const fb = b.fecha?.slice(0, 10) ?? '';
  if (fa !== fb) return fa.localeCompare(fb);
  return formatHora(String(a.hora)).localeCompare(formatHora(String(b.hora)));
}
