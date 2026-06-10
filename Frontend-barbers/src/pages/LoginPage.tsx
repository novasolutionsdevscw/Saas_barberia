import { FormEvent, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import { getPostLoginPath, useAuth } from '../hooks/useAuth';
import { Input } from '../components/ui/Input';
import { PasswordInput } from '../components/ui/PasswordInput';

export function LoginPage() {
  const { login, isAuthenticated, user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loadingForm, setLoadingForm] = useState(false);

  const loginState = location.state as { restricted?: string; from?: string } | null;
  const restrictedMessage = loginState?.restricted;
  const redirectTo = loginState?.from;

  useEffect(() => {
    if (!loading && isAuthenticated && user) {
      navigate(redirectTo || getPostLoginPath(user.rol), { replace: true });
    }
  }, [loading, isAuthenticated, user, navigate, redirectTo]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoadingForm(true);

    try {
      const loggedUser = await login(email, password);
      navigate(redirectTo || getPostLoginPath(loggedUser.rol), { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesión');
    } finally {
      setLoadingForm(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-white">Iniciar sesión</h2>
      <p className="mt-1 text-sm text-slate-400">
        Accede al panel de tu barbería o al panel Matriz (super admin)
      </p>

      {restrictedMessage && (
        <p className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
          {restrictedMessage}
        </p>
      )}

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <Input
          label="Correo electrónico"
          type="email"
          name="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="admin@barberia.com"
          required
          autoComplete="email"
        />
        <PasswordInput
          label="Contraseña"
          name="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          required
          autoComplete="current-password"
        />

        {error && (
          <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
            {error}
          </p>
        )}

        <button type="submit" className="btn-primary w-full" disabled={loadingForm}>
          <LogIn className="h-4 w-4" />
          {loadingForm ? 'Ingresando...' : 'Entrar'}
        </button>
      </form>
    </div>
  );
}
