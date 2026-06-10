import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, X, XCircle } from 'lucide-react';

export type ToastType = 'success' | 'error';

type ToastProps = {
  message: string;
  type: ToastType;
  onClose?: () => void;
};

export function Toast({ message, type, onClose }: ToastProps) {
  useEffect(() => {
    if (!onClose) return;
    const id = window.setTimeout(onClose, 4500);
    return () => window.clearTimeout(id);
  }, [message, onClose]);

  return createPortal(
    <div
      role="status"
      className="pointer-events-auto fixed top-4 right-4 z-[9999] flex w-[min(100vw-2rem,24rem)] items-start gap-3 rounded-xl border px-4 py-3 text-sm shadow-2xl shadow-black/50 animate-in fade-in slide-in-from-top-2 duration-300 sm:top-6 sm:right-6"
      style={{
        borderColor: type === 'success' ? 'rgba(16,185,129,0.35)' : 'rgba(239,68,68,0.35)',
        backgroundColor: type === 'success' ? 'rgba(6,78,59,0.95)' : 'rgba(69,10,10,0.95)',
        color: type === 'success' ? '#a7f3d0' : '#fecaca',
      }}
    >
      {type === 'success' ? (
        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
      ) : (
        <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />
      )}
      <p className="min-w-0 flex-1 leading-snug">{message}</p>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 rounded-lg p-1 opacity-70 transition hover:opacity-100"
          aria-label="Cerrar"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>,
    document.body,
  );
}
