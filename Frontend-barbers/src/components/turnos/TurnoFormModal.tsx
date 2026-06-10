import { FormEvent, useEffect, useState } from 'react';
import { api, type Barbero, type Cliente, type Servicio, type Turno, type TurnoEstado } from '../../services/api';
import { ESTADOS_TURNO, formatHora } from '../../utils/turnos';
import { todayIsoDate } from '../../utils/horarios';
import { Modal } from '../ui/Modal';
import { ModalAlert } from '../ui/ModalAlert';
import { Input } from '../ui/Input';

type Props = {
  open: boolean;
  mode: 'create' | 'edit';
  turno: Turno | null;
  clientes: Cliente[];
  barberos: Barbero[];
  servicios: Servicio[];
  onClose: () => void;
  onSuccess: (message: string, turno: Turno) => void;
  onError: (message: string) => void;
};

export function TurnoFormModal({
  open,
  mode,
  turno,
  clientes,
  barberos,
  servicios,
  onClose,
  onSuccess,
  onError,
}: Props) {
  const [clienteId, setClienteId] = useState('');
  const [barberoId, setBarberoId] = useState('');
  const [servicioId, setServicioId] = useState('');
  const [fecha, setFecha] = useState('');
  const [hora, setHora] = useState('09:00');
  const [precio, setPrecio] = useState('');
  const [estado, setEstado] = useState<TurnoEstado>('pendiente');
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (!open) return;
    setAlert(null);

    if (mode === 'edit' && turno) {
      setClienteId(String(turno.cliente_id));
      setBarberoId(String(turno.barbero_id));
      setServicioId(String(turno.servicio_id));
      setFecha(turno.fecha?.slice(0, 10) ?? '');
      setHora(formatHora(String(turno.hora)));
      setPrecio(String(turno.precio ?? ''));
      setEstado(turno.estado);
    } else {
      setClienteId(clientes[0] ? String(clientes[0].id) : '');
      setBarberoId(barberos[0] ? String(barberos[0].id) : '');
      setServicioId(servicios[0] ? String(servicios[0].id) : '');
      setFecha(todayIsoDate());
      setHora('09:00');
      setPrecio(servicios[0] ? String(servicios[0].precio) : '');
      setEstado('pendiente');
    }
  }, [open, mode, turno, clientes, barberos, servicios]);

  useEffect(() => {
    const svc = servicios.find((s) => String(s.id) === servicioId);
    if (svc && mode === 'create' && !precio) {
      setPrecio(String(svc.precio));
    }
  }, [servicioId, servicios, mode, precio]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setAlert(null);

    if (!clienteId || !barberoId || !servicioId || !fecha || !hora) {
      setAlert({ message: 'Completa todos los campos obligatorios.', type: 'error' });
      return;
    }

    setLoading(true);
    try {
      const horaNorm = hora.length === 5 ? hora : `${hora}:00`.slice(0, 5);
      const precioNum = precio ? parseFloat(precio) : undefined;

      if (mode === 'create') {
        const res = await api.createAdminTurno({
          cliente_id: Number(clienteId),
          barbero_id: Number(barberoId),
          servicio_id: Number(servicioId),
          fecha,
          hora: horaNorm,
          precio: precioNum,
        });
        onSuccess(res.message, res.data);
      } else if (turno) {
        const res = await api.updateAdminTurno(turno.id, {
          cliente_id: Number(clienteId),
          barbero_id: Number(barberoId),
          servicio_id: Number(servicioId),
          fecha,
          hora: horaNorm,
          estado,
          precio: precioNum,
        });
        onSuccess(res.message, res.data);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al guardar turno';
      setAlert({ message: msg, type: 'error' });
      onError(msg);
    } finally {
      setLoading(false);
    }
  };

  const sinClientes = mode === 'create' && clientes.length === 0;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={mode === 'create' ? 'Nuevo turno' : 'Editar turno'}
      footer={
        <>
          <button type="button" className="btn-ghost" onClick={onClose} disabled={loading}>
            Cancelar
          </button>
          <button
            type="submit"
            form="turno-form"
            className="btn-primary"
            disabled={loading || sinClientes}
          >
            {loading ? 'Guardando...' : mode === 'create' ? 'Crear turno' : 'Guardar'}
          </button>
        </>
      }
    >
      <form id="turno-form" onSubmit={handleSubmit} className="space-y-4">
        {alert && <ModalAlert message={alert.message} type={alert.type} />}

        {sinClientes && (
          <ModalAlert
            type="error"
            message='No hay clientes registrados. Deben reservar desde la landing y marcar "Registrarme".'
          />
        )}

        <div className="space-y-1.5">
          <label htmlFor="turno-cliente" className="text-sm font-medium text-slate-300">
            Cliente
          </label>
          <select
            id="turno-cliente"
            value={clienteId}
            onChange={(e) => setClienteId(e.target.value)}
            className="input-field w-full"
            required
            disabled={sinClientes}
          >
            <option value="">Seleccionar...</option>
            {clientes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre} — {c.telefono}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label htmlFor="turno-barbero" className="text-sm font-medium text-slate-300">
              Barbero
            </label>
            <select
              id="turno-barbero"
              value={barberoId}
              onChange={(e) => setBarberoId(e.target.value)}
              className="input-field w-full"
              required
            >
              {barberos.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="turno-servicio" className="text-sm font-medium text-slate-300">
              Servicio
            </label>
            <select
              id="turno-servicio"
              value={servicioId}
              onChange={(e) => setServicioId(e.target.value)}
              className="input-field w-full"
              required
            >
              {servicios.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label htmlFor="turno-fecha" className="text-sm font-medium text-slate-300">
              Fecha
            </label>
            <input
              id="turno-fecha"
              type="date"
              min={todayIsoDate()}
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="input-field w-full"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="turno-hora" className="text-sm font-medium text-slate-300">
              Hora
            </label>
            <input
              id="turno-hora"
              type="time"
              value={hora}
              onChange={(e) => setHora(e.target.value)}
              className="input-field w-full"
              required
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Input
            label="Precio (opcional)"
            type="number"
            min={0}
            step="1000"
            value={precio}
            onChange={(e) => setPrecio(e.target.value)}
          />
          <p className="text-xs text-slate-500">
            Si lo dejas vacío, el backend usa el precio del servicio.
          </p>
        </div>

        {mode === 'edit' && (
          <div className="space-y-1.5">
            <label htmlFor="turno-estado" className="text-sm font-medium text-slate-300">
              Estado
            </label>
            <select
              id="turno-estado"
              value={estado}
              onChange={(e) => setEstado(e.target.value as TurnoEstado)}
              className="input-field w-full"
            >
              {ESTADOS_TURNO.map((e) => (
                <option key={e.value} value={e.value}>
                  {e.label}
                </option>
              ))}
            </select>
          </div>
        )}
      </form>
    </Modal>
  );
}
