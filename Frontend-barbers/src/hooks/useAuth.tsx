import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { api, type Barberia, type Subscription, type User } from '../services/api';

export type { Barberia, User, Subscription };

const SUPER_ADMIN = 'super_admin';

export function getPostLoginPath(rol: string): string {
  return rol === SUPER_ADMIN ? '/matriz/dashboard' : '/dashboard';
}

type AuthContextValue = {
  user: User | null;
  subscription: Subscription | null;
  loading: boolean;
  isAuthenticated: boolean;
  isSuperAdmin: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  updateBarberiaLocal: (barberia: Barberia) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(api.getStoredUser());
  const [subscription, setSubscription] = useState<Subscription | null>(api.getStoredSubscription());
  const [loading, setLoading] = useState(true);

  const applySession = useCallback((nextUser: User, sub?: Subscription | null) => {
    setUser(nextUser);
    api.setStoredUser(nextUser);
    if (sub !== undefined) {
      setSubscription(sub);
      api.setStoredSubscription(sub);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    if (!api.getToken()) {
      setUser(null);
      setSubscription(null);
      return;
    }

    const data = await api.me();
    applySession(data.user, data.subscription ?? null);
  }, [applySession]);

  useEffect(() => {
    const init = async () => {
      try {
        if (api.getToken()) {
          await refreshUser();
        }
      } catch {
        api.setToken(null);
        api.setStoredUser(null);
        api.setStoredSubscription(null);
        setUser(null);
        setSubscription(null);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [refreshUser]);

  const login = useCallback(
    async (email: string, password: string) => {
      const data = await api.login(email, password);
      api.setToken(data.token);
      applySession(data.user, null);

      const me = await api.me();
      applySession(me.user, me.subscription ?? null);

      return me.user;
    },
    [applySession],
  );

  const logout = useCallback(() => {
    api.setToken(null);
    api.setStoredUser(null);
    api.setStoredSubscription(null);
    setUser(null);
    setSubscription(null);
  }, []);

  const updateBarberiaLocal = useCallback((barberia: Barberia) => {
    setUser((prev) => {
      if (!prev) return prev;
      const next = { ...prev, barberia };
      api.setStoredUser(next);
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({
      user,
      subscription,
      loading,
      isAuthenticated: !!user && !!api.getToken(),
      isSuperAdmin: user?.rol === SUPER_ADMIN,
      login,
      logout,
      refreshUser,
      updateBarberiaLocal,
    }),
    [user, subscription, loading, login, logout, refreshUser, updateBarberiaLocal],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return ctx;
}
