import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  UserCircle,
  Calendar,
  Scissors,
  Package,
  Boxes,
  BarChart3,
  Settings,
  Images,
  LogOut,
  Menu,
  X,
  QrCode,
  User,
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { mediaUrl } from '../utils/mediaUrl';

const ADMIN_ROL = 'admin_barberia';
const BARBERO_ROL = 'barbero';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/dashboard/mis-citas', label: 'Mis citas', icon: Calendar, barberoOnly: true },
  { to: '/dashboard/validar-qr', label: 'Validar QR', icon: QrCode, barberoOnly: true },
  { to: '/dashboard/mi-perfil', label: 'Mi perfil', icon: User, barberoOnly: true },
  { to: '/dashboard/barberos', label: 'Barberos', icon: Users, adminOnly: true },
  { to: '/dashboard/clientes', label: 'Clientes', icon: UserCircle, adminOnly: true },
  { to: '/dashboard/turnos', label: 'Turnos', icon: Calendar, adminOnly: true },
  { to: '/dashboard/servicios', label: 'Servicios', icon: Scissors, adminOnly: true },
  { to: '/dashboard/productos', label: 'Productos', icon: Package, adminOnly: true },
  { to: '/dashboard/inventario', label: 'Inventario', icon: Boxes, adminOnly: true },
  { to: '/dashboard/reportes', label: 'Reportes', icon: BarChart3, adminOnly: true },
  { to: '/dashboard/galeria', label: 'Galería cortes', icon: Images, adminOnly: true },
  { to: '/dashboard/configuracion', label: 'Configuración', icon: Settings, adminOnly: true },
];

const SIDEBAR_WIDTH = 'w-64';

export function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const barberiaNombre = user?.barberia?.nombre || 'Mi Barbería';
  const barberiaLogo = mediaUrl(user?.barberia?.logo);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="h-screen overflow-hidden bg-[var(--color-surface)]">
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex ${SIDEBAR_WIDTH} flex-col border-r border-[var(--color-border)] bg-[var(--color-surface-elevated)] transition-transform duration-300 ease-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-[var(--color-border)] px-5">
          <div className="flex min-w-0 items-center gap-2">
            {barberiaLogo ? (
              <img
                src={barberiaLogo}
                alt="Logo"
                className="h-8 w-8 shrink-0 rounded-lg object-cover"
              />
            ) : (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-300">
                <Scissors className="h-4 w-4" />
              </div>
            )}
            <span className="truncate text-sm font-semibold">{barberiaNombre}</span>
          </div>
          <button
            className="shrink-0 lg:hidden"
            onClick={() => setSidebarOpen(false)}
            type="button"
            aria-label="Cerrar menú"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto p-3">
          {navItems
            .filter((item) => {
              if (user?.rol === BARBERO_ROL) {
                return item.end === true || ('barberoOnly' in item && item.barberoOnly);
              }
              if ('barberoOnly' in item && item.barberoOnly) return false;
              if ('adminOnly' in item && item.adminOnly) return user?.rol === ADMIN_ROL;
              return true;
            })
            .map((item) => (
            <NavLink
              key={item.to}
              to={item.disabled ? '#' : item.to}
              end={item.end}
              onClick={(e) => {
                if (item.disabled) e.preventDefault();
                else setSidebarOpen(false);
              }}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
                  item.disabled
                    ? 'cursor-not-allowed text-slate-600'
                    : isActive
                      ? 'bg-indigo-500/15 text-indigo-200'
                      : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                }`
              }
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
              {item.disabled && (
                <span className="ml-auto text-[10px] uppercase text-slate-600">Pronto</span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="shrink-0 border-t border-[var(--color-border)] p-3">
          <button
            type="button"
            onClick={handleLogout}
            className="btn-ghost w-full justify-start text-red-300 hover:text-red-200"
          >
            <LogOut className="h-4 w-4" />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden
        />
      )}

      <div className="flex h-screen min-w-0 flex-col overflow-hidden lg:pl-64">
        <header className="flex h-16 shrink-0 items-center justify-between gap-4 border-b border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-4 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button
              className="shrink-0 lg:hidden"
              onClick={() => setSidebarOpen(true)}
              type="button"
              aria-label="Abrir menú"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="min-w-0">
              <p className="text-xs text-slate-500">Panel de barbería</p>
              <h2 className="truncate font-semibold text-white">{barberiaNombre}</h2>
            </div>
          </div>
          <div className="shrink-0 text-right text-sm">
            <p className="max-w-[140px] truncate font-medium text-slate-200 sm:max-w-none">
              {user?.name}
            </p>
            <p className="text-xs capitalize text-slate-500">{user?.rol?.replace('_', ' ')}</p>
          </div>
        </header>

        <main className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
