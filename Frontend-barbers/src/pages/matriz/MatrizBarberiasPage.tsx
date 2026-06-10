import { BarberiasTable } from '../../components/matriz/BarberiasTable';
import { MatrizToast } from '../../components/matriz/MatrizToast';
import { usePageToast } from '../../hooks/usePageToast';

export function MatrizBarberiasPage() {
  const { toast, showToast, hideToast } = usePageToast();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Barberías</h1>
        <p className="text-slate-400">Registro y gestión de todas las barberías del sistema</p>
      </div>

      <BarberiasTable onToast={showToast} />

      {toast && <MatrizToast message={toast.message} type={toast.type} onClose={hideToast} />}
    </div>
  );
}
