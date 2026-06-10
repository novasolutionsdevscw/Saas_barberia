import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowDownCircle,
  ArrowUpCircle,
  Boxes,
  Loader2,
  Package,
  Plus,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { api, type InventarioResumen, type MovimientoInventario } from '../../services/api';
import { formatMoney } from '../../utils/format';
import { StatCard } from '../ui/StatCard';
import { MovimientoFormModal } from './MovimientoFormModal';

type Props = {
  onToast?: (message: string, type: 'success' | 'error') => void;
};

type Tab = 'resumen' | 'movimientos';

function formatFechaHora(iso?: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' });
}

export function InventarioPanel({ onToast }: Props) {
  const [tab, setTab] = useState<Tab>('resumen');
  const [loading, setLoading] = useState(true);
  const [resumen, setResumen] = useState<InventarioResumen | null>(null);
  const [movimientos, setMovimientos] = useState<MovimientoInventario[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [filtroTipo, setFiltroTipo] = useState<'todos' | 'entrada' | 'salida'>('todos');
  const [filtroProducto, setFiltroProducto] = useState('');

  const loadResumen = useCallback(async () => {
    setResumen(await api.getInventarioResumen());
  }, []);

  const loadMovimientos = useCallback(async () => {
    const params: { tipo?: 'entrada' | 'salida'; producto_id?: number } = {};
    if (filtroTipo !== 'todos') params.tipo = filtroTipo;
    if (filtroProducto) params.producto_id = Number(filtroProducto);
    setMovimientos(await api.getMovimientosInventario(params));
  }, [filtroTipo, filtroProducto]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([loadResumen(), loadMovimientos()]);
    } catch (err) {
      onToast?.(err instanceof Error ? err.message : 'Error al cargar inventario', 'error');
    } finally {
      setLoading(false);
    }
  }, [loadResumen, loadMovimientos, onToast]);

  useEffect(() => {
    load();
  }, [load]);

  const skipFiltroFetch = useRef(true);
  useEffect(() => {
    if (skipFiltroFetch.current) {
      skipFiltroFetch.current = false;
      return;
    }
    loadMovimientos().catch((err) =>
      onToast?.(err instanceof Error ? err.message : 'Error al filtrar', 'error'),
    );
  }, [filtroTipo, filtroProducto, loadMovimientos, onToast]);

  const handleSuccess = (message: string) => {
    onToast?.(message, 'success');
    load();
  };

  const productos = resumen?.productos ?? [];
  const kpi = resumen?.kpi;

  const topActividad = useMemo(() => {
    if (!resumen?.actividad_mes) return [];
    return [...resumen.actividad_mes]
      .filter((p) => p.entradas > 0 || p.salidas > 0)
      .sort((a, b) => b.entradas + b.salidas - (a.entradas + a.salidas))
      .slice(0, 6);
  }, [resumen]);

  if (loading && !resumen) {
    return (
      <div className="flex h-48 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex rounded-xl border border-white/8 p-1">
          {(['resumen', 'movimientos'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                tab === t
                  ? 'bg-indigo-500/20 text-indigo-200'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {t === 'resumen' ? 'Resumen' : 'Movimientos'}
            </button>
          ))}
        </div>
        <button type="button" className="btn-primary" onClick={() => setFormOpen(true)}>
          <Plus className="h-4 w-4" />
          Nuevo movimiento
        </button>
      </div>

      {kpi && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Valor inventario"
            value={formatMoney(kpi.valor_inventario)}
            hint={`${kpi.total_productos} productos`}
            icon={Package}
            tone="success"
          />
          <StatCard
            label="Unidades en stock"
            value={kpi.unidades_totales}
            icon={Boxes}
            tone="info"
          />
          <StatCard
            label="Entradas del mes"
            value={kpi.entradas_mes}
            hint={`Neto: ${kpi.neto_mes >= 0 ? '+' : ''}${kpi.neto_mes}`}
            icon={TrendingUp}
            tone="success"
          />
          <StatCard
            label="Salidas del mes"
            value={kpi.salidas_mes}
            hint={`${kpi.movimientos_mes} movimiento(s)`}
            icon={TrendingDown}
            tone="warning"
          />
        </div>
      )}

      {resumen && resumen.stock_bajo.length > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
          <div>
            <p className="font-medium">Stock bajo (≤ 5 unidades)</p>
            <p className="mt-1 text-amber-200/90">
              {resumen.stock_bajo.map((p) => `${p.nombre} (${p.stock})`).join(' · ')}
            </p>
            <Link
              to="/dashboard/productos"
              className="mt-2 inline-block text-xs font-medium text-amber-300 hover:underline"
            >
              Ir al catálogo de productos →
            </Link>
          </div>
        </div>
      )}

      {tab === 'resumen' ? (
        <div className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {productos.map((p) => {
              const act = resumen?.actividad_mes.find((a) => a.id === p.id);
              return (
                <article
                  key={p.id}
                  className={`rounded-xl border p-4 ${
                    p.stock <= 5
                      ? 'border-amber-500/25 bg-amber-500/5'
                      : 'border-white/8 bg-white/[0.02]'
                  }`}
                >
                  <p className="truncate font-medium text-white">{p.nombre}</p>
                  <p className="mt-2 text-3xl font-bold text-indigo-200">{p.stock}</p>
                  <p className="text-xs text-slate-500">unidades · {formatMoney(Number(p.precio))} c/u</p>
                  {act && (act.entradas > 0 || act.salidas > 0) && (
                    <p className="mt-2 text-xs text-slate-400">
                      Mes: +{act.entradas} / −{act.salidas}
                    </p>
                  )}
                </article>
              );
            })}
          </div>

          {productos.length === 0 && (
            <div className="card text-center">
              <Package className="mx-auto h-10 w-10 text-slate-600" />
              <p className="mt-4 font-medium text-white">Sin productos activos</p>
              <Link to="/dashboard/productos" className="btn-primary mt-4 inline-flex text-sm">
                Crear productos
              </Link>
            </div>
          )}

          {topActividad.length > 0 && (
            <div className="card">
              <h2 className="mb-4 font-semibold text-white">Actividad del mes por producto</h2>
              <div className="space-y-3">
                {topActividad.map((p) => (
                  <div key={p.id} className="flex items-center justify-between gap-4 text-sm">
                    <span className="truncate text-slate-300">{p.nombre}</span>
                    <div className="flex shrink-0 gap-3">
                      <span className="text-emerald-400">+{p.entradas}</span>
                      <span className="text-red-400">−{p.salidas}</span>
                      <span className="text-slate-500">→ {p.stock} u.</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <select
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value as typeof filtroTipo)}
              className="input-field text-sm"
              aria-label="Filtrar por tipo"
            >
              <option value="todos">Todos los tipos</option>
              <option value="entrada">Solo entradas</option>
              <option value="salida">Solo salidas</option>
            </select>
            <select
              value={filtroProducto}
              onChange={(e) => setFiltroProducto(e.target.value)}
              className="input-field min-w-[180px] text-sm"
              aria-label="Filtrar por producto"
            >
              <option value="">Todos los productos</option>
              {productos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre}
                </option>
              ))}
            </select>
          </div>

          {movimientos.length === 0 ? (
            <p className="text-sm text-slate-500">No hay movimientos con estos filtros.</p>
          ) : (
            <>
              {/* Vista móvil: cards */}
              <div className="space-y-3 md:hidden">
                {movimientos.map((m) => (
                  <article
                    key={m.id}
                    className="rounded-xl border border-white/8 bg-white/[0.02] p-4"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium text-white">{m.producto?.nombre ?? '—'}</p>
                      <span
                        className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                          m.tipo === 'entrada'
                            ? 'bg-emerald-500/15 text-emerald-300'
                            : 'bg-red-500/15 text-red-300'
                        }`}
                      >
                        {m.tipo === 'entrada' ? (
                          <ArrowUpCircle className="h-3 w-3" />
                        ) : (
                          <ArrowDownCircle className="h-3 w-3" />
                        )}
                        {m.tipo === 'entrada' ? 'Entrada' : 'Salida'}
                      </span>
                    </div>
                    <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <dt className="text-slate-500">Fecha</dt>
                        <dd className="text-slate-400">{formatFechaHora(m.created_at)}</dd>
                      </div>
                      <div>
                        <dt className="text-slate-500">Cantidad</dt>
                        <dd className="font-semibold text-slate-200">{m.cantidad}</dd>
                      </div>
                      <div>
                        <dt className="text-slate-500">Stock actual</dt>
                        <dd className="text-slate-400">{m.producto?.stock ?? '—'}</dd>
                      </div>
                      {m.descripcion && (
                        <div className="col-span-2">
                          <dt className="text-slate-500">Nota</dt>
                          <dd className="text-slate-500">{m.descripcion}</dd>
                        </div>
                      )}
                    </dl>
                  </article>
                ))}
              </div>

              {/* Vista desktop: tabla */}
              <div className="hidden overflow-x-auto rounded-xl border border-white/8 md:block">
                <table className="w-full min-w-[600px] text-left text-sm">
                <thead>
                  <tr className="border-b border-white/8 bg-white/[0.02] text-slate-400">
                    <th className="px-4 py-3 font-medium">Fecha</th>
                    <th className="px-4 py-3 font-medium">Producto</th>
                    <th className="px-4 py-3 font-medium">Tipo</th>
                    <th className="px-4 py-3 font-medium">Cantidad</th>
                    <th className="px-4 py-3 font-medium">Stock actual</th>
                    <th className="px-4 py-3 font-medium">Nota</th>
                  </tr>
                </thead>
                <tbody>
                  {movimientos.map((m) => (
                    <tr key={m.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                      <td className="px-4 py-3 whitespace-nowrap text-slate-400">
                        {formatFechaHora(m.created_at)}
                      </td>
                      <td className="px-4 py-3 font-medium text-white">
                        {m.producto?.nombre ?? '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                            m.tipo === 'entrada'
                              ? 'bg-emerald-500/15 text-emerald-300'
                              : 'bg-red-500/15 text-red-300'
                          }`}
                        >
                          {m.tipo === 'entrada' ? (
                            <ArrowUpCircle className="h-3 w-3" />
                          ) : (
                            <ArrowDownCircle className="h-3 w-3" />
                          )}
                          {m.tipo === 'entrada' ? 'Entrada' : 'Salida'}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-200">{m.cantidad}</td>
                      <td className="px-4 py-3 text-slate-400">{m.producto?.stock ?? '—'}</td>
                      <td className="max-w-[220px] truncate px-4 py-3 text-slate-500">
                        {m.descripcion || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </>
          )}
        </div>
      )}

      <MovimientoFormModal
        open={formOpen}
        productos={productos}
        onClose={() => setFormOpen(false)}
        onSuccess={handleSuccess}
        onError={(msg) => onToast?.(msg, 'error')}
      />
    </div>
  );
}
