import { FormEvent, useEffect, useRef, useState } from 'react';
import { ImagePlus, UserPlus } from 'lucide-react';
import { MediaImage } from '../ui/MediaImage';
import { api, type Barbero } from '../../services/api';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { PasswordInput } from '../ui/PasswordInput';

type Props = {
  open: boolean;
  mode: 'create' | 'edit';
  barbero: Barbero | null;
  onClose: () => void;
  onSuccess: (message: string, barbero: Barbero) => void;
  onError: (message: string) => void;
};

export function BarberoFormModal({ open, mode, barbero, onClose, onSuccess, onError }: Props) {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [telefono, setTelefono] = useState('');
  const [especialidad, setEspecialidad] = useState('');
  const [activo, setActivo] = useState(true);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [uploadingFoto, setUploadingFoto] = useState(false);
  const fotoRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;

    if (mode === 'edit' && barbero) {
      setNombre(barbero.nombre);
      setEmail(barbero.user?.email ?? '');
      setTelefono(barbero.telefono ?? '');
      setEspecialidad(barbero.especialidad ?? '');
      setActivo(barbero.estado);
      setFotoPreview(barbero.foto ?? null);
      setPassword('');
    } else {
      setNombre('');
      setEmail('');
      setPassword('');
      setTelefono('');
      setEspecialidad('');
      setActivo(true);
      setFotoPreview(null);
    }
  }, [open, mode, barbero]);

  const handleFotoChange = async (file?: File) => {
    if (!file || !barbero) return;
    setUploadingFoto(true);
    try {
      const res = await api.uploadBarberoFoto(barbero.id, file);
      setFotoPreview(res.data.foto ?? null);
      onSuccess(res.message, res.data);
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Error al subir foto');
    } finally {
      setUploadingFoto(false);
      if (fotoRef.current) fotoRef.current.value = '';
    }
  };

  const reset = () => {
    setNombre('');
    setEmail('');
    setPassword('');
    setTelefono('');
    setEspecialidad('');
    setActivo(true);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === 'create') {
        const res = await api.createBarbero({
          nombre: nombre.trim(),
          email: email.trim(),
          password,
          telefono: telefono.trim() || undefined,
          especialidad: especialidad.trim() || undefined,
        });
        onSuccess(res.message, res.data);
      } else if (barbero) {
        const res = await api.updateBarbero(barbero.id, {
          nombre: nombre.trim(),
          email: email.trim(),
          telefono: telefono.trim() || undefined,
          especialidad: especialidad.trim() || undefined,
          estado: activo,
        });
        onSuccess(res.message, res.data);
      }

      reset();
      onClose();
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Error al guardar barbero');
    } finally {
      setLoading(false);
    }
  };

  const isEdit = mode === 'edit';
  const formId = 'barbero-form';

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={isEdit ? 'Editar barbero' : 'Nuevo barbero'}
      footer={
        <>
          <button type="button" className="btn-ghost" onClick={handleClose} disabled={loading}>
            Cancelar
          </button>
          <button type="submit" form={formId} className="btn-primary" disabled={loading}>
            <UserPlus className="h-4 w-4" />
            {loading ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear barbero'}
          </button>
        </>
      }
    >
      <form id={formId} onSubmit={handleSubmit} className="space-y-4">
        {isEdit && barbero && (
          <div>
            <p className="mb-2 text-sm font-medium text-slate-300">Foto para la landing</p>
            <div className="mx-auto h-32 w-32 overflow-hidden rounded-2xl border border-[var(--color-border)]">
              <MediaImage
                src={fotoPreview}
                alt={nombre}
                className="h-full w-full object-cover"
                wrapperClassName="h-32 w-32"
                fallbackIcon="user"
              />
            </div>
            <input ref={fotoRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFotoChange(e.target.files?.[0])} />
            <button type="button" className="btn-ghost mt-2 w-full text-sm" disabled={uploadingFoto} onClick={() => fotoRef.current?.click()}>
              {uploadingFoto ? 'Subiendo...' : 'Subir foto del barbero'}
            </button>
          </div>
        )}

        <p className="text-slate-400">
          {isEdit
            ? 'Actualiza los datos del barbero. Puedes reactivarlo si estaba desactivado.'
            : 'El barbero recibirá acceso al panel con el correo y contraseña que definas.'}
        </p>

        <Input
          label="Nombre"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Carlos Méndez"
          required
        />
        <Input
          label="Correo"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="barbero@barberia.com"
          required
        />
        {!isEdit && (
          <PasswordInput
            label="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mínimo 8 caracteres"
            minLength={8}
            required
            autoComplete="new-password"
          />
        )}
        <Input
          label="Teléfono (opcional)"
          type="tel"
          value={telefono}
          onChange={(e) => setTelefono(e.target.value)}
          placeholder="+57 300 000 0000"
        />
        <Input
          label="Especialidad (opcional)"
          value={especialidad}
          onChange={(e) => setEspecialidad(e.target.value)}
          placeholder="Corte clásico, barba, fade..."
        />

        {isEdit && (
          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-[var(--color-border)] bg-white/[0.02] px-4 py-3">
            <input
              type="checkbox"
              checked={activo}
              onChange={(e) => setActivo(e.target.checked)}
              className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-indigo-500 focus:ring-indigo-500/40"
            />
            <span className="text-sm text-slate-300">Barbero activo en el sistema</span>
          </label>
        )}
      </form>
    </Modal>
  );
}
