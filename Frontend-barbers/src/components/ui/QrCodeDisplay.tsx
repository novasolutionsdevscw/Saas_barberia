import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import QRCode from 'qrcode';
import { saveQrFromCanvas } from '../../utils/qrDownload';

type Props = {
  value: string;
  size?: number;
  className?: string;
  responsive?: boolean;
  showDownload?: boolean;
  downloadFileName?: string;
  onDownloadMessage?: (message: string, type: 'success' | 'error') => void;
};

export type QrCodeDisplayHandle = {
  download: () => Promise<void>;
  getCanvas: () => HTMLCanvasElement | null;
};

export const QrCodeDisplay = forwardRef<QrCodeDisplayHandle, Props>(function QrCodeDisplay(
  {
    value,
    size = 220,
    className = '',
    responsive = true,
    showDownload = false,
    downloadFileName = 'cita-qr',
    onDownloadMessage,
  },
  ref,
) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [renderSize, setRenderSize] = useState(size);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!responsive) {
      setRenderSize(size);
      return;
    }

    const update = () => {
      const max = Math.min(size, window.innerWidth - 64);
      setRenderSize(Math.max(160, max));
    };

    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [size, responsive]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !value) return;

    QRCode.toCanvas(canvas, value, {
      width: renderSize,
      margin: 2,
      color: { dark: '#0f172a', light: '#ffffff' },
    }).catch(() => {});
  }, [value, renderSize]);

  const handleDownload = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !value) return;

    setDownloading(true);
    try {
      const result = await saveQrFromCanvas(canvas, downloadFileName);
      const message =
        result === 'shared' ? 'QR guardado' : 'QR descargado';
      onDownloadMessage?.(message, 'success');
    } catch {
      onDownloadMessage?.('No se pudo guardar el QR. Intenta de nuevo.', 'error');
    } finally {
      setDownloading(false);
    }
  };

  useImperativeHandle(ref, () => ({
    download: handleDownload,
    getCanvas: () => canvasRef.current,
  }));

  return (
    <div className="flex flex-col items-center gap-3">
      <canvas
        ref={canvasRef}
        style={{ width: renderSize, height: renderSize, maxWidth: '100%' }}
        className={`rounded-xl bg-white p-2 shadow-lg ${className}`}
        aria-label="Código QR de la cita"
      />
      {showDownload && (
        <button
          type="button"
          className="btn-primary w-full max-w-xs justify-center text-sm sm:w-auto"
          onClick={handleDownload}
          disabled={downloading || !value}
        >
          {downloading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          {downloading ? 'Guardando...' : 'Descargar QR'}
        </button>
      )}
    </div>
  );
});
