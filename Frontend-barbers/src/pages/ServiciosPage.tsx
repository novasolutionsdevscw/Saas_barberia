import { Link } from 'react-router-dom';
import { ServiciosTable } from '../components/servicios/ServiciosTable';
import { Toast } from '../components/ui/Toast';
import { useAuth } from '../hooks/useAuth';
import { usePageToast } from '../hooks/usePageToast';

const ADMIN_ROL = 'admin_barberia';

export function ServiciosPage() {
  const { user } = useAuth();
  const { toast, showToast, hideToast } = usePageToast();

  if (user?.rol !== ADMIN_ROL) {
    return (
      <div className="card max-w-lg">
        <h1 className="text-xl font-bold text-white">Acceso restringido</h1>
        <p className="mt-2 text-sm text-slate-400">
          Solo el administrador de la barbería puede gestionar los servicios.
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
        <h1 className="text-2xl font-bold text-white">Servicios</h1>
        <p className="text-slate-400">
          Catálogo de servicios con precio y duración; se muestran en tu landing pública
        </p>
      </div>

      <ServiciosTable onToast={showToast} />

      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
    </div>
  );
}
