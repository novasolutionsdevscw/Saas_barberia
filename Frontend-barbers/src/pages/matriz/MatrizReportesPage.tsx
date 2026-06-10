import { useEffect, useState } from 'react';
import { BarChart3, Loader2, AlertTriangle } from 'lucide-react';
import { api, type MatrizReportesResponse } from '../../services/api';
import { MatrizToast } from '../../components/matriz/MatrizToast';
import { StatsCards } from '../../components/matriz/StatsCards';

export function MatrizReportesPage() {
  const [data, setData] = useState<MatrizReportesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .getMatrizReportes()
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : 'Error al cargar'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-violet-400" />
      </div>
    );
  }

  if (error) {
    return <MatrizToast message={error} type="error" />;
  }

  if (!data) return null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Reportes</h1>
        <p className="text-slate-400">Análisis global del ecosistema Barber Nova</p>
      </div>

      <StatsCards stats={data.stats} />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="card border-violet-500/10">
          <div className="flex items-center gap-2 text-violet-400">
            <BarChart3 className="h-5 w-5" />
            <h3 className="font-semibold text-white">Este mes</h3>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-slate-500">Pagos del mes</p>
              <p className="text-xl font-bold text-white">{data.pagos_mes}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Ingresos del mes</p>
              <p className="text-xl font-bold text-emerald-300">
                ${data.ingresos_mes.toLocaleString('es')}
              </p>
            </div>
          </div>
        </div>

        <div className="card border-amber-500/20">
          <div className="flex items-center gap-2 text-amber-400">
            <AlertTriangle className="h-5 w-5" />
            <h3 className="font-semibold text-white">Alertas</h3>
          </div>
          <div className="mt-4 space-y-2 text-sm">
            <p className="text-slate-300">
              <span className="font-medium text-amber-300">{data.proximas_vencer.length}</span>{' '}
              barberías vencen en 7 días o menos
            </p>
            <p className="text-slate-300">
              <span className="font-medium text-red-300">{data.vencidas.length}</span> barberías con
              suscripción vencida
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card border-violet-500/10">
          <h3 className="mb-4 font-semibold text-white">Próximas a vencer</h3>
          {data.proximas_vencer.length === 0 ? (
            <p className="text-sm text-slate-500">Sin alertas próximas.</p>
          ) : (
            <ul className="space-y-2">
              {data.proximas_vencer.map((b) => (
                <li
                  key={b.id}
                  className="flex justify-between rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-sm"
                >
                  <span className="text-white">{b.nombre}</span>
                  <span className="text-amber-300">{b.etiqueta_dias}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card border-violet-500/10">
          <h3 className="mb-4 font-semibold text-white">Vencidas</h3>
          {data.vencidas.length === 0 ? (
            <p className="text-sm text-slate-500">Ninguna barbería vencida.</p>
          ) : (
            <ul className="space-y-2">
              {data.vencidas.map((b) => (
                <li
                  key={b.id}
                  className="flex justify-between rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2 text-sm"
                >
                  <span className="text-white">{b.nombre}</span>
                  <span className="text-red-300">{b.etiqueta_dias}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="card border-violet-500/10">
        <h3 className="mb-4 font-semibold text-white">Últimos pagos</h3>
        {data.ultimos_pagos.length === 0 ? (
          <p className="text-sm text-slate-500">Sin pagos registrados.</p>
        ) : (
          <>
            {/* Vista móvil: cards */}
            <div className="space-y-2 md:hidden">
              {data.ultimos_pagos.map((p) => (
                <article
                  key={p.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-[var(--color-border)]/40 bg-white/[0.02] px-3 py-2.5 text-sm"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-white">{p.barberia_nombre}</p>
                    <p className="text-xs text-slate-500">{p.fecha_pago}</p>
                  </div>
                  <span className="shrink-0 font-medium text-emerald-300">${p.monto}</span>
                </article>
              ))}
            </div>

            {/* Vista desktop: tabla */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-xs uppercase text-slate-500">
                  <th className="pb-2">Fecha</th>
                  <th className="pb-2">Barbería</th>
                  <th className="pb-2">Monto</th>
                </tr>
              </thead>
              <tbody>
                {data.ultimos_pagos.map((p) => (
                  <tr key={p.id} className="border-t border-[var(--color-border)]/40">
                    <td className="py-2 text-slate-300">{p.fecha_pago}</td>
                    <td className="py-2 text-white">{p.barberia_nombre}</td>
                    <td className="py-2 text-emerald-300">${p.monto}</td>
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
