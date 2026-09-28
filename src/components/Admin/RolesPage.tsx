import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useStock } from '../../context/StockContext';
import { ApiClientError } from '../../services/axiosConfig';
import { roleService } from '../../services/domains/roleService';
import type { Role } from '../../types/role';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { DataTable, type Colonne } from '../common/DataTable';
import { PageEntete } from '../common/PageEntete';
import { RoleFormModal } from './RoleFormModal';

export function RolesPage() {
  const { showToast, refreshKey } = useStock();
  const [roles, setRoles] = useState<Role[]>([]);
  const [chargement, setChargement] = useState(true);
  const [edition, setEdition] = useState<Role | 'nouveau' | null>(null);
  const [aSupprimer, setASupprimer] = useState<Role | null>(null);

  const charger = useCallback(async () => {
    setChargement(true);
    try {
      setRoles(await roleService.getAll());
    } catch (e) {
      showToast(e instanceof ApiClientError ? e.message : 'Chargement impossible', 'erreur');
    } finally {
      setChargement(false);
    }
  }, [showToast]);

  useEffect(() => {
    charger();
  }, [charger, refreshKey]);

  const supprimer = async () => {
    if (!aSupprimer) return;
    try {
      await roleService.delete(aSupprimer.id);
      showToast(`Rôle « ${aSupprimer.libelle} » supprimé`);
      await charger();
    } catch (e) {
      showToast(e instanceof ApiClientError ? e.message : 'Suppression impossible', 'erreur');
    }
  };

  const colonnes: Colonne<Role>[] = [
    { cle: 'libelle', titre: 'Rôle', rendu: (r) => <span className="font-medium">{r.libelle}</span> },
    { cle: 'code', titre: 'Code', rendu: (r) => <span className="text-encre-douce">{r.code}</span> },
    { cle: 'nb', titre: 'Utilisateurs', className: 'text-right', rendu: (r) => r.nbUtilisateurs },
    {
      cle: 'actions',
      titre: 'Actions',
      className: 'w-28 text-right',
      rendu: (r) => (
        <div className="flex justify-end gap-1">
          <button className="btn-discret" onClick={() => setEdition(r)} aria-label={`Modifier ${r.libelle}`}>
            <Pencil size={16} />
          </button>
          {r.code !== 'ADMIN' && (
            <button
              className="btn-discret hover:!bg-alerte-pale hover:!text-alerte"
              onClick={() => setASupprimer(r)}
              aria-label={`Supprimer ${r.libelle}`}
              disabled={r.nbUtilisateurs > 0}
              title={r.nbUtilisateurs > 0 ? 'Réaffectez d’abord les utilisateurs de ce rôle' : undefined}
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageEntete
        titre="Rôles"
        description="Chaque utilisateur a un rôle qui détermine les écrans et les actions auxquels il a accès."
        actions={
          <button className="btn-primaire" onClick={() => setEdition('nouveau')}>
            <Plus size={16} aria-hidden /> Nouveau rôle
          </button>
        }
      />
      <DataTable colonnes={colonnes} lignes={roles} cleLigne={(r) => r.id} chargement={chargement} vide="Aucun rôle. Créez-en un pour commencer." />

      {edition && (
        <RoleFormModal
          role={edition === 'nouveau' ? undefined : edition}
          onClose={() => setEdition(null)}
          onSaved={(r) => {
            showToast(edition === 'nouveau' ? `Rôle « ${r.libelle} » créé` : `Rôle « ${r.libelle} » enregistré`);
            setEdition(null);
            charger();
          }}
        />
      )}
      {aSupprimer && (
        <ConfirmDialog
          titre="Supprimer ce rôle ?"
          message={`Le rôle « ${aSupprimer.libelle} » sera définitivement supprimé.`}
          libelleConfirmer="Supprimer le rôle"
          danger
          onConfirm={supprimer}
          onClose={() => setASupprimer(null)}
        />
      )}
    </div>
  );
}
