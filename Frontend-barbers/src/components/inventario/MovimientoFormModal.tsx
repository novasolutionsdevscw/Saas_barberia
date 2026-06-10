import { FormEvent, useEffect, useState } from 'react';
import { api, type Producto } from '../../services/api';
import { Modal } from '../ui/Modal';
import { ModalAlert } from '../ui/ModalAlert';

type Props = {
  open: boolean;
  productos: Producto[];
  onClose: () => void;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
};

export function MovimientoFormModal({ open, productos, onClose, onSuccess, onError }: Props) {
  const [productoId, setProductoId] = useState('');
  const [tipo, setTipo] = useState<'entrada' | 'salida'>('entrada');
  const [cantidad, setCantidad] = useState('1');
  const [descripcion, setDescripcion] = useState('');
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (!open) return;
    setAlert(null);
    setProductoId(productos[0] ? String(productos[0].id) : '');
    setTipo('entrada');
    setCantidad('1');
    setDescripcion('');
  }, [open, productos]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setAlert(null);

    const qty = parseInt(cantidad, 10);
    if (!productoId || !Number.isFinite(qty) || qty < 1) {
      setAlert({ message: 'Producto y cantidad válidos son obligatorios.', type: 'error' });
      return;
    }

    setLoading(true);
    try {
      const res = await api.registrarMovimientoInventario({
        producto_id: Number(productoId),
        tipo,
        cantidad: qty,
        descripcion: descripcion.trim() || undefined,
      });
      onSuccess(res.message);
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al registrar movimiento';
      setAlert({ message: msg, type: 'error' });
      onError(msg);
    } finally {
      setLoading(false);
    }
  };

  const productoSel = productos.find((p) => String(p.id) === productoId);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Registrar movimiento"
      footer={
        <>
          <button type="button" className="btn-ghost" onClick={onClose} disabled={loading}>
            Cancelar
          </button>
          <button type="submit" form="movimiento-form" className="btn-primary" disabled={loading}>
            {loading ? 'Guardando...' : 'Registrar'}
          </button>
        </>
      }
    >
      <form id="movimiento-form" onSubmit={handleSubmit} className="space-y-4">
        {alert && <ModalAlert message={alert.message} type={alert.type} />}

        {productos.length === 0 ? (
          <ModalAlert
            type="error"
            message="Crea productos en el catálogo antes de registrar movimientos."
          />
        ) : (
          <>
            <div className="space-y-1.5">
              <label htmlFor="mov-producto" className="text-sm font-medium text-slate-300">
                Producto
              </label>
              <select
                id="mov-producto"
                value={productoId}
                onChange={(e) => setProductoId(e.target.value)}
                className="input-field w-full"
                required
              >
                {productos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre} (stock: {p.stock})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label htmlFor="mov-tipo" className="text-sm font-medium text-slate-300">
                  Tipo
                </label>
                <select
                  id="mov-tipo"
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value as 'entrada' | 'salida')}
                  className="input-field w-full"
                >
                  <option value="entrada">Entrada (+ stock)</option>
                  <option value="salida">Salida (− stock)</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label htmlFor="mov-cantidad" className="text-sm font-medium text-slate-300">
                  Cantidad
                </label>
                <input
                  id="mov-cantidad"
                  type="number"
                  min={1}
                  value={cantidad}
                  onChange={(e) => setCantidad(e.target.value)}
                  className="input-field w-full"
                  required
                />
              </div>
            </div>

            {tipo === 'salida' && productoSel && (
              <p className="text-xs text-slate-500">
                Stock actual: {productoSel.stock} unidad(es)
              </p>
            )}

            <div className="space-y-1.5">
              <label htmlFor="mov-desc" className="text-sm font-medium text-slate-300">
                Descripción (opcional)
              </label>
              <input
                id="mov-desc"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                className="input-field w-full"
                maxLength={255}
                placeholder="Ej. Compra proveedor, venta mostrador..."
              />
            </div>
          </>
        )}
      </form>
    </Modal>
  );
}
