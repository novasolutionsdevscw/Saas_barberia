import { FormEvent, useEffect, useRef, useState } from 'react';
import { Package } from 'lucide-react';
import { api, type Producto } from '../../services/api';
import { Modal } from '../ui/Modal';
import { ModalAlert } from '../ui/ModalAlert';
import { MediaImage } from '../ui/MediaImage';
import { Input } from '../ui/Input';

type Props = {
  open: boolean;
  mode: 'create' | 'edit';
  producto: Producto | null;
  onClose: () => void;
  onSuccess: (message: string, producto: Producto) => void;
  onError: (message: string) => void;
  onProductoUpdated?: (producto: Producto) => void;
};

export function ProductoFormModal({
  open,
  mode,
  producto,
  onClose,
  onSuccess,
  onError,
  onProductoUpdated,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [precio, setPrecio] = useState('');
  const [stock, setStock] = useState('0');
  const [activo, setActivo] = useState(true);
  const [imagenPreview, setImagenPreview] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadingImg, setUploadingImg] = useState(false);
  const [alert, setAlert] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (!open) return;
    setAlert(null);
    setPendingFile(null);
    if (mode === 'edit' && producto) {
      setNombre(producto.nombre);
      setDescripcion(producto.descripcion ?? '');
      setPrecio(String(producto.precio));
      setStock(String(producto.stock));
      setActivo(producto.estado);
      setImagenPreview(producto.imagen ?? null);
    } else {
      setNombre('');
      setDescripcion('');
      setPrecio('');
      setStock('0');
      setActivo(true);
      setImagenPreview(null);
    }
  }, [open, mode, producto]);

  const uploadImage = async (productoId: number, file: File) => {
    setUploadingImg(true);
    try {
      const res = await api.uploadProductoImagen(productoId, file);
      setImagenPreview(res.data.imagen ?? null);
      setPendingFile(null);
      onProductoUpdated?.(res.data);
      setAlert({ message: res.message, type: 'success' });
      return res.data;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al subir imagen';
      setAlert({ message: msg, type: 'error' });
      onError(msg);
      return null;
    } finally {
      setUploadingImg(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleFilePick = (file?: File) => {
    if (!file) return;
    if (mode === 'edit' && producto) {
      void uploadImage(producto.id, file);
    } else {
      setPendingFile(file);
      setImagenPreview(URL.createObjectURL(file));
      setAlert({ message: 'La imagen se subirá al crear el producto.', type: 'success' });
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setAlert(null);

    const precioNum = parseFloat(precio);
    const stockNum = parseInt(stock, 10);
    if (Number.isNaN(precioNum) || precioNum < 0) {
      setAlert({ message: 'Precio inválido', type: 'error' });
      setLoading(false);
      return;
    }

    try {
      if (mode === 'create') {
        const res = await api.createProducto({
          nombre: nombre.trim(),
          descripcion: descripcion.trim() || undefined,
          precio: precioNum,
          stock: Number.isNaN(stockNum) ? 0 : stockNum,
        });
        let finalProducto = res.data;
        if (pendingFile) {
          const uploaded = await uploadImage(res.data.id, pendingFile);
          if (uploaded) finalProducto = uploaded;
        }
        onSuccess(res.message, finalProducto);
        onClose();
      } else if (producto) {
        const res = await api.updateProducto(producto.id, {
          nombre: nombre.trim(),
          descripcion: descripcion.trim(),
          precio: precioNum,
          stock: Number.isNaN(stockNum) ? 0 : stockNum,
          estado: activo,
        });
        onSuccess(res.message, res.data);
        onClose();
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al guardar';
      setAlert({ message: msg, type: 'error' });
      onError(msg);
    } finally {
      setLoading(false);
    }
  };

  const formId = 'producto-form';
  const canUploadImage = mode === 'edit' ? !!producto : true;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={mode === 'edit' ? 'Editar producto' : 'Nuevo producto'}
      wide
      footer={
        <>
          <button type="button" className="btn-ghost" onClick={onClose} disabled={loading}>
            Cancelar
          </button>
          <button type="submit" form={formId} className="btn-primary" disabled={loading || uploadingImg}>
            <Package className="h-4 w-4" />
            {loading ? 'Guardando...' : mode === 'edit' ? 'Guardar' : 'Crear producto'}
          </button>
        </>
      }
    >
      <form id={formId} onSubmit={handleSubmit} className="space-y-4">
        {alert && <ModalAlert message={alert.message} type={alert.type} />}

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-[minmax(120px,160px)_1fr]">
          <div>
            <p className="mb-2 text-sm font-medium text-slate-300">Imagen (opcional)</p>
            <div className="aspect-square w-full max-w-[160px] overflow-hidden rounded-xl border border-[var(--color-border)]">
              <MediaImage
                src={imagenPreview}
                alt={nombre || 'Producto'}
                className="h-full w-full object-cover"
                wrapperClassName="h-full w-full"
                fallbackIcon="off"
              />
            </div>
            {canUploadImage && (
              <>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFilePick(e.target.files?.[0])}
                />
                <button
                  type="button"
                  className="btn-ghost mt-2 w-full max-w-[160px] text-xs"
                  disabled={uploadingImg}
                  onClick={() => fileRef.current?.click()}
                >
                  {uploadingImg ? 'Subiendo...' : imagenPreview ? 'Cambiar imagen' : 'Elegir imagen'}
                </button>
              </>
            )}
          </div>

          <div className="space-y-4">
            <Input label="Nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} required />
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-300">Descripción</label>
              <textarea
                rows={3}
                className="input-field resize-none"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Opcional"
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Precio"
                type="number"
                min="0"
                step="0.01"
                value={precio}
                onChange={(e) => setPrecio(e.target.value)}
                required
              />
              <Input
                label="Stock"
                type="number"
                min="0"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
              />
            </div>
            {mode === 'edit' && (
              <label className="flex items-center gap-3 rounded-xl border border-[var(--color-border)] px-4 py-3">
                <input
                  type="checkbox"
                  checked={activo}
                  onChange={(e) => setActivo(e.target.checked)}
                  className="h-4 w-4 rounded text-indigo-500"
                />
                <span className="text-sm text-slate-300">Visible en la landing</span>
              </label>
            )}
          </div>
        </div>
      </form>
    </Modal>
  );
}
