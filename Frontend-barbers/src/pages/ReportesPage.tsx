import { Link } from 'react-router-dom';
import { ReportesPanel } from '../components/reportes/ReportesPanel';
import { Toast } from '../components/ui/Toast';
import { useAuth } from '../hooks/useAuth';
import { usePageToast } from '../hooks/usePageToast';

const ADMIN_ROL = 'admin_barberia';

export function ReportesPage() {
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
        <h1 className="text-2xl font-bold text-white">Reportes</h1>
        <p className="text-slate-400">
          Métricas de turnos, ingresos, rendimiento por barbero/servicio e inventario.
        </p>
      </div>

      <ReportesPanel onToast={showToast} />

      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
    </div>
  );
}
