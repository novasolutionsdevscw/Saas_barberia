import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const SUPER_ADMIN = 'super_admin';

export function OperationalProtectedRoute() {
  const location = useLocation();
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--color-surface)]">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname + location.search }}
      />
    );
  }

  if (user?.rol === SUPER_ADMIN) {
    return <Navigate to="/matriz/dashboard" replace />;
  }

  return <Outlet />;
}
