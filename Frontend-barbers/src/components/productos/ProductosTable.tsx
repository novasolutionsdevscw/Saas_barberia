import { useCallback, useEffect, useState } from 'react';
import { Loader2, Package, Pencil, Plus, Trash2 } from 'lucide-react';
import { api, type Producto } from '../../services/api';
import { formatPrecio } from '../../utils/format';
import { MediaImage } from '../ui/MediaImage';
import { Modal } from '../ui/Modal';
import { Tooltip } from '../ui/Tooltip';
import { ProductoFormModal } from './ProductoFormModal';

type Props = {
  onToast?: (message: string, type: 'success' | 'error') => void;
};

export function ProductosTable({ onToast }: Props) {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [selected, setSelected] = useState<Producto | null>(null);
  const [deactivateTarget, setDeactivateTarget] = useState<Producto | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setProductos(await api.getProductos());
    } catch (err) {
      onToast?.(err instanceof Error ? err.message : 'Error al cargar productos', 'error');
    } finally {
      setLoading(false);
    }
  }, [onToast]);

  useEffect(() => {
    load();
  }, [load]);

  const handleFormSuccess = (message: string, producto: Producto) => {
    if (!producto.estado) {
      setProductos((prev) => prev.filter((p) => p.id !== producto.id));
    } else if (formMode === 'create') {
      setProductos((prev) => [...prev, producto]);
    } else {
      setProductos((prev) => prev.map((p) => (p.id === producto.id ? producto : p)));
    }
    setFormOpen(false);
    onToast?.(message, 'success');
  };

  const handleDeactivate = async () => {
    if (!deactivateTarget) return;
    setActionLoading(true);
    try {
      const res = await api.deleteProducto(deactivateTarget.id);
      setProductos((prev) => prev.filter((p) => p.id !== deactivateTarget.id));
      onToast?.(res.message, 'success');
      setDeactivateTarget(null);
    } catch (err) {
      onToast?.(err instanceof Error ? err.message : 'Error al desactivar', 'error');
    } finally {
      setActionLoading(false);
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-400">{productos.length} producto(s) en catálogo</p>
        <button type="button" className="btn-primary" onClick={() => { setFormMode('create'); setSelected(null); setFormOpen(true); }}>
          <Plus className="h-4 w-4" />
          Nuevo producto
        </button>
      </div>

      {productos.length === 0 ? (
        <div className="card flex flex-col items-center py-16 text-center">
          <Package className="h-12 w-12 text-slate-600" />
          <p className="mt-4 font-medium text-white">Sin productos</p>
          <p className="mt-1 text-sm text-slate-400">Agrega productos para mostrarlos en tu landing.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {productos.map((p) => (
            <article key={p.id} className="card overflow-hidden p-0">
                <div className="aspect-[16/10] w-full">
                  <MediaImage
                    src={p.imagen}
                    alt={p.nombre}
                    className="h-full w-full object-cover"
                    wrapperClassName="h-full w-full min-h-[140px]"
                    fallbackIcon="off"
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-white">{p.nombre}</h3>
                  <p className="mt-1 text-lg font-bold text-indigo-300">{formatPrecio(p.precio)}</p>
                  <p className="text-xs text-slate-500">Stock: {p.stock}</p>
                  <div className="mt-3 flex justify-end gap-1">
                    <Tooltip label="Editar">
                      <button
                        type="button"
                        className="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-indigo-300"
                        onClick={() => { setFormMode('edit'); setSelected(p); setFormOpen(true); }}
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                    </Tooltip>
                    <Tooltip label="Desactivar">
                      <button
                        type="button"
                        className="rounded-lg p-2 text-slate-400 hover:bg-red-500/10 hover:text-red-300"
                        onClick={() => setDeactivateTarget(p)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </Tooltip>
                  </div>
                </div>
              </article>
          ))}
        </div>
      )}

      <ProductoFormModal
        open={formOpen}
        mode={formMode}
        producto={selected}
        onClose={() => setFormOpen(false)}
        onSuccess={handleFormSuccess}
        onError={(m) => onToast?.(m, 'error')}
        onProductoUpdated={(p) => {
          setProductos((prev) => prev.map((item) => (item.id === p.id ? p : item)));
          if (selected?.id === p.id) setSelected(p);
        }}
      />

      <Modal
        open={!!deactivateTarget}
        onClose={() => setDeactivateTarget(null)}
        title="Desactivar producto"
        footer={
          <>
            <button type="button" className="btn-ghost" onClick={() => setDeactivateTarget(null)}>Cancelar</button>
            <button type="button" className="rounded-xl bg-red-500 px-4 py-2.5 text-white" onClick={handleDeactivate} disabled={actionLoading}>
              {actionLoading ? '...' : 'Desactivar'}
            </button>
          </>
        }
      >
        <p>¿Desactivar <strong className="text-white">{deactivateTarget?.nombre}</strong>?</p>
      </Modal>
    </div>
  );
}
