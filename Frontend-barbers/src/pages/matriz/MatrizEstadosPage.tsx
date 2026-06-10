import { useEffect, useState } from 'react';
import { Activity, Loader2 } from 'lucide-react';
import { api, type BarberiaMatriz, type MatrizEstadosResponse } from '../../services/api';
import { MatrizToast } from '../../components/matriz/MatrizToast';
import { estadoPagoColor, estadoSistemaColor, formatEstadoLabel } from '../../utils/matrizStatus';

function BarberiaMiniList({ items }: { items: BarberiaMatriz[] }) {
  if (items.length === 0) {
    return <p className="text-sm text-slate-500">Ninguna barbería</p>;
  }

  return (
    <ul className="space-y-2">
      {items.map((b) => (
        <li
          key={b.id}
          className="flex items-center justify-between rounded-lg border border-[var(--color-border)]/60 bg-white/[0.02] px-3 py-2"
        >
          <div>
            <p className="text-sm font-medium text-white">{b.nombre}</p>
            <p className="text-xs text-slate-500">ID #{b.id}</p>
          </div>
          <span className="text-xs text-slate-400">{b.etiqueta_dias || '—'}</span>
        </li>
      ))}
    </ul>
  );
}

export function MatrizEstadosPage() {
  const [data, setData] = useState<MatrizEstadosResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .getMatrizEstados()
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

  const cards = [
    { label: 'Activas', value: data.resumen.activo, color: 'text-emerald-400 border-emerald-500/30' },
    { label: 'En gracia', value: data.resumen.en_gracia, color: 'text-amber-400 border-amber-500/30' },
    { label: 'Bloqueadas', value: data.resumen.bloqueado, color: 'text-red-400 border-red-500/30' },
    { label: 'Pago pagado', value: data.resumen.pagado, color: 'text-emerald-400 border-emerald-500/30' },
    { label: 'Pago pendiente', value: data.resumen.pendiente, color: 'text-amber-400 border-amber-500/30' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Estados</h1>
        <p className="text-slate-400">Monitoreo del estado de pago y del sistema por barbería</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {cards.map((c) => (
          <div key={c.label} className={`card border ${c.color.split(' ')[1]}`}>
            <p className="text-xs text-slate-500">{c.label}</p>
            <p className={`mt-2 text-2xl font-bold ${c.color.split(' ')[0]}`}>{c.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {(['activo', 'en_gracia', 'bloqueado'] as const).map((estado) => (
          <div key={estado} className="card border-violet-500/10">
            <div className="mb-4 flex items-center gap-2">
              <Activity className="h-4 w-4 text-violet-400" />
              <h2 className="font-semibold text-white">Sistema: </h2>
              <span
                className={`rounded-full border px-2 py-0.5 text-xs capitalize ${estadoSistemaColor(estado)}`}
              >
                {formatEstadoLabel(estado)}
              </span>
            </div>
            <BarberiaMiniList items={data.por_sistema[estado] || []} />
          </div>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {(['pagado', 'pendiente'] as const).map((estado) => (
          <div key={estado} className="card border-violet-500/10">
            <h2 className="mb-4 font-semibold text-white">
              Pago:{' '}
              <span
                className={`ml-2 rounded-full border px-2 py-0.5 text-xs capitalize ${estadoPagoColor(estado)}`}
              >
                {estado}
              </span>
            </h2>
            <BarberiaMiniList items={data.por_pago[estado] || []} />
          </div>
        ))}
      </div>
    </div>
  );
}
