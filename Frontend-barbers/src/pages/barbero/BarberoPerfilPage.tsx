import { FormEvent, useEffect, useState } from 'react';
import { Loader2, User } from 'lucide-react';
import { api } from '../../services/api';
import { Toast } from '../../components/ui/Toast';
import { useAuth } from '../../hooks/useAuth';
import { usePageToast } from '../../hooks/usePageToast';
import { MediaImage } from '../../components/ui/MediaImage';
import { Input } from '../../components/ui/Input';

export function BarberoPerfilPage() {
  const { user } = useAuth();
  const { toast, showToast, hideToast } = usePageToast();
  const [telefono, setTelefono] = useState('');
  const [especialidad, setEspecialidad] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api
      .getBarberoPerfil()
      .then((res) => {
        setTelefono(res.barbero.telefono ?? '');
        setEspecialidad(res.barbero.especialidad ?? '');
      })
      .catch((err) => showToast(err instanceof Error ? err.message : 'Error', 'error'))
      .finally(() => setLoading(false));
  }, [showToast]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.updateBarberoPerfil({ telefono, especialidad });
      showToast(res.message, 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error al guardar', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
      </div>
    );
  }

  const barbero = user?.barbero;

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Mi perfil</h1>
        <p className="text-slate-400">Datos visibles para tus clientes</p>
      </div>

      <div className="card flex items-center gap-4">
        {barbero?.foto ? (
          <MediaImage
            src={barbero.foto}
            alt={barbero.nombre}
            className="h-20 w-20 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-indigo-500/20 text-indigo-300">
            <User className="h-8 w-8" />
          </div>
        )}
        <div>
          <p className="text-lg font-semibold text-white">{barbero?.nombre ?? user?.name}</p>
          <p className="text-sm text-slate-400">{user?.email}</p>
          <p className="text-xs text-slate-500">{user?.barberia?.nombre}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-4">
        <Input
          label="Teléfono"
          value={telefono}
          onChange={(e) => setTelefono(e.target.value)}
        />
        <Input
          label="Especialidad"
          value={especialidad}
          onChange={(e) => setEspecialidad(e.target.value)}
        />
        <button type="submit" className="btn-primary w-full justify-center" disabled={saving}>
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </form>

      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
    </div>
  );
}
