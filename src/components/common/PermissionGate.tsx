import type { ReactNode } from 'react';
import { usePermission } from '../../hooks/usePermission';

interface Props {
  /** Rôles autorisés. Liste vide = tout utilisateur connecté. */
  roles: string[];
  children: ReactNode;
  fallback?: ReactNode;
}

export function PermissionGate({ roles, children, fallback = null }: Props) {
  const { hasRole } = usePermission();
  return <>{hasRole(...roles) ? children : fallback}</>;
}
