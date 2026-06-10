import { useEffect, useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { generateQrDataUrl, getBarberiaPublicUrl } from '../../utils/barberiaQr';
import type { BarberiaMatriz } from '../../services/api';

type BarberiaQrModalProps = {
  open: boolean;
  barberia: BarberiaMatriz | null;
  onClose: () => void;
};

export function BarberiaQrModal({ open, barberia, onClose }: BarberiaQrModalProps) {
  const [qrSrc, setQrSrc] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open || !barberia) {
      setQrSrc('');
      return;
    }

    const url = getBarberiaPublicUrl(barberia);
    generateQrDataUrl(url).then(setQrSrc).catch(() => setQrSrc(''));
  }, [open, barberia]);

  if (!barberia) return null;

  const url = getBarberiaPublicUrl(barberia);

  const copyUrl = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Modal open={open} onClose={onClose} title="Código QR de la barbería">
      <div className="flex flex-col items-center gap-4 text-center">
        <p className="text-slate-400">
          Al escanear con el celular se abrirá la{' '}
          <strong className="text-white">landing page</strong> de la barbería.
        </p>
        <p className="font-semibold text-white">{barberia.nombre}</p>

        {qrSrc ? (
          <img
            src={qrSrc}
            alt={`QR ${barberia.nombre}`}
            className="rounded-2xl border border-violet-500/20 bg-[#0c0f14] p-3"
          />
        ) : (
          <div className="flex h-[260px] w-[260px] items-center justify-center rounded-2xl border border-[var(--color-border)] bg-[#0c0f14]">
            <span className="text-sm text-slate-500">Generando QR...</span>
          </div>
        )}

        <div className="w-full rounded-xl border border-violet-500/20 bg-violet-500/5 px-4 py-3">
          <p className="text-xs uppercase tracking-wider text-violet-400">URL pública</p>
          <p className="mt-1 break-all text-sm text-white">{url}</p>
          <button type="button" onClick={copyUrl} className="btn-ghost mx-auto mt-3 text-sm">
            {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
            {copied ? 'Copiado' : 'Copiar enlace'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
