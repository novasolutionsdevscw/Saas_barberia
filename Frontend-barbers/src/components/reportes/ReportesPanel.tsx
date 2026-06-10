import { useCallback, useEffect, useState } from 'react';
import {
  BarChart3,
  Calendar,
  DollarSign,
  Loader2,
  Package,
  Scissors,
  UserCircle,
  Users,
  XCircle,
} from 'lucide-react';
import { api, type ReportesResponse } from '../../services/api';
import { formatMoney, monthRange } from '../../utils/format';
import { formatFecha, formatHora, formatPrecioTurno } from '../../utils/turnos';
import { PeriodFilter, type PeriodValue } from '../ui/PeriodFilter';
import { SimpleBarChart } from '../ui/SimpleBarChart';
import { StatCard } from '../ui/StatCard';
import { TurnoEstadoBadge } from '../turnos/TurnoEstadoBadge';
import type { TurnoEstado } from '../../services/api';

type Props = {
  onToast?: (message: string, type: 'success' | 'error') => void;
};

const initialPeriod = (): PeriodValue => {
  const r = monthRange(0);
  return { preset: 'mes_actual', desde: r.desde, hasta: r.hasta };
};

export function ReportesPanel({ onToast }: Props) {
  const [period, setPeriod] = useState<PeriodValue>(initialPeriod);
  const [data, setData] = useState<ReportesResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await api.getReportes({ desde: period.desde, hasta: period.hasta }));
    } catch (err) {
      onToast?.(err instanceof Error ? err.message : 'Error al cargar reportes', 'error');
    } finally {
      setLoading(false);
    }
  }, [period.desde, period.hasta, onToast]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading && !data) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
      </div>
    );
  }

  if (!data) return null;

  const { resumen } = data;

  const estadoChart = [
    { label: 'Pendientes', value: resumen.turnos_pendientes },
    { label: 'Confirmados', value: resumen.turnos_confirmados },
    { label: 'Completados', value: resumen.turnos_completados },
    { label: 'Cancelados', value: resumen.turnos_cancelados },
  ].filter((i) => i.value > 0);

  const diasChart = data.turnos_por_dia.map((d) => ({
    label: formatFecha(d.fecha).slice(0, 5),
    value: d.total,
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PeriodFilter value={period} onChange={setPeriod} />
        <button
          type="button"
          className="btn-ghost text-sm"
          onClick={load}
          disabled={loading}
        >
          {loading ? 'Actualizando...' : 'Actualizar'}
        </button>
      </div>

      <p className="text-sm text-slate-500">
        Periodo: <span className="text-slate-300">{data.periodo.desde}</span> —{' '}
        <span className="text-slate-300">{data.periodo.hasta}</span>
      </p>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Ingresos"
          value={formatMoney(resumen.ingresos)}
          hint="Turnos confirmados y completados"
          icon={DollarSign}
          tone="success"
        />
        <StatCard
          label="Turnos"
          value={resumen.turnos_total}
          hint={`Ticket prom. ${formatMoney(resumen.ticket_promedio)}`}
          icon={Calendar}
          tone="info"
        />
        <StatCard
          label="Clientes registrados"
          value={resumen.clientes_registrados}
          icon={UserCircle}
        />
        <StatCard
          label="Equipo"
          value={resumen.barberos_activos}
          hint={`${resumen.servicios_activos} servicios activos`}
          icon={Users}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card">
          <div className="mb-4 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-indigo-400" />
            <h2 className="font-semibold text-white">Turnos por estado</h2>
          </div>
          <SimpleBarChart items={estadoChart} />
        </div>

        <div className="card">
          <div className="mb-4 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-indigo-400" />
            <h2 className="font-semibold text-white">Actividad por día</h2>
          </div>
          <SimpleBarChart items={diasChart} emptyMessage="Sin turnos en este periodo" />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card">
          <div className="mb-4 flex items-center gap-2">
            <Users className="h-5 w-5 text-indigo-400" />
            <h2 className="font-semibold text-white">Por barbero</h2>
          </div>
          <SimpleBarChart
            items={data.por_barbero.map((b) => ({
              label: b.nombre,
              value: b.total,
              sublabel: formatMoney(b.ingresos),
            }))}
            emptyMessage="Sin datos de barberos"
          />
        </div>

        <div className="card">
          <div className="mb-4 flex items-center gap-2">
            <Scissors className="h-5 w-5 text-indigo-400" />
            <h2 className="font-semibold text-white">Por servicio</h2>
          </div>
          <SimpleBarChart
            items={data.por_servicio.map((s) => ({
              label: s.nombre,
              value: s.total,
              sublabel: formatMoney(s.ingresos),
            }))}
            emptyMessage="Sin datos de servicios"
          />
        </div>
      </div>

      <div className="card">
        <div className="mb-4 flex items-center gap-2">
          <Package className="h-5 w-5 text-amber-400" />
          <h2 className="font-semibold text-white">Inventario en el periodo</h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard label="Productos" value={data.inventario.total_productos} />
          <StatCard label="Unidades en stock" value={data.inventario.unidades_stock} tone="info" />
          <StatCard
            label="Valor inventario"
            value={formatMoney(data.inventario.valor_inventario)}
            tone="success"
          />
          <StatCard
            label="Entradas"
            value={data.inventario.entradas_periodo}
            hint="Unidades ingresadas"
          />
          <StatCard
            label="Salidas"
            value={data.inventario.salidas_periodo}
            hint={`${data.inventario.stock_bajo} con stock bajo`}
            tone={data.inventario.stock_bajo > 0 ? 'warning' : 'default'}
          />
        </div>
      </div>

      <div className="card">
        <h2 className="mb-4 font-semibold text-white">Últimos turnos</h2>
        {data.ultimos_turnos.length === 0 ? (
          <p className="text-sm text-slate-500">No hay turnos registrados.</p>
        ) : (
          <>
            {/* Vista móvil: cards */}
            <div className="space-y-3 md:hidden">
              {data.ultimos_turnos.map((t) => (
                <article
                  key={t.id}
                  className="rounded-xl border border-white/8 bg-white/[0.02] p-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm text-slate-300">
                        {formatFecha(t.fecha)} {formatHora(t.hora)}
                      </p>
                      <p className="mt-1 font-medium text-white">{t.cliente ?? '—'}</p>
                    </div>
                    <TurnoEstadoBadge estado={t.estado as TurnoEstado} />
                  </div>
                  <dl className="mt-2 grid grid-cols-2 gap-1 text-xs">
                    <div>
                      <dt className="text-slate-500">Barbero</dt>
                      <dd className="truncate text-slate-400">{t.barbero ?? '—'}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-500">Servicio</dt>
                      <dd className="truncate text-slate-400">{t.servicio ?? '—'}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-500">Precio</dt>
                      <dd className="text-slate-300">{formatPrecioTurno(t.precio)}</dd>
                    </div>
                  </dl>
                </article>
              ))}
            </div>

            {/* Vista desktop: tabla */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-white/8 text-slate-400">
                  <th className="pb-2 pr-4 font-medium">Fecha</th>
                  <th className="pb-2 pr-4 font-medium">Cliente</th>
                  <th className="pb-2 pr-4 font-medium">Barbero</th>
                  <th className="pb-2 pr-4 font-medium">Servicio</th>
                  <th className="pb-2 pr-4 font-medium">Estado</th>
                  <th className="pb-2 font-medium text-right">Precio</th>
                </tr>
              </thead>
              <tbody>
                {data.ultimos_turnos.map((t) => (
                  <tr key={t.id} className="border-b border-white/5">
                    <td className="py-2.5 pr-4 text-slate-300">
                      {formatFecha(t.fecha)} {formatHora(t.hora)}
                    </td>
                    <td className="py-2.5 pr-4 text-white">{t.cliente ?? '—'}</td>
                    <td className="py-2.5 pr-4 text-slate-400">{t.barbero ?? '—'}</td>
                    <td className="py-2.5 pr-4 text-slate-400">{t.servicio ?? '—'}</td>
                    <td className="py-2.5 pr-4">
                      <TurnoEstadoBadge estado={t.estado as TurnoEstado} />
                    </td>
                    <td className="py-2.5 text-right text-slate-300">
                      {formatPrecioTurno(t.precio)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </>
        )}
      </div>

      {resumen.turnos_cancelados > 0 && (
        <div className="flex items-start gap-2 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-200/90">
          <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            {resumen.turnos_cancelados} turno(s) cancelado(s) en el periodo — revisa la agenda en
            Turnos si necesitas reprogramar.
          </span>
        </div>
      )}
    </div>
  );
}
