import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { authService } from '../services/domains/authService';
import { UNAUTHORIZED_EVENT } from '../services/axiosConfig';
import type { CurrentUser } from '../types/auth';
import { tokenStorage } from '../utils/security';

type AuthStatus = 'chargement' | 'connecte' | 'anonyme';

interface AuthContextValue {
  user: CurrentUser | null;
  status: AuthStatus;
  /** Vrai si la dernière déconnexion vient d'un jeton expiré / refusé par le serveur. */
  sessionExpiree: boolean;
  login: (username: string, motDePasse: string) => Promise<CurrentUser>;
  logout: () => void;
  /** À appeler après un changement de mot de passe réussi. */
  marquerMotDePasseChange: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>(() => (tokenStorage.get() ? 'chargement' : 'anonyme'));
  const [sessionExpiree, setSessionExpiree] = useState(false);

  // Au rechargement de la page : on revalide le jeton auprès du backend.
  useEffect(() => {
    if (status !== 'chargement') return;
    let annule = false;
    authService
      .me()
      .then((u) => {
        if (annule) return;
        setUser(u);
        setStatus('connecte');
      })
      .catch(() => {
        if (annule) return;
        tokenStorage.clear();
        setStatus('anonyme');
      });
    return () => {
      annule = true;
    };
  }, [status]);

  useEffect(() => {
    const onUnauthorized = () => {
      setUser(null);
      setStatus('anonyme');
      setSessionExpiree(true);
    };
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
  }, []);

  const login = useCallback(async (username: string, motDePasse: string) => {
    const res = await authService.login({ username: username.trim(), motDePasse });
    tokenStorage.set(res.token, res.expiresAt);
    setUser(res.utilisateur);
    setStatus('connecte');
    setSessionExpiree(false);
    return res.utilisateur;
  }, []);

  const logout = useCallback(() => {
    tokenStorage.clear();
    setUser(null);
    setStatus('anonyme');
    setSessionExpiree(false);
  }, []);

  const marquerMotDePasseChange = useCallback(() => {
    setUser((u) => (u ? { ...u, doitChangerMotDePasse: false } : u));
  }, []);

  const value = useMemo(
    () => ({ user, status, sessionExpiree, login, logout, marquerMotDePasseChange }),
    [user, status, sessionExpiree, login, logout, marquerMotDePasseChange],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth doit être utilisé dans <AuthProvider>');
  return ctx;
}
