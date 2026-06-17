import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Check,
  ExternalLink,
  Loader2,
  MessageCircle,
  QrCode,
  XCircle,
} from 'lucide-react';
import { api, type BarberoTurno } from '../../services/api';
import { Toast } from '../../components/ui/Toast';
import { usePageToast } from '../../hooks/usePageToast';
import { TurnoEstadoBadge } from '../../components/turnos/TurnoEstadoBadge';
import {
  formatFecha,
  formatHora,
  formatPrecioTurno,
  isTurnoActivo,
  MOTIVOS_RECHAZO_PAGO,
  requiereValidacionPago,
} from '../../utils/turnos';
import { buildWhatsAppUrl, enviarConfirmacionWhatsApp, openWhatsAppUrl } from '../../utils/whatsapp';
import { mediaUrl } from '../../utils/mediaUrl';

export function BarberoMisCitasPage() {
  const [turnos, setTurnos] = useState<BarberoTurno[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<number | null>(null);
  const [rechazoId, setRechazoId] = useState<number | null>(null);
  const [motivoRechazo, setMotivoRechazo] = useState(MOTIVOS_RECHAZO_PAGO[0].value);
  const { toast, showToast, hideToast } = usePageToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getBarberoMisTurnos();
      setTurnos(res.turnos);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error al cargar citas', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    load();
  }, [load]);

  const confirmar = async (turno: BarberoTurno) => {
    setActionId(turno.id);
    try {
      const res = await api.confirmarTurnoBarbero(turno.id);
      const clienteTelefono = res.cliente_telefono ?? turno.telefono;
      const whatsappUrl =
        res.whatsapp_url ??
        (clienteTelefono && res.whatsapp_mensaje
          ? buildWhatsAppUrl(clienteTelefono, res.whatsapp_mensaje)
          : null);
      const modo = await enviarConfirmacionWhatsApp({
        whatsappUrl: res.whatsapp_url ?? whatsappUrl,
        whatsappMensaje: res.whatsapp_mensaje,
        clienteTelefono,
        citaTarjetaUrl: res.cita_tarjeta_url ?? res.qr_url,
      });
      setTurnos((prev) =>
        prev.map((t) =>
          t.id === turno.id
            ? {
                ...t,
                estado: 'confirmado' as const,
                cita_url: res.cita_url,
                whatsapp_url: whatsappUrl,
              }
            : t,
        ),
      );
      showToast(
        modo === 'share'
          ? 'Cita confirmada. Comparte la tarjeta QR con el cliente en WhatsApp.'
          : modo === 'wame'
            ? `Cita confirmada. WhatsApp abierto — adjunta la tarjeta descargada${clienteTelefono ? ` (${clienteTelefono})` : ''}.`
            : res.message,
        'success',
      );
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error al confirmar', 'error');
    } finally {
      setActionId(null);
    }
  };

  const aprobarPago = async (turno: BarberoTurno) => {
    setActionId(turno.id);
    try {
      const res = await api.aprobarPagoBarbero(turno.id);
      const clienteTelefono = res.cliente_telefono ?? turno.telefono;
      const modo = await enviarConfirmacionWhatsApp({
        whatsappUrl: res.whatsapp_url,
        whatsappMensaje: res.whatsapp_mensaje,
        clienteTelefono,
        citaTarjetaUrl: res.cita_tarjeta_url ?? res.qr_url,
      });
      setTurnos((prev) =>
        prev.map((t) =>
          t.id === turno.id
            ? { ...t, estado: 'confirmado' as const, cita_url: res.cita_url, whatsapp_url: res.whatsapp_url }
            : t,
        ),
      );
      showToast(
        modo === 'wame' || modo === 'share'
          ? 'Pago aprobado y cita confirmada. WhatsApp listo para el cliente.'
          : res.message,
        'success',
      );
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error al aprobar pago', 'error');
    } finally {
      setActionId(null);
    }
  };

  const rechazarPago = async (turno: BarberoTurno) => {
    setActionId(turno.id);
    try {
      const res = await api.rechazarPagoBarbero(turno.id, motivoRechazo);
      setTurnos((prev) =>
        prev.map((t) =>
          t.id === turno.id
            ? { ...t, estado: res.data.estado as BarberoTurno['estado'], pago_motivo_rechazo: res.data.pago_motivo_rechazo }
            : t,
        ),
      );
      setRechazoId(null);
      showToast(res.message, 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error al rechazar pago', 'error');
    } finally {
      setActionId(null);
    }
  };

  const porValidarPago = turnos.filter((t) => requiereValidacionPago(t.estado));
  const pendientes = turnos.filter((t) => t.estado === 'pendiente');
  const proximas = turnos.filter((t) => t.estado === 'confirmado');

  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Mis citas</h1>
          <p className="text-slate-400">Valida pagos, confirma reservas y escanea QR</p>
        </div>
        <Link to="/dashboard/validar-qr" className="btn-primary">
          <QrCode className="h-4 w-4" />
          Escanear QR
        </Link>
      </div>

      {porValidarPago.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-orange-400">
            Validar comprobantes ({porValidarPago.length})
          </h2>
          <div className="grid gap-3">
            {porValidarPago.map((t) => (
              <CitaCard
                key={t.id}
                turno={t}
                action={
                  <div className="flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap">
                    <button
                      type="button"
                      className="btn-primary text-sm"
                      disabled={actionId === t.id}
                      onClick={() => aprobarPago(t)}
                    >
                      {actionId === t.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                      Aprobar pago y confirmar
                    </button>
                    {rechazoId === t.id ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <select
                          className="input-field text-sm"
                          value={motivoRechazo}
                          onChange={(e) => setMotivoRechazo(e.target.value)}
                        >
                          {MOTIVOS_RECHAZO_PAGO.map((m) => (
                            <option key={m.value} value={m.value}>
                              {m.label}
                            </option>
                          ))}
                        </select>
                        <button type="button" className="btn-ghost text-sm text-red-400" onClick={() => rechazarPago(t)}>
                          Confirmar rechazo
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="btn-ghost text-sm text-red-400"
                        onClick={() => setRechazoId(t.id)}
                      >
                        <XCircle className="h-4 w-4" />
                        Rechazar pago
                      </button>
                    )}
                  </div>
                }
              />
            ))}
          </div>
        </section>
      )}

      {pendientes.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-amber-400">
            Pendientes de confirmar ({pendientes.length})
          </h2>
          <div className="grid gap-3">
            {pendientes.map((t) => (
              <CitaCard
                key={t.id}
                turno={t}
                action={
                  <button
                    type="button"
                    className="btn-primary text-sm"
                    disabled={actionId === t.id}
                    onClick={() => confirmar(t)}
                  >
                    {actionId === t.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4" />
                    )}
                    Confirmar y abrir WhatsApp
                  </button>
                }
              />
            ))}
          </div>
        </section>
      )}

      {proximas.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-indigo-400">
            Confirmadas ({proximas.length})
          </h2>
          <div className="grid gap-3">
            {proximas.map((t) => (
              <CitaCard key={t.id} turno={t} />
            ))}
          </div>
        </section>
      )}

      {turnos.length === 0 && (
        <div className="card py-12 text-center">
          <Calendar className="mx-auto h-10 w-10 text-slate-600" />
          <p className="mt-4 text-white">Sin citas por ahora</p>
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
    </div>
  );
}

function CitaCard({
  turno,
  action,
}: {
  turno: BarberoTurno;
  action?: React.ReactNode;
}) {
  const comprobanteSrc = turno.comprobante_url ? mediaUrl(turno.comprobante_url) : null;

  return (
    <article className="rounded-xl border border-white/8 bg-white/[0.02] p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-white">{turno.cliente}</p>
          <p className="text-sm text-slate-400">{turno.telefono}</p>
        </div>
        <TurnoEstadoBadge estado={turno.estado} />
      </div>
      <dl className="mt-3 grid gap-1 text-sm sm:grid-cols-2">
        <div>
          <span className="text-slate-500">Servicio: </span>
          <span className="text-slate-200">{turno.servicio}</span>
        </div>
        <div>
          <span className="text-slate-500">Fecha: </span>
          <span className="text-slate-200">
            {formatFecha(turno.fecha)} {formatHora(turno.hora)}
          </span>
        </div>
        <div>
          <span className="text-slate-500">Precio: </span>
          <span className="text-indigo-300">{formatPrecioTurno(turno.precio)}</span>
        </div>
        {turno.pago_monto_esperado != null && turno.pago_monto_esperado > 0 && (
          <div>
            <span className="text-slate-500">Monto pagado: </span>
            <span className="text-amber-200">{formatPrecioTurno(turno.pago_monto_esperado)}</span>
          </div>
        )}
      </dl>
      {comprobanteSrc && (
        <img
          src={comprobanteSrc}
          alt="Comprobante"
          className="mt-3 max-h-40 rounded-lg border border-white/10 object-contain"
        />
      )}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {action}
        {isTurnoActivo(turno.estado) && turno.estado !== 'pendiente' && turno.estado !== 'pendiente_validacion' && (
          <>
            {turno.whatsapp_url && (
              <button
                type="button"
                className="btn-primary text-sm"
                onClick={() => openWhatsAppUrl(turno.whatsapp_url!)}
              >
                <MessageCircle className="h-4 w-4" />
                Enviar por WhatsApp
              </button>
            )}
            <a
              href={turno.cita_url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-ghost text-sm"
            >
              <ExternalLink className="h-4 w-4" />
              Ver QR cliente
            </a>
          </>
        )}
        {turno.estado === 'pendiente' && (
          <span className="flex items-center gap-1 text-xs text-slate-500">
            <MessageCircle className="h-3 w-3" />
            Al confirmar se abre WhatsApp con el mensaje al cliente
          </span>
        )}
      </div>
    </article>
  );
}
