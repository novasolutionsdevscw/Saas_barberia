import { Link } from 'react-router-dom';
import { ClientesTable } from '../components/clientes/ClientesTable';
import { Toast } from '../components/ui/Toast';
import { useAuth } from '../hooks/useAuth';
import { usePageToast } from '../hooks/usePageToast';

const ADMIN_ROL = 'admin_barberia';

export function ClientesPage() {
  const { user } = useAuth();
  const { toast, showToast, hideToast } = usePageToast();

  if (user?.rol !== ADMIN_ROL) {
    return (
      <div className="card max-w-lg">
        <h1 className="text-xl font-bold text-white">Acceso restringido</h1>
        <Link to="/dashboard" className="btn-primary mt-4 inline-flex text-sm">
          Volver
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Clientes</h1>
        <p className="text-slate-400">
          Personas que eligieron registrarse al reservar en tu landing. Para agendar desde el panel,
          usa{' '}
          <Link to="/dashboard/turnos" className="text-indigo-400 hover:underline">
            Turnos
          </Link>
          .
        </p>
      </div>

      <ClientesTable onToast={showToast} />

      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
    </div>
  );
}
