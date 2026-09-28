import { useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

/**
 * Vérifie le rôle de l'utilisateur connecté.
 * Sert uniquement à l'affichage : le backend revérifie chaque appel (@PreAuthorize).
 */
export function usePermission() {
  const { user } = useAuth();
  const hasRole = useCallback(
    (...roles: string[]) => {
      if (!user) return false;
      if (roles.length === 0) return true;
      return roles.includes(user.roleCode);
    },
    [user],
  );
  return { hasRole, roleCode: user?.roleCode ?? null };
}
