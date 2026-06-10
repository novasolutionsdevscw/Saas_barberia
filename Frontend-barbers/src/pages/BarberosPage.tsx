import { Link } from 'react-router-dom';
import { BarberosTable } from '../components/barberos/BarberosTable';
import { Toast } from '../components/ui/Toast';
import { useAuth } from '../hooks/useAuth';
import { usePageToast } from '../hooks/usePageToast';

const ADMIN_ROL = 'admin_barberia';

export function BarberosPage() {
  const { user } = useAuth();
  const { toast, showToast, hideToast } = usePageToast();

  if (user?.rol !== ADMIN_ROL) {
    return (
      <div className="card max-w-lg">
        <h1 className="text-xl font-bold text-white">Acceso restringido</h1>
        <p className="mt-2 text-sm text-slate-400">
          Solo el administrador de la barbería puede gestionar el equipo de barberos.
        </p>
        <Link to="/dashboard" className="btn-primary mt-4 inline-flex text-sm">
          Volver al inicio
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Barberos</h1>
        <p className="text-slate-400">
          Administra el equipo de tu barbería: altas, edición y desactivación de cuentas
        </p>
      </div>

      <BarberosTable onToast={showToast} />

      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
    </div>
  );
}
