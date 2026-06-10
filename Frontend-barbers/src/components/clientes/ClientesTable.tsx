import { useCallback, useEffect, useMemo, useState } from 'react';
import { Loader2, Search, UserCircle } from 'lucide-react';
import { api, type ClienteAdmin } from '../../services/api';
import { formatFecha } from '../../utils/turnos';

type Props = {
  onToast?: (message: string, type: 'success' | 'error') => void;
};

export function ClientesTable({ onToast }: Props) {
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [clientes, setClientes] = useState<ClienteAdmin[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setClientes(await api.getAdminClientes());
    } catch (err) {
      onToast?.(err instanceof Error ? err.message : 'Error al cargar clientes', 'error');
    } finally {
      setLoading(false);
    }
  }, [onToast]);

  useEffect(() => {
    load();
  }, [load]);

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return clientes;
    return clientes.filter(
      (c) =>
        c.nombre.toLowerCase().includes(q) ||
        c.telefono.includes(q) ||
        (c.email?.toLowerCase().includes(q) ?? false),
    );
  }, [clientes, busqueda]);

  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        <input
          type="search"
          placeholder="Buscar por nombre, teléfono o email..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="input-field w-full pl-10"
        />
      </div>

      <p className="text-sm text-slate-400">
        {filtrados.length} cliente{filtrados.length === 1 ? '' : 's'} registrado
        {filtrados.length === 1 ? '' : 's'} desde la reserva online
      </p>

      {filtrados.length === 0 ? (
        <div className="card flex flex-col items-center py-12 text-center">
          <UserCircle className="h-10 w-10 text-slate-600" />
          <p className="mt-4 font-medium text-white">Sin clientes registrados</p>
          <p className="mt-1 max-w-md text-sm text-slate-400">
            Solo aparecen quienes marcaron &quot;Registrarme&quot; al reservar en tu landing.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtrados.map((c) => (
            <article
              key={c.id}
              className="rounded-xl border border-white/8 bg-white/[0.02] p-4 transition hover:border-white/12"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-500/15 text-indigo-300">
                  <UserCircle className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-semibold text-white">{c.nombre}</h3>
                  <p className="text-sm text-slate-400">{c.telefono}</p>
                  {c.email && <p className="truncate text-xs text-slate-500">{c.email}</p>}
                </div>
              </div>
              <dl className="mt-4 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <dt className="text-slate-500">Turnos</dt>
                  <dd className="font-medium text-slate-200">{c.total_turnos}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Última cita</dt>
                  <dd className="font-medium text-slate-200">
                    {c.ultima_fecha ? formatFecha(c.ultima_fecha) : '—'}
                  </dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
