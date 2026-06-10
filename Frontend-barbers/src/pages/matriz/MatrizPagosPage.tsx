import { useCallback, useEffect, useState } from 'react';
import { CreditCard, DollarSign, Loader2 } from 'lucide-react';
import { api, type PagoBarberia } from '../../services/api';
import { MatrizToast } from '../../components/matriz/MatrizToast';
import { usePageToast } from '../../hooks/usePageToast';

export function MatrizPagosPage() {
  const [pagos, setPagos] = useState<PagoBarberia[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const { toast, showToast, hideToast } = usePageToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getMatrizPagos();
      setPagos(data.pagos);
      setTotal(data.total);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error al cargar pagos', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Pagos</h1>
        <p className="text-slate-400">Historial de pagos registrados en el sistema</p>
      </div>

      {toast && <MatrizToast message={toast.message} type={toast.type} onClose={hideToast} />}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="card border-violet-500/10">
          <div className="flex items-center gap-3">
            <DollarSign className="h-5 w-5 text-emerald-400" />
            <div>
              <p className="text-xs text-slate-500">Ingresos totales</p>
              <p className="text-2xl font-bold text-white">${total.toLocaleString('es')}</p>
            </div>
          </div>
        </div>
        <div className="card border-violet-500/10">
          <div className="flex items-center gap-3">
            <CreditCard className="h-5 w-5 text-violet-400" />
            <div>
              <p className="text-xs text-slate-500">Pagos registrados</p>
              <p className="text-2xl font-bold text-white">{pagos.length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="card overflow-hidden border-violet-500/10 p-0">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="mx-auto h-6 w-6 animate-spin text-slate-500" />
          </div>
        ) : pagos.length === 0 ? (
          <p className="px-4 py-12 text-center text-slate-500">Aún no hay pagos registrados.</p>
        ) : (
          <>
            {/* Vista móvil: cards */}
            <div className="space-y-3 p-4 md:hidden">
              {pagos.map((p) => (
                <article
                  key={p.id}
                  className="rounded-xl border border-[var(--color-border)] bg-white/[0.02] p-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium text-white">{p.barberia_nombre}</p>
                      <p className="text-xs text-slate-500">ID #{p.barberia_id}</p>
                    </div>
                    <span className="shrink-0 font-medium text-emerald-300">
                      ${p.monto.toLocaleString('es')}
                    </span>
                  </div>
                  <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <dt className="text-slate-500">Fecha</dt>
                      <dd className="text-slate-300">{p.fecha_pago}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-500">Nuevo vencimiento</dt>
                      <dd className="text-slate-300">{p.nueva_fecha_vencimiento || '—'}</dd>
                    </div>
                    <div className="col-span-2">
                      <dt className="text-slate-500">Registrado por</dt>
                      <dd className="text-slate-400">{p.registrado_por || '—'}</dd>
                    </div>
                  </dl>
                </article>
              ))}
            </div>

            {/* Vista desktop: tabla */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[700px] text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)] bg-white/[0.02] text-xs uppercase text-slate-500">
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Barbería</th>
                <th className="px-4 py-3">Monto</th>
                <th className="px-4 py-3">Nueva vencimiento</th>
                <th className="px-4 py-3">Registrado por</th>
              </tr>
            </thead>
            <tbody>
              {pagos.map((p) => (
                  <tr
                    key={p.id}
                    className="border-b border-[var(--color-border)]/60 hover:bg-white/[0.02]"
                  >
                    <td className="px-4 py-3 text-slate-300">{p.fecha_pago}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-white">{p.barberia_nombre}</p>
                      <p className="text-xs text-slate-500">ID #{p.barberia_id}</p>
                    </td>
                    <td className="px-4 py-3 font-medium text-emerald-300">
                      ${p.monto.toLocaleString('es')}
                    </td>
                    <td className="px-4 py-3 text-slate-300">{p.nueva_fecha_vencimiento || '—'}</td>
                    <td className="px-4 py-3 text-slate-400">{p.registrado_por || '—'}</td>
                  </tr>
                ))}
            </tbody>
          </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
