import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  AlertTriangle,
  Camera,
  Check,
  CheckCircle2,
  ImageIcon,
  Loader2,
  QrCode,
  ScanLine,
  X,
} from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { api, type CitaPublica, type QrAccion } from '../../services/api';
import { Toast } from '../../components/ui/Toast';
import { TurnoEstadoBadge } from '../../components/turnos/TurnoEstadoBadge';
import { usePageToast } from '../../hooks/usePageToast';
import { extraerUuidTurno, prepararCodigoParaApi } from '../../utils/qrTurno';
import { formatFecha, formatPrecioTurno } from '../../utils/turnos';
import { enviarConfirmacionWhatsApp } from '../../utils/whatsapp';

const SCANNER_ID = 'barber-qr-scanner';
const FILE_READER_ID = 'barber-qr-file-reader';

const ACCION_LABELS: Record<QrAccion, { label: string; className: string; icon: typeof Check }> = {
  confirmar: { label: 'Confirmar cita', className: 'btn-primary', icon: Check },
  completar: { label: 'Completar servicio', className: 'btn-primary', icon: CheckCircle2 },
  cancelar: { label: 'No es válida / cancelar', className: 'btn-ghost text-red-300', icon: X },
};

export function ValidarQrPage() {
  const { uuid: uuidParam } = useParams<{ uuid?: string }>();
  const enlaceDirecto = Boolean(uuidParam);
  const [scanning, setScanning] = useState(false);
  const [escaneandoFoto, setEscaneandoFoto] = useState(false);
  const [manualCodigo, setManualCodigo] = useState('');
  const [codigoActivo, setCodigoActivo] = useState('');
  const [consultando, setConsultando] = useState(false);
  const [aplicando, setAplicando] = useState<QrAccion | null>(null);
  const [preview, setPreview] = useState<CitaPublica | null>(null);
  const [esMio, setEsMio] = useState(true);
  const [acciones, setAcciones] = useState<QrAccion[]>([]);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const procesandoRef = useRef(false);
  const autoStartedRef = useRef(false);
  const fotoInputRef = useRef<HTMLInputElement>(null);
  const galeriaInputRef = useRef<HTMLInputElement>(null);
  const { toast, showToast, hideToast } = usePageToast();

  const contextoSeguro = typeof window !== 'undefined' && window.isSecureContext;
  const ocupado = consultando || aplicando !== null;

  const detenerScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch {
        /* ignore */
      }
      scannerRef.current = null;
    }
    setScanning(false);
  }, []);

  const limpiarPreview = () => {
    setPreview(null);
    setCodigoActivo('');
    setAcciones([]);
    setEsMio(true);
  };

  const consultar = useCallback(
    async (codigo: string) => {
      if (procesandoRef.current) return;

      const preparado = prepararCodigoParaApi(codigo);
      if (!preparado) {
        showToast('Código vacío', 'error');
        return;
      }

      if (!extraerUuidTurno(preparado)) {
        showToast('El código no contiene un identificador de cita válido', 'error');
        return;
      }

      procesandoRef.current = true;
      setConsultando(true);
      limpiarPreview();

      try {
        const res = await api.consultarTurnoQr(preparado);
        setCodigoActivo(preparado);
        setPreview(res.data);
        setEsMio(res.es_mio);
        setAcciones(res.acciones);
        showToast(res.message, res.es_mio ? 'success' : 'error');
        await detenerScanner();
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Código no encontrado', 'error');
      } finally {
        setConsultando(false);
        procesandoRef.current = false;
      }
    },
    [detenerScanner, showToast],
  );

  const aplicarAccion = async (accion: QrAccion) => {
    if (!codigoActivo || procesandoRef.current) return;

    procesandoRef.current = true;
    setAplicando(accion);

    try {
      const res = await api.validarTurnoQr(codigoActivo, accion);
      setPreview(res.data);
      setAcciones(res.acciones);

      if (accion === 'confirmar') {
        await enviarConfirmacionWhatsApp({
          whatsappUrl: res.whatsapp_url,
          whatsappMensaje: res.whatsapp_mensaje,
          clienteTelefono: res.cliente_telefono,
          citaTarjetaUrl: res.cita_tarjeta_url ?? res.qr_url,
        });
      }

      showToast(res.message, accion === 'cancelar' ? 'error' : 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'No se pudo aplicar la acción', 'error');
    } finally {
      setAplicando(null);
      procesandoRef.current = false;
    }
  };

  const escanearDesdeArchivo = async (file: File | undefined) => {
    if (!file || procesandoRef.current) return;

    setEscaneandoFoto(true);
    await detenerScanner();

    const reader = new Html5Qrcode(FILE_READER_ID);
    try {
      const decoded = await reader.scanFile(file, false);
      await consultar(decoded);
    } catch {
      showToast('No se detectó un QR válido. Intenta de nuevo con mejor luz.', 'error');
    } finally {
      try {
        reader.clear();
      } catch {
        /* ignore */
      }
      setEscaneandoFoto(false);
      if (fotoInputRef.current) fotoInputRef.current.value = '';
      if (galeriaInputRef.current) galeriaInputRef.current.value = '';
    }
  };

  const obtenerCamaraTrasera = async (): Promise<string | { facingMode: string }> => {
    try {
      const cameras = await Html5Qrcode.getCameras();
      if (cameras.length === 0) {
        return { facingMode: 'environment' };
      }

      const trasera = cameras.find((c) => /back|rear|trase|environment|wide/i.test(c.label));
      return trasera?.id ?? cameras[cameras.length - 1].id;
    } catch {
      return { facingMode: 'environment' };
    }
  };

  const iniciarScanner = useCallback(async () => {
    if (!contextoSeguro) {
      fotoInputRef.current?.click();
      return;
    }

    limpiarPreview();
    await detenerScanner();
    procesandoRef.current = false;
    setScanning(true);

    const scanner = new Html5Qrcode(SCANNER_ID, { verbose: false });
    scannerRef.current = scanner;

    const config = {
      fps: 15,
      qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
        const edge = Math.floor(Math.min(viewfinderWidth, viewfinderHeight) * 0.72);
        return { width: edge, height: edge };
      },
      aspectRatio: 1,
      experimentalFeatures: {
        useBarCodeDetectorIfSupported: true,
      },
      disableFlip: false,
    };

    const onDecode = async (decoded: string) => {
      if (procesandoRef.current) return;
      try {
        await scanner.stop();
      } catch {
        /* ignore */
      }
      scannerRef.current = null;
      setScanning(false);
      await consultar(decoded);
    };

    try {
      const camara = await obtenerCamaraTrasera();
      await scanner.start(camara, config, onDecode, () => {});
    } catch {
      try {
        await scanner.start({ facingMode: 'user' }, config, onDecode, () => {});
      } catch {
        setScanning(false);
        scannerRef.current = null;
        procesandoRef.current = false;
        showToast(
          'No se pudo abrir la cámara. Usa "Fotografiar QR", "Elegir imagen" o pega el código manualmente.',
          'error',
        );
      }
    }
  }, [consultar, contextoSeguro, detenerScanner, showToast]);

  useEffect(() => {
    return () => {
      void detenerScanner();
    };
  }, [detenerScanner]);

  useEffect(() => {
    if (!uuidParam) return;
    void consultar(uuidParam);
  }, [uuidParam, consultar]);

  useEffect(() => {
    if (enlaceDirecto || autoStartedRef.current || !contextoSeguro) return;
    autoStartedRef.current = true;
    void iniciarScanner();

    return () => {
      void detenerScanner();
    };
  }, [enlaceDirecto, contextoSeguro, iniciarScanner, detenerScanner]);

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">
          {enlaceDirecto ? 'Gestionar cita' : 'Validar servicio'}
        </h1>
        <p className="text-slate-400">
          {enlaceDirecto
            ? 'Revisa los datos de la cita y confirma, completa el servicio o márcala como no válida.'
            : 'Apunta la cámara al QR del cliente (pantalla, impreso o captura de pantalla). Funciona con cualquier código QR de la cita.'}
        </p>
      </div>

      {!enlaceDirecto && (
        <>
          <div
            id={SCANNER_ID}
            className={`overflow-hidden rounded-xl border border-white/10 bg-black ${scanning ? 'min-h-[min(72vw,320px)]' : 'hidden'}`}
          />
          <div id={FILE_READER_ID} className="hidden" aria-hidden />

          <input
            ref={fotoInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => escanearDesdeArchivo(e.target.files?.[0])}
          />
          <input
            ref={galeriaInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => escanearDesdeArchivo(e.target.files?.[0])}
          />

          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            {scanning ? (
              <button type="button" className="btn-ghost w-full sm:w-auto" onClick={() => void detenerScanner()}>
                Detener cámara
              </button>
            ) : (
              <>
                {contextoSeguro && (
                  <button
                    type="button"
                    className="btn-primary w-full sm:w-auto"
                    onClick={() => void iniciarScanner()}
                    disabled={ocupado || escaneandoFoto}
                  >
                    <ScanLine className="h-4 w-4" />
                    Abrir cámara
                  </button>
                )}
                <button
                  type="button"
                  className={contextoSeguro ? 'btn-ghost w-full sm:w-auto' : 'btn-primary w-full sm:w-auto'}
                  onClick={() => fotoInputRef.current?.click()}
                  disabled={ocupado || escaneandoFoto}
                >
                  {escaneandoFoto ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Camera className="h-4 w-4" />
                  )}
                  Fotografiar QR
                </button>
                <button
                  type="button"
                  className="btn-ghost w-full sm:w-auto"
                  onClick={() => galeriaInputRef.current?.click()}
                  disabled={ocupado || escaneandoFoto}
                >
                  <ImageIcon className="h-4 w-4" />
                  Elegir imagen
                </button>
              </>
            )}
            <Link to="/dashboard/mis-citas" className="btn-ghost w-full sm:w-auto">
              Mis citas
            </Link>
          </div>

          <div className="card space-y-3">
            <label htmlFor="codigo-manual" className="text-sm font-medium text-slate-300">
              O pegar enlace / UUID del QR
            </label>
            <input
              id="codigo-manual"
              value={manualCodigo}
              onChange={(e) => setManualCodigo(e.target.value)}
              placeholder="https://.../validar-cita/uuid, /cita/uuid o uuid"
              className="input-field w-full"
            />
            <button
              type="button"
              className="btn-primary w-full justify-center"
              disabled={ocupado || !manualCodigo.trim()}
              onClick={() => void consultar(manualCodigo)}
            >
              {consultando ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <QrCode className="h-4 w-4" />
              )}
              Buscar cita
            </button>
          </div>
        </>
      )}

      {enlaceDirecto && consultando && !preview && (
        <div className="card flex items-center justify-center gap-3 py-10 text-slate-400">
          <Loader2 className="h-5 w-5 animate-spin text-indigo-400" />
          Cargando cita...
        </div>
      )}

      {enlaceDirecto && (
        <Link to="/dashboard/validar-qr" className="btn-ghost w-full sm:w-auto">
          Escanear otro QR
        </Link>
      )}

      {preview && (
        <div
          className={`card space-y-4 ${preview.estado === 'completado' ? 'border-emerald-500/30 bg-emerald-500/5' : ''}`}
        >
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="font-semibold text-white">Cita encontrada</p>
              <p className="text-sm text-slate-400">{preview.barberia}</p>
            </div>
            <TurnoEstadoBadge estado={preview.estado} />
          </div>

          {!esMio && (
            <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              Esta cita pertenece a otro barbero ({preview.barbero}). No puedes cambiar su estado.
            </div>
          )}

          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-slate-500">Cliente</dt>
              <dd className="font-medium text-white">{preview.cliente}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Barbero</dt>
              <dd className="text-slate-200">{preview.barbero}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Servicio</dt>
              <dd className="text-slate-200">{preview.servicio}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Fecha y hora</dt>
              <dd className="text-slate-200">
                {formatFecha(preview.fecha)} · {preview.hora}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Precio</dt>
              <dd className="text-indigo-300">{formatPrecioTurno(preview.precio)}</dd>
            </div>
          </dl>

          {preview.estado === 'completado' && preview.validado_at && (
            <p className="flex items-center gap-2 text-sm text-emerald-300">
              <CheckCircle2 className="h-4 w-4" />
              Validado: {new Date(preview.validado_at).toLocaleString('es-CO')}
            </p>
          )}

          {preview.estado === 'cancelado' && (
            <p className="text-sm text-red-300">Esta cita está cancelada.</p>
          )}

          {esMio && acciones.length > 0 && (
            <div className="flex flex-col gap-2 border-t border-white/10 pt-4 sm:flex-row sm:flex-wrap">
              {acciones.map((accion) => {
                const cfg = ACCION_LABELS[accion];
                const Icon = cfg.icon;
                return (
                  <button
                    key={accion}
                    type="button"
                    className={`${cfg.className} w-full sm:w-auto`}
                    disabled={ocupado}
                    onClick={() => aplicarAccion(accion)}
                  >
                    {aplicando === accion ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Icon className="h-4 w-4" />
                    )}
                    {cfg.label}
                  </button>
                );
              })}
            </div>
          )}

          {esMio && acciones.length === 0 && preview.estado === 'completado' && (
            <p className="text-sm text-slate-400">No hay más acciones disponibles para esta cita.</p>
          )}

          <button type="button" className="btn-ghost text-sm" onClick={limpiarPreview} disabled={ocupado}>
            Escanear otro QR
          </button>
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
    </div>
  );
}
