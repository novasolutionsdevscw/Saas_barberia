import { useCallback, useEffect, useState } from 'react';
import { api, type MatrizStats } from '../../services/api';
import { StatsCards } from '../../components/matriz/StatsCards';
import { BarberiasTable } from '../../components/matriz/BarberiasTable';
import { MatrizToast } from '../../components/matriz/MatrizToast';
import { usePageToast } from '../../hooks/usePageToast';

export function MatrizDashboardPage() {
  const [stats, setStats] = useState<MatrizStats | null>(null);
  const { toast, showToast, hideToast } = usePageToast();

  const loadStats = useCallback(async () => {
    try {
      const data = await api.getMatrizDashboard();
      setStats(data.stats);
    } catch {
      /* opcional */
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const handleToast = useCallback(
    (message: string, type: 'success' | 'error') => {
      showToast(message, type);
      loadStats();
    },
    [loadStats, showToast],
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Panel global</h1>
        <p className="text-slate-400">Resumen y control de todas las barberías del sistema</p>
      </div>

      {stats && <StatsCards stats={stats} />}

      <div>
        <h2 className="mb-4 text-lg font-semibold text-white">Barberías registradas</h2>
        <BarberiasTable onToast={handleToast} />
      </div>

      {toast && <MatrizToast message={toast.message} type={toast.type} onClose={hideToast} />}
    </div>
  );
}
