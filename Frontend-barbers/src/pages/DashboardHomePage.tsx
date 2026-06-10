import { Link } from 'react-router-dom';
import { Calendar, Images, QrCode, Settings, User, Users } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const ADMIN_ROL = 'admin_barberia';
const BARBERO_ROL = 'barbero';

export function DashboardHomePage() {
  const { user } = useAuth();
  const isAdmin = user?.rol === ADMIN_ROL;
  const isBarbero = user?.rol === BARBERO_ROL;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Bienvenido, {user?.name}</h1>
        <p className="text-slate-400">
          Panel exclusivo de <span className="text-indigo-300">{user?.barberia?.nombre}</span>
        </p>
      </div>

      {isBarbero && (
        <div className="grid gap-4 md:grid-cols-3">
          <div className="card">
            <Calendar className="h-5 w-5 text-indigo-400" />
            <h3 className="mt-3 font-semibold text-white">Mis citas</h3>
            <p className="mt-1 text-sm text-slate-400">
              Confirma reservas pendientes y abre WhatsApp con el mensaje al cliente.
            </p>
            <Link to="/dashboard/mis-citas" className="btn-primary mt-4 inline-flex text-sm">
              Ver citas
            </Link>
          </div>
          <div className="card">
            <QrCode className="h-5 w-5 text-emerald-400" />
            <h3 className="mt-3 font-semibold text-white">Validar servicio</h3>
            <p className="mt-1 text-sm text-slate-400">
              Escanea el QR del cliente al terminar el corte para marcar la cita completada.
            </p>
            <Link to="/dashboard/validar-qr" className="btn-primary mt-4 inline-flex text-sm">
              Escanear QR
            </Link>
          </div>
          <div className="card">
            <User className="h-5 w-5 text-indigo-400" />
            <h3 className="mt-3 font-semibold text-white">Mi perfil</h3>
            <p className="mt-1 text-sm text-slate-400">Teléfono y especialidad visibles en la landing.</p>
            <Link to="/dashboard/mi-perfil" className="btn-primary mt-4 inline-flex text-sm">
              Editar perfil
            </Link>
          </div>
        </div>
      )}

      <div className={`grid gap-4 ${isAdmin ? 'md:grid-cols-2 lg:grid-cols-3' : isBarbero ? 'hidden' : 'md:grid-cols-1'}`}>
        {isAdmin && (
          <>
            <div className="card border-indigo-500/20">
              <Images className="h-5 w-5 text-indigo-400" />
              <h3 className="mt-3 font-semibold text-white">Galería de cortes</h3>
              <p className="mt-1 text-sm text-slate-400">
                Sube hasta 10 fotos de tus mejores trabajos para la landing pública.
              </p>
              <Link to="/dashboard/galeria" className="btn-primary mt-4 inline-flex text-sm">
                Subir fotos
              </Link>
            </div>
            <div className="card">
              <Users className="h-5 w-5 text-indigo-400" />
              <h3 className="mt-3 font-semibold text-white">Equipo de barberos</h3>
              <p className="mt-1 text-sm text-slate-400">
                Da de alta a tu equipo, edita datos y gestiona el acceso de cada barbero.
              </p>
              <Link to="/dashboard/barberos" className="btn-primary mt-4 inline-flex text-sm">
                Gestionar barberos
              </Link>
            </div>
            <div className="card">
              <Settings className="h-5 w-5 text-indigo-400" />
              <h3 className="mt-3 font-semibold text-white">Configura tu barbería</h3>
              <p className="mt-1 text-sm text-slate-400">
                Personaliza textos, colores, logo, banner y contacto de tu landing.
              </p>
              <Link to="/dashboard/configuracion" className="btn-primary mt-4 inline-flex text-sm">
                Ir a configuración
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
