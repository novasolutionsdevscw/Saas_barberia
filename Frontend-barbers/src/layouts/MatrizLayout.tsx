import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Scissors,
  CreditCard,
  Activity,
  BarChart3,
  LogOut,
  Menu,
  X,
  Shield,
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

const navItems = [
  { to: '/matriz/dashboard', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/matriz/barberias', label: 'Barberías', icon: Scissors },
  { to: '/matriz/pagos', label: 'Pagos', icon: CreditCard },
  { to: '/matriz/estados', label: 'Estados', icon: Activity },
  { to: '/matriz/reportes', label: 'Reportes', icon: BarChart3 },
];

const SIDEBAR_WIDTH = 'w-64';

export function MatrizLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const sidebarContent = (
    <>
      <div className="shrink-0 border-b border-violet-500/20 px-5 py-5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/20 text-violet-300">
              <Shield className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wider text-violet-400">
                Panel Matriz
              </p>
              <p className="truncate text-sm font-semibold text-white">Barber Nova</p>
            </div>
          </div>
          <button
            type="button"
            className="shrink-0 rounded-lg p-1 text-slate-400 hover:bg-white/5 hover:text-white lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-label="Cerrar menú"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto p-3">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
                isActive
                  ? 'bg-violet-500/20 text-violet-200'
                  : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
              }`
            }
          >
            <item.icon className="h-4 w-4 shrink-0" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="shrink-0 border-t border-violet-500/20 p-3">
        <button
          type="button"
          onClick={handleLogout}
          className="btn-ghost w-full justify-start text-red-300 hover:text-red-200"
        >
          <LogOut className="h-4 w-4" />
          Cerrar sesión
        </button>
      </div>
    </>
  );

  return (
    <div className="h-screen overflow-hidden bg-[var(--color-surface)]">
      {/* Sidebar fijo — no se mueve con el scroll del contenido */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex ${SIDEBAR_WIDTH} flex-col border-r border-violet-500/20 bg-[#12101f] transition-transform duration-300 ease-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebarContent}
      </aside>

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden
        />
      )}

      {/* Columna principal: header fijo + solo main con scroll */}
      <div className={`flex h-screen min-w-0 flex-col overflow-hidden lg:pl-64`}>
        <header className="flex h-16 shrink-0 items-center justify-between gap-4 border-b border-violet-500/20 bg-[#12101f] px-4 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button
              className="shrink-0 rounded-lg p-1 hover:bg-white/5 lg:hidden"
              onClick={() => setSidebarOpen(true)}
              type="button"
              aria-label="Abrir menú"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="min-w-0">
              <p className="truncate text-xs text-violet-400">Control global del sistema</p>
              <h2 className="truncate font-semibold text-white">Matriz Administrativa</h2>
            </div>
          </div>
          <div className="shrink-0 text-right text-sm">
            <p className="max-w-[140px] truncate font-medium text-slate-200 sm:max-w-none">
              {user?.name}
            </p>
            <p className="text-xs text-violet-400">Super administrador</p>
          </div>
        </header>

        <main className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
