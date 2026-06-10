import { useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Calendar, CheckCircle2, Loader2, Scissors } from 'lucide-react';
import { api, type CitaPublica } from '../services/api';
import { QrCodeDisplay } from '../components/ui/QrCodeDisplay';
import { TurnoEstadoBadge } from '../components/turnos/TurnoEstadoBadge';
import type { TurnoEstado } from '../services/api';
import { formatFecha, formatPrecioTurno } from '../utils/turnos';
import { buildCitaPublicUrl, withCurrentOrigin } from '../utils/publicAppUrl';

export function CitaPublicPage() {
  const { uuid } = useParams<{ uuid: string }>();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const esBarbero = isAuthenticated && user?.rol === 'barbero';
  const [cita, setCita] = useState<CitaPublica | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [qrDownloadMsg, setQrDownloadMsg] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (authLoading || esBarbero || !uuid) return;
    api
      .getCitaPublica(uuid)
      .then(setCita)
      .catch((err) => setError(err instanceof Error ? err.message : 'Cita no encontrada'))
      .finally(() => setLoading(false));
  }, [uuid, authLoading, esBarbero]);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
      </div>
    );
  }

  if (esBarbero && uuid) {
    return <Navigate to={`/dashboard/validar-cita/${uuid}`} replace />;
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
      </div>
    );
  }

  if (error || !cita) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-4 text-center">
        <p className="text-red-300">{error || 'No encontrada'}</p>
        <Link to="/" className="btn-primary mt-6">
          Inicio
        </Link>
      </div>
    );
  }

  const puedeMostrarQr = cita.estado !== 'cancelado' && Boolean(cita.uuid);
  const qrValue = cita.qr_payload
    ? withCurrentOrigin(cita.qr_payload)
    : buildCitaPublicUrl(cita.uuid);

  return (
    <div
      className="min-h-dvh bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 px-4 py-8 sm:py-10"
      style={{ paddingBottom: 'max(2.5rem, env(safe-area-inset-bottom))' }}
    >
      <div className="mx-auto w-full max-w-md">
        <div className="mb-6 text-center">
          <Scissors className="mx-auto h-8 w-8 text-indigo-400" />
          <h1 className="mt-3 break-words text-xl font-bold text-white sm:text-2xl">{cita.barberia}</h1>
          <p className="mt-1 text-slate-400">Tu cita agendada</p>
        </div>

        <div className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">Estado</span>
            <TurnoEstadoBadge estado={cita.estado as TurnoEstado} />
          </div>

          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-2">
              <dt className="shrink-0 text-slate-500">Servicio</dt>
              <dd className="break-words text-right font-medium text-white">{cita.servicio}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-slate-500">Barbero</dt>
              <dd className="text-slate-200">{cita.barbero}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-slate-500">Cliente</dt>
              <dd className="text-slate-200">{cita.cliente}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-slate-500">Fecha y hora</dt>
              <dd className="text-slate-200">
                {formatFecha(cita.fecha)} · {cita.hora}
              </dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-slate-500">Precio</dt>
              <dd className="text-indigo-300">{formatPrecioTurno(cita.precio)}</dd>
            </div>
          </dl>

          {cita.estado === 'pendiente' && (
            <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
              Esperando confirmación del barbero. Recibirás un mensaje por WhatsApp cuando confirme.
            </p>
          )}

          {puedeMostrarQr && cita.qr_payload && (
            <div className="flex flex-col items-center border-t border-white/10 pt-6">
              <p className="mb-4 text-center text-sm text-slate-400">
                Presenta este código QR en la barbería
              </p>
              <QrCodeDisplay
                value={qrValue}
                size={200}
                showDownload
                downloadFileName={`cita-${cita.uuid}`}
                onDownloadMessage={(message, type) => setQrDownloadMsg({ message, type })}
              />
              {qrDownloadMsg?.type === 'error' && (
                <p className="mt-3 text-center text-xs text-red-300">{qrDownloadMsg.message}</p>
              )}
              {cita.estado === 'completado' && (
                <p className="mt-4 flex items-center gap-2 text-sm text-emerald-300">
                  <CheckCircle2 className="h-4 w-4" />
                  Servicio validado
                </p>
              )}
            </div>
          )}
        </div>

        <p className="mt-6 flex items-center justify-center gap-2 text-center text-xs text-slate-500">
          <Calendar className="h-3 w-3" />
          Barber Nova
        </p>
      </div>
    </div>
  );
}
