import { Navigate, Outlet } from 'react-router-dom';
import { AlertTriangle, Lock } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export function SubscriptionGuard() {
  const { user, subscription, loading, logout, isSuperAdmin } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--color-surface)]">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  if (isSuperAdmin) {
    return <Navigate to="/matriz/dashboard" replace />;
  }

  if (subscription?.bloqueado) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--color-surface)] p-6">
        <div className="card max-w-md text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-500/15">
            <Lock className="h-7 w-7 text-red-400" />
          </div>
          <h1 className="text-xl font-bold text-white">Acceso suspendido</h1>
          <p className="mt-3 text-slate-400">
            Tu suscripción está vencida. Contacta al administrador.
          </p>
          <p className="mt-2 text-sm text-slate-500">{user?.barberia?.nombre}</p>
          <button type="button" className="btn-ghost mt-6" onClick={logout}>
            Cerrar sesión
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {subscription?.en_gracia && (
        <div className="border-b border-amber-500/30 bg-amber-500/10 px-4 py-3 text-center text-sm text-amber-200">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>
              Tu suscripción está en período de gracia.
              {subscription.etiqueta_dias ? ` ${subscription.etiqueta_dias}.` : ''} Renueva pronto.
            </span>
          </div>
        </div>
      )}
      <Outlet />
    </>
  );
}
