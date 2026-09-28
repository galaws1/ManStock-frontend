import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ROLES } from '../../types/role';
import { PermissionGate } from '../common/PermissionGate';

/**
 * Les indicateurs du directeur (US111-113, 121-124) seront branchés quand les
 * modules Ventes et Stock existeront. En attendant : accueil et accès rapides.
 */
export function DashboardPage() {
  const { user } = useAuth();
  if (!user) return null;
  return (
    <div>
      <h1>Bonjour {user.prenom ?? user.nom}</h1>
      <p className="mt-1 text-sm text-encre-douce">
        Connecté en tant que {user.roleLibelle.toLowerCase()}
        {user.magasinNom ? `, ${user.magasinNom}` : ''}.
      </p>

      <div className="mt-8 rounded border border-dashed border-ligne bg-white p-6">
        <h2>Indicateurs</h2>
        <p className="mt-1 max-w-prose text-sm text-encre-douce">
          Chiffre d'affaires, stock critique et péremptions s'afficheront ici dès que les ventes et les mouvements de stock seront enregistrés.
        </p>
        <PermissionGate roles={[ROLES.ADMIN]}>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link to="/admin/utilisateurs" className="btn-primaire">Gérer les utilisateurs</Link>
            <Link to="/admin/roles" className="btn-secondaire">Gérer les rôles</Link>
          </div>
        </PermissionGate>
      </div>
    </div>
  );
}
