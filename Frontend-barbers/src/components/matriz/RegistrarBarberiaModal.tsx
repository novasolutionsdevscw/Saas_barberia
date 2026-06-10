import { FormEvent, useState } from 'react';
import { UserPlus } from 'lucide-react';
import { api, type BarberiaMatriz } from '../../services/api';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { PasswordInput } from '../ui/PasswordInput';

type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess: (message: string, barberia: BarberiaMatriz) => void;
  onError: (message: string) => void;
};

export function RegistrarBarberiaModal({ open, onClose, onSuccess, onError }: Props) {
  const [name, setName] = useState('');
  const [nombreBarberia, setNombreBarberia] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const reset = () => {
    setName('');
    setNombreBarberia('');
    setEmail('');
    setPassword('');
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await api.matrizRegistrarBarberia({
        name,
        email,
        password,
        nombre_barberia: nombreBarberia.trim() || undefined,
      });
      onSuccess(res.message, res.barberia);
      reset();
      onClose();
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Error al registrar barbería');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Registrar barbería"
      footer={
        <>
          <button type="button" className="btn-ghost" onClick={handleClose}>
            Cancelar
          </button>
          <button type="submit" form="registrar-barberia-form" className="btn-primary" disabled={loading}>
            <UserPlus className="h-4 w-4" />
            {loading ? 'Registrando...' : 'Registrar'}
          </button>
        </>
      }
    >
      <form id="registrar-barberia-form" onSubmit={handleSubmit} className="space-y-4">
        <p className="text-slate-400">
          Crea una nueva barbería con su administrador. Se generará un código QR con el ID al
          finalizar.
        </p>
        <Input
          label="Nombre del administrador"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Wilmer García"
          required
        />
        <Input
          label="Nombre de la barbería (opcional)"
          value={nombreBarberia}
          onChange={(e) => setNombreBarberia(e.target.value)}
          placeholder="Barbería Nova Centro"
        />
        <Input
          label="Correo del administrador"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="admin@barberia.com"
          required
        />
        <PasswordInput
          label="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Mínimo 8 caracteres"
          minLength={8}
          required
          autoComplete="new-password"
        />
      </form>
    </Modal>
  );
}
