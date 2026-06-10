import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Calendar,
  CalendarCheck,
  Check,
  Clock,
  Loader2,
  Scissors,
  User,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { QrCodeDisplay } from '../ui/QrCodeDisplay';
import { MediaImage } from '../ui/MediaImage';
import { api, type BarberoPublico, type ServicioPublico } from '../../services/api';
import { formatPrecio } from '../../utils/format';
import { todayIsoDate } from '../../utils/horarios';
import { formatFecha } from '../../utils/turnos';
import { buildCitaPublicUrl, withCurrentOrigin } from '../../utils/publicAppUrl';
import { filtrarSlotsLibres, generarSlotsHorario } from '../../utils/slots';

type ReservaSectionProps = {
  slug: string;
  barberiaNombre: string;
  whatsapp: string;
  barberos: BarberoPublico[];
  servicios: ServicioPublico[];
};

type Paso = 'servicio' | 'barbero' | 'datos' | 'confirmacion';

const PASOS: { id: Paso; label: string; num: number }[] = [
  { id: 'servicio', label: 'Servicio', num: 1 },
  { id: 'barbero', label: 'Barbero y hora', num: 2 },
  { id: 'datos', label: 'Tus datos', num: 3 },
  { id: 'confirmacion', label: 'Confirmación', num: 4 },
];

type ReservaOk = {
  uuid: string;
  cita_url: string;
  qr_payload: string;
  servicio: string;
  fecha: string;
  hora: string;
  barbero: string;
  cliente: string;
};

export function ReservaSection({
  slug,
  barberiaNombre,
  barberos,
  servicios,
}: Pick<ReservaSectionProps, 'slug' | 'barberiaNombre' | 'barberos' | 'servicios'>) {
  const [paso, setPaso] = useState<Paso>('servicio');
  const [slideKey, setSlideKey] = useState(0);

  const [servicioUuid, setServicioUuid] = useState('');
  const [barberoUuid, setBarberoUuid] = useState('');
  const [fecha, setFecha] = useState('');
  const [hora, setHora] = useState('');
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [registrarme, setRegistrarme] = useState(false);

  const [loadingDisp, setLoadingDisp] = useState(false);
  const [loadingReserva, setLoadingReserva] = useState(false);
  const [disponibilidad, setDisponibilidad] = useState<{
    disponible: boolean;
    motivo?: string;
    hora_inicio?: string;
    hora_fin?: string;
    horas_ocupadas?: string[];
  } | null>(null);
  const [reservaOk, setReservaOk] = useState<ReservaOk | null>(null);
  const [error, setError] = useState('');
  const [qrDownloadMsg, setQrDownloadMsg] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const servicioSel = servicios.find((s) => s.uuid === servicioUuid);
  const barberoSel = barberos.find((b) => b.uuid === barberoUuid);

  const pasoActual = PASOS.find((p) => p.id === paso)?.num ?? 1;

  const slots = useMemo(() => {
    if (!disponibilidad?.disponible || !disponibilidad.hora_inicio || !disponibilidad.hora_fin) {
      return [];
    }
    const todos = generarSlotsHorario(
      disponibilidad.hora_inicio,
      disponibilidad.hora_fin,
      30,
    );
    return filtrarSlotsLibres(todos, disponibilidad.horas_ocupadas ?? []);
  }, [disponibilidad]);

  const irAPaso = (nuevo: Paso) => {
    setSlideKey((k) => k + 1);
    setPaso(nuevo);
    setError('');
  };

  const seleccionarServicio = (uuid: string) => {
    setServicioUuid(uuid);
    setBarberoUuid('');
    setFecha('');
    setHora('');
    setDisponibilidad(null);
    irAPaso('barbero');
  };

  const seleccionarBarbero = (uuid: string) => {
    setBarberoUuid(uuid);
    setFecha('');
    setHora('');
    setDisponibilidad(null);
  };

  const consultarDisponibilidad = useCallback(async () => {
    if (!barberoUuid || !fecha) return;

    setLoadingDisp(true);
    setError('');
    setDisponibilidad(null);
    setHora('');

    try {
      const res = await api.getDisponibilidadBySlug(slug, barberoUuid, fecha);
      setDisponibilidad(res);
      if (!res.disponible) {
        setError(res.motivo || 'No hay disponibilidad ese día');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo consultar disponibilidad');
    } finally {
      setLoadingDisp(false);
    }
  }, [slug, barberoUuid, fecha]);

  useEffect(() => {
    if (paso === 'barbero' && barberoUuid && fecha) {
      consultarDisponibilidad();
    }
  }, [paso, barberoUuid, fecha, consultarDisponibilidad]);

  const puedeIrADatos = Boolean(barberoUuid && fecha && hora && disponibilidad?.disponible);

  const reservar = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!nombre.trim() || !telefono.trim()) {
      setError('Nombre y teléfono son obligatorios');
      return;
    }

    setLoadingReserva(true);
    try {
      const res = await api.reservarTurnoBySlug(slug, {
        barbero_uuid: barberoUuid,
        servicio_uuid: servicioUuid,
        fecha,
        hora,
        nombre: nombre.trim(),
        telefono: telefono.trim(),
        email: email.trim() || undefined,
        registrarme,
      });
      setReservaOk({
        uuid: res.data.uuid,
        cita_url: withCurrentOrigin(res.data.cita_url),
        qr_payload: buildCitaPublicUrl(res.data.uuid),
        servicio: res.data.servicio,
        fecha: res.data.fecha,
        hora: res.data.hora,
        barbero: res.data.barbero,
        cliente: nombre.trim(),
      });
      irAPaso('confirmacion');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo reservar');
    } finally {
      setLoadingReserva(false);
    }
  };

  const nuevaReserva = () => {
    setPaso('servicio');
    setSlideKey(0);
    setServicioUuid('');
    setBarberoUuid('');
    setFecha('');
    setHora('');
    setNombre('');
    setTelefono('');
    setEmail('');
    setRegistrarme(false);
    setDisponibilidad(null);
    setReservaOk(null);
    setError('');
  };

  if (barberos.length === 0 || servicios.length === 0) return null;

  return (
    <section
      id="reservar"
      className="relative overflow-hidden border-y border-white/5 bg-gradient-to-b from-[var(--landing-secondary)]/40 via-[#0a0c10] to-[#0a0c10] py-20 sm:py-28 lg:py-32"
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          background:
            'radial-gradient(ellipse 70% 50% at 50% 0%, var(--landing-primary-glow), transparent 70%)',
        }}
      />
      <div className="relative mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 text-center">
          <span className="text-sm font-semibold uppercase tracking-widest text-[var(--landing-primary)]">
            Agenda
          </span>
          <h2 className="mt-3 text-3xl font-bold text-white sm:text-4xl lg:text-5xl">Reserva tu cita</h2>
          <p className="mx-auto mt-3 max-w-lg text-slate-400">
            Avanza paso a paso: elige servicio, barbero, horario y confirma en segundos.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-[220px_1fr] lg:gap-10">
          {/* Indicador de pasos — lateral desktop */}
          <aside className="hidden lg:block">
            <ol className="sticky top-24 space-y-1">
              {PASOS.map((p) => {
                const activo = p.num === pasoActual;
                const completado = p.num < pasoActual;
                return (
                  <li
                    key={p.id}
                    className={`flex items-center gap-3 rounded-xl px-3 py-3 transition ${
                      activo
                        ? 'bg-[var(--landing-primary)]/15 text-white'
                        : completado
                          ? 'text-emerald-300'
                          : 'text-slate-500'
                    }`}
                  >
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                        activo
                          ? 'bg-[var(--landing-primary)] text-white'
                          : completado
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-white/5 text-slate-500'
                      }`}
                    >
                      {completado ? <Check className="h-4 w-4" /> : p.num}
                    </span>
                    <span className="text-sm font-medium">{p.label}</span>
                  </li>
                );
              })}
            </ol>
          </aside>

          {/* Progreso móvil */}
          <div className="space-y-2 lg:hidden">
            <div className="flex items-center justify-center gap-1.5 sm:gap-2">
              {PASOS.map((p) => (
                <div
                  key={p.id}
                  className={`h-1.5 flex-1 rounded-full transition ${
                    p.num <= pasoActual ? 'bg-[var(--landing-primary)]' : 'bg-white/10'
                  }`}
                />
              ))}
            </div>
            <p className="text-center text-xs text-slate-400">
              Paso {pasoActual} de {PASOS.length}:{' '}
              <span className="font-medium text-slate-300">
                {PASOS.find((p) => p.id === paso)?.label}
              </span>
            </p>
          </div>

          {/* Panel dinámico */}
          <div className="min-h-0 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] p-4 shadow-2xl shadow-black/30 sm:min-h-[380px] sm:rounded-3xl sm:p-6 md:p-8 lg:min-h-[440px] lg:p-10">
            <div key={slideKey} className="reserva-slide-in">
              {paso === 'servicio' && (
                <div className="space-y-5">
                  <div>
                    <h3 className="text-xl font-bold text-white">¿Qué servicio necesitas?</h3>
                    <p className="mt-1 text-sm text-slate-400">Toca una tarjeta para continuar</p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {servicios.map((s) => (
                      <button
                        key={s.uuid}
                        type="button"
                        onClick={() => seleccionarServicio(s.uuid)}
                        className={`group flex flex-col rounded-2xl border p-4 text-left transition hover:scale-[1.02] hover:border-[var(--landing-primary)]/50 hover:bg-white/[0.05] ${
                          servicioUuid === s.uuid
                            ? 'border-[var(--landing-primary)] bg-[var(--landing-primary)]/10 ring-2 ring-[var(--landing-primary)]/30'
                            : 'border-white/10 bg-white/[0.02]'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <Scissors className="h-5 w-5 shrink-0 text-[var(--landing-primary)]" />
                          <span className="text-lg font-bold text-[var(--landing-primary)]">
                            {formatPrecio(s.precio)}
                          </span>
                        </div>
                        <p className="mt-3 font-semibold text-white">{s.nombre}</p>
                        <p className="mt-1 flex items-center gap-1 text-xs text-slate-400">
                          <Clock className="h-3 w-3" />
                          {s.duracion} min
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {paso === 'barbero' && (
                <div className="space-y-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <h3 className="text-lg font-bold text-white sm:text-xl">Elige barbero y horario</h3>
                      {servicioSel && (
                        <p className="mt-1 break-words text-sm text-slate-400">
                          Servicio: <span className="text-slate-200">{servicioSel.nombre}</span>
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => irAPaso('servicio')}
                      className="btn-ghost w-full shrink-0 px-3 py-2 text-sm sm:w-auto"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Atrás
                    </button>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    {barberos.map((b) => (
                      <button
                        key={b.uuid}
                        type="button"
                        onClick={() => seleccionarBarbero(b.uuid)}
                        className={`flex items-center gap-3 rounded-2xl border p-3 text-left transition ${
                          barberoUuid === b.uuid
                            ? 'border-[var(--landing-primary)] bg-[var(--landing-primary)]/10 ring-2 ring-[var(--landing-primary)]/30'
                            : 'border-white/10 bg-white/[0.02] hover:border-white/20'
                        }`}
                      >
                        <MediaImage
                          src={b.foto}
                          alt={b.nombre}
                          className="h-14 w-14 shrink-0 rounded-xl object-cover"
                          wrapperClassName="h-14 w-14 shrink-0"
                          fallbackIcon="user"
                        />
                        <div className="min-w-0">
                          <p className="font-semibold text-white">{b.nombre}</p>
                          {b.especialidad && (
                            <p className="truncate text-xs text-slate-400">{b.especialidad}</p>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>

                  {barberoUuid && (
                    <div className="space-y-4 rounded-xl border border-white/8 bg-white/[0.02] p-4">
                      <div className="flex items-center gap-2 text-sm font-medium text-slate-300">
                        <Calendar className="h-4 w-4 text-[var(--landing-primary)]" />
                        Fecha y hora disponible
                      </div>
                      <input
                        type="date"
                        min={todayIsoDate()}
                        value={fecha}
                        onChange={(e) => setFecha(e.target.value)}
                        className="input-field w-full sm:max-w-xs"
                      />

                      {loadingDisp && (
                        <div className="flex items-center gap-2 text-sm text-slate-400">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Consultando horarios...
                        </div>
                      )}

                      {!loadingDisp && fecha && disponibilidad?.disponible && slots.length > 0 && (
                        <div className="grid grid-cols-2 gap-2 min-[400px]:grid-cols-3 sm:grid-cols-4 md:grid-cols-5">
                          {slots.map((slot) => (
                            <button
                              key={slot}
                              type="button"
                              onClick={() => setHora(slot)}
                              className={`rounded-lg border px-2 py-2.5 text-sm font-medium transition ${
                                hora === slot
                                  ? 'border-[var(--landing-primary)] bg-[var(--landing-primary)]/20 text-white'
                                  : 'border-white/10 text-slate-300 hover:border-white/25'
                              }`}
                            >
                              {slot}
                            </button>
                          ))}
                        </div>
                      )}

                      {!loadingDisp && fecha && disponibilidad?.disponible && slots.length === 0 && (
                        <p className="text-sm text-amber-200">No quedan horarios libres ese día.</p>
                      )}
                    </div>
                  )}

                  {error && (
                    <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                      {error}
                    </p>
                  )}

                  <button
                    type="button"
                    disabled={!puedeIrADatos}
                    onClick={() => irAPaso('datos')}
                    className="btn-primary w-full justify-center sm:w-auto"
                  >
                    Continuar
                  </button>
                </div>
              )}

              {paso === 'datos' && (
                <form onSubmit={reservar} className="space-y-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <h3 className="text-lg font-bold text-white sm:text-xl">Tus datos</h3>
                      <p className="mt-1 break-words text-sm text-slate-400">
                        {servicioSel?.nombre} · {barberoSel?.nombre} · {formatFecha(fecha)} {hora}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => irAPaso('barbero')}
                      className="btn-ghost w-full shrink-0 px-3 py-2 text-sm sm:w-auto"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Atrás
                    </button>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <label htmlFor="reserva-nombre" className="text-sm font-medium text-slate-300">
                        Nombre
                      </label>
                      <input
                        id="reserva-nombre"
                        value={nombre}
                        onChange={(e) => setNombre(e.target.value)}
                        className="input-field w-full"
                        required
                        maxLength={100}
                        placeholder="Tu nombre"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label htmlFor="reserva-telefono" className="text-sm font-medium text-slate-300">
                        Teléfono
                      </label>
                      <input
                        id="reserva-telefono"
                        type="tel"
                        value={telefono}
                        onChange={(e) => setTelefono(e.target.value)}
                        className="input-field w-full"
                        required
                        maxLength={50}
                        placeholder="+57 300 ..."
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="reserva-email" className="text-sm font-medium text-slate-300">
                      Email (opcional)
                    </label>
                    <input
                      id="reserva-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="input-field w-full"
                      maxLength={100}
                    />
                  </div>

                  <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-3 py-3">
                    <input
                      type="checkbox"
                      checked={registrarme}
                      onChange={(e) => setRegistrarme(e.target.checked)}
                      className="mt-1 h-4 w-4 rounded border-white/20 accent-[var(--landing-primary)]"
                    />
                    <span className="text-sm text-slate-300">
                      <strong className="text-white">Registrarme</strong> para futuras citas en esta
                      barbería.
                    </span>
                  </label>

                  {error && (
                    <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                      {error}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={loadingReserva}
                    className="btn-primary w-full justify-center"
                  >
                    {loadingReserva ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CalendarCheck className="h-4 w-4" />
                    )}
                    {loadingReserva ? 'Agendando...' : 'Agendar cita'}
                  </button>
                </form>
              )}

              {paso === 'confirmacion' && reservaOk && (
                <div className="mx-auto w-full max-w-sm space-y-6">
                  <div className="text-center">
                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                      <Check className="h-6 w-6" />
                    </div>
                    <h3 className="text-xl font-bold text-white">¡Cita agendada!</h3>
                    <p className="mt-2 text-sm text-slate-400">
                      El barbero confirmará y te contactará por WhatsApp con tu QR.
                    </p>
                  </div>

                  {/* Ticket estilo wireframe */}
                  <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0c0f14] shadow-2xl">
                    <div className="border-b border-white/8 px-5 py-4 text-center">
                      <p className="text-xs uppercase tracking-widest text-slate-500">Barber Nova</p>
                      <p className="mt-1 text-lg font-bold text-white">{barberiaNombre}</p>
                    </div>

                    <dl className="space-y-3 px-5 py-4 text-sm">
                      {[
                        ['Cliente', reservaOk.cliente],
                        ['Fecha', formatFecha(reservaOk.fecha)],
                        ['Hora', reservaOk.hora],
                        ['Servicio', reservaOk.servicio],
                        ['Barbero', reservaOk.barbero],
                      ].map(([label, value]) => (
                        <div key={label} className="flex justify-between gap-3">
                          <dt className="shrink-0 text-xs font-semibold uppercase tracking-wide text-slate-500">
                            {label}
                          </dt>
                          <dd className="break-words text-right font-medium text-white">{value}</dd>
                        </div>
                      ))}
                    </dl>

                    <div className="border-t border-white/8 bg-white/[0.02] px-5 py-6">
                      <p className="mb-4 text-center text-xs text-slate-400">
                        Presenta este código QR al barbero
                      </p>
                      <div className="flex w-full justify-center overflow-hidden">
                        <QrCodeDisplay
                          value={reservaOk.qr_payload}
                          size={200}
                          showDownload
                          downloadFileName={`cita-${reservaOk.uuid}`}
                          onDownloadMessage={(message, type) => setQrDownloadMsg({ message, type })}
                        />
                      </div>
                      {qrDownloadMsg?.type === 'error' && (
                        <p className="mt-3 text-center text-xs text-red-300">{qrDownloadMsg.message}</p>
                      )}
                      <Link
                        to={`/cita/${reservaOk.uuid}`}
                        className="mt-4 flex items-center justify-center gap-1 text-xs font-medium text-[var(--landing-primary)] hover:underline"
                      >
                        <User className="h-3 w-3" />
                        Ver mi cita en línea
                      </Link>
                    </div>
                  </div>

                  <button type="button" onClick={nuevaReserva} className="btn-ghost w-full justify-center">
                    Reservar otra cita
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
