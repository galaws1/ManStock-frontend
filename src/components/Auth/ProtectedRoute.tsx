import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { usePermission } from '../../hooks/usePermission';

interface Props {
  children: ReactNode;
  roles?: string[];
}

export function ProtectedRoute({ children, roles = [] }: Props) {
  const { status, user } = useAuth();
  const { hasRole } = usePermission();
  const location = useLocation();

  if (status === 'chargement') {
    return <div className="flex min-h-screen items-center justify-center text-encre-douce">Chargement de la session…</div>;
  }
  if (status === 'anonyme') {
    return <Navigate to="/connexion" replace state={{ from: location.pathname }} />;
  }
  // Changement de mot de passe obligatoire : aucun autre écran n'est accessible.
  if (user?.doitChangerMotDePasse) {
    return <Navigate to="/changer-mot-de-passe" replace />;
  }
  if (!hasRole(...roles)) {
    return (
      <div className="rounded border border-ligne bg-white p-8">
        <h1>Accès réservé</h1>
        <p className="mt-2 text-sm text-encre-douce">Cette page n'est pas disponible pour votre rôle. Utilisez le menu pour revenir à vos écrans.</p>
      </div>
    );
  }
  return <>{children}</>;
}
