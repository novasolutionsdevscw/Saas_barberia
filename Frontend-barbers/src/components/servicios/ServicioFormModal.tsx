import { FormEvent, useEffect, useState } from 'react';
import { Scissors } from 'lucide-react';
import { api, type Servicio } from '../../services/api';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';

type Props = {
  open: boolean;
  mode: 'create' | 'edit';
  servicio: Servicio | null;
  onClose: () => void;
  onSuccess: (message: string, servicio: Servicio) => void;
  onError: (message: string) => void;
};

export function ServicioFormModal({ open, mode, servicio, onClose, onSuccess, onError }: Props) {
  const [nombre, setNombre] = useState('');
  const [precio, setPrecio] = useState('');
  const [duracion, setDuracion] = useState('30');
  const [activo, setActivo] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;

    if (mode === 'edit' && servicio) {
      setNombre(servicio.nombre);
      setPrecio(String(servicio.precio));
      setDuracion(String(servicio.duracion));
      setActivo(servicio.estado);
    } else {
      setNombre('');
      setPrecio('');
      setDuracion('30');
      setActivo(true);
    }
  }, [open, mode, servicio]);

  const handleClose = () => onClose();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const precioNum = parseFloat(precio);
    const duracionNum = parseInt(duracion, 10);

    if (Number.isNaN(precioNum) || precioNum < 0) {
      onError('Precio inválido');
      setLoading(false);
      return;
    }
    if (Number.isNaN(duracionNum) || duracionNum < 1) {
      onError('Duración inválida (mínimo 1 minuto)');
      setLoading(false);
      return;
    }

    try {
      if (mode === 'create') {
        const res = await api.createServicio({
          nombre: nombre.trim(),
          precio: precioNum,
          duracion: duracionNum,
        });
        onSuccess(res.message, res.data);
      } else if (servicio) {
        const res = await api.updateServicio(servicio.id, {
          nombre: nombre.trim(),
          precio: precioNum,
          duracion: duracionNum,
          estado: activo,
        });
        onSuccess(res.message, res.data);
      }
      onClose();
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Error al guardar servicio');
    } finally {
      setLoading(false);
    }
  };

  const isEdit = mode === 'edit';
  const formId = 'servicio-form';

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={isEdit ? 'Editar servicio' : 'Nuevo servicio'}
      footer={
        <>
          <button type="button" className="btn-ghost" onClick={handleClose} disabled={loading}>
            Cancelar
          </button>
          <button type="submit" form={formId} className="btn-primary" disabled={loading}>
            <Scissors className="h-4 w-4" />
            {loading ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear servicio'}
          </button>
        </>
      }
    >
      <form id={formId} onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Nombre del servicio"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Corte + barba"
          required
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Precio"
            type="number"
            min="0"
            step="0.01"
            value={precio}
            onChange={(e) => setPrecio(e.target.value)}
            placeholder="25000"
            required
          />
          <Input
            label="Duración (minutos)"
            type="number"
            min="1"
            value={duracion}
            onChange={(e) => setDuracion(e.target.value)}
            required
          />
        </div>

        {isEdit && (
          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-[var(--color-border)] bg-white/[0.02] px-4 py-3">
            <input
              type="checkbox"
              checked={activo}
              onChange={(e) => setActivo(e.target.checked)}
              className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-indigo-500 focus:ring-indigo-500/40"
            />
            <span className="text-sm text-slate-300">Servicio activo y visible en la landing</span>
          </label>
        )}
      </form>
    </Modal>
  );
}
