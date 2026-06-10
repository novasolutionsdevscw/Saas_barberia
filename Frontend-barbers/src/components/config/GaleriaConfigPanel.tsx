import { useCallback, useEffect, useRef, useState } from 'react';
import { ImagePlus, Loader2, Trash2 } from 'lucide-react';
import { api, type GaleriaCorte } from '../../services/api';
import { mediaUrl } from '../../utils/mediaUrl';
import { Input } from '../ui/Input';

const MAX = 10;

type Props = {
  onMessage?: (msg: string, type: 'success' | 'error') => void;
  onCountChange?: (count: number) => void;
};

export function GaleriaConfigPanel({ onMessage, onCountChange }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<GaleriaCorte[]>([]);
  const [titulo, setTitulo] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getGaleriaCortes();
      setItems(res.galeria);
      onCountChange?.(res.galeria.length);
    } catch (err) {
      onMessage?.(err instanceof Error ? err.message : 'Error al cargar galería', 'error');
    } finally {
      setLoading(false);
    }
  }, [onMessage]);

  useEffect(() => {
    load();
  }, [load]);

  const handleUpload = async (file?: File) => {
    if (!file) return;
    setUploading(true);
    try {
      const res = await api.uploadGaleriaCorte(file, titulo.trim() || undefined);
      setItems((prev) => [...prev, res.data]);
      setTitulo('');
      onMessage?.(res.message, 'success');
    } catch (err) {
      onMessage?.(err instanceof Error ? err.message : 'Error al subir imagen', 'error');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    try {
      const res = await api.deleteGaleriaCorte(id);
      setItems((prev) => {
        const next = prev.filter((i) => i.id !== id);
        onCountChange?.(next.length);
        return next;
      });
      onMessage?.(res.message, 'success');
    } catch (err) {
      onMessage?.(err instanceof Error ? err.message : 'Error al eliminar', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const puedeSubir = items.length < MAX;

  if (loading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
      </div>
    );
  }

  return (
    <section className="card space-y-5">
      <div>
        <h3 className="font-semibold text-white">Galería de cortes</h3>
        <p className="mt-1 text-sm text-slate-400">
          Sube hasta {MAX} fotos de tus mejores trabajos. Se muestran en la landing pública.
        </p>
        <p className="mt-2 text-xs text-slate-500">
          {items.length} / {MAX} imágenes
        </p>
      </div>

      {items.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {items.map((item) => {
            const src = mediaUrl(item.imagen);
            return (
              <div
                key={item.id}
                className="group relative aspect-square overflow-hidden rounded-xl border border-white/8"
              >
                {src ? (
                  <img src={src} alt={item.titulo || 'Corte'} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center bg-white/5 text-slate-600">
                    <ImagePlus className="h-8 w-8" />
                  </div>
                )}
                {item.titulo && (
                  <p className="absolute inset-x-0 bottom-0 truncate bg-black/70 px-2 py-1 text-xs text-white">
                    {item.titulo}
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => handleDelete(item.id)}
                  disabled={deletingId === item.id}
                  className="absolute right-2 top-2 rounded-lg bg-red-600/90 p-1.5 text-white opacity-0 transition group-hover:opacity-100"
                  aria-label="Eliminar"
                >
                  {deletingId === item.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {puedeSubir ? (
        <div className="space-y-4 rounded-2xl border-2 border-dashed border-indigo-500/40 bg-indigo-500/5 p-6">
          <div className="text-center">
            <ImagePlus className="mx-auto h-10 w-10 text-indigo-400" />
            <p className="mt-2 font-medium text-white">Subir foto de corte</p>
            <p className="text-sm text-slate-400">JPG o PNG, máximo 5 MB</p>
          </div>
          <Input
            label="Título (opcional)"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Ej. Fade clásico, Barba perfilada..."
          />
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleUpload(e.target.files?.[0])}
          />
          <button
            type="button"
            className="btn-primary w-full justify-center py-3 text-base"
            disabled={uploading}
            onClick={() => fileRef.current?.click()}
          >
            {uploading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <ImagePlus className="h-5 w-5" />
            )}
            {uploading ? 'Subiendo imagen...' : 'Seleccionar imagen y subir'}
          </button>
        </div>
      ) : (
        <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
          Límite alcanzado ({MAX} imágenes). Elimina una para subir otra.
        </p>
      )}
    </section>
  );
}
