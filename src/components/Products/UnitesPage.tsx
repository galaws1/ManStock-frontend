import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useStock } from '../../context/StockContext';
import { ApiClientError } from '../../services/axiosConfig';
import { uniteService } from '../../services/domains/uniteService';
import { ROLES_CATALOGUE } from '../../types/role';
import type { Unite } from '../../types/unite';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { DataTable, type Colonne } from '../common/DataTable';
import { PageEntete } from '../common/PageEntete';
import { PermissionGate } from '../common/PermissionGate';
import { UniteFormModal } from './UniteFormModal';

/** Petit référentiel : chargé en entier, sans pagination. */
export function UnitesPage() {
  const { showToast } = useStock();
  const [unites, setUnites] = useState<Unite[]>([]);
  const [chargement, setChargement] = useState(true);
  const [edition, setEdition] = useState<Unite | 'nouvelle' | null>(null);
  const [aSupprimer, setASupprimer] = useState<Unite | null>(null);

  const charger = useCallback(async () => {
    setChargement(true);
    try {
      setUnites(await uniteService.getAll());
    } catch (e) {
      showToast(e instanceof ApiClientError ? e.message : 'Chargement impossible', 'erreur');
    } finally {
      setChargement(false);
    }
  }, [showToast]);

  useEffect(() => {
    charger();
  }, [charger]);

  const supprimer = async () => {
    if (!aSupprimer) return;
    try {
      await uniteService.delete(aSupprimer.id);
      showToast(`Unité « ${aSupprimer.nom} » supprimée`);
      charger();
    } catch (e) {
      showToast(e instanceof ApiClientError ? e.message : 'Suppression impossible', 'erreur');
    }
  };

  const colonnes: Colonne<Unite>[] = [
    { cle: 'nom', titre: 'Unité', rendu: (u) => <span className="font-medium">{u.nom}</span> },
    { cle: 'symbole', titre: 'Symbole', rendu: (u) => <code className="rounded-sm bg-papier px-1.5 py-0.5 text-sm">{u.symbole}</code> },
    {
      cle: 'produits',
      titre: 'Produits',
      className: 'text-right',
      rendu: (u) => (u.nbProduits > 0 ? u.nbProduits : <span className="text-encre-douce">Aucun</span>),
    },
    {
      cle: 'actions',
      titre: 'Actions',
      className: 'w-28 text-right',
      rendu: (u) => (
        <PermissionGate roles={ROLES_CATALOGUE}>
          <div className="flex justify-end gap-1">
            <button className="btn-discret" onClick={() => setEdition(u)} aria-label={`Modifier ${u.nom}`} title="Modifier">
              <Pencil size={16} />
            </button>
            <button
              className="btn-discret hover:!bg-alerte-pale hover:!text-alerte"
              onClick={() => setASupprimer(u)}
              disabled={u.nbProduits > 0}
              aria-label={`Supprimer ${u.nom}`}
              title={u.nbProduits > 0 ? 'Des produits utilisent cette unité' : 'Supprimer'}
            >
              <Trash2 size={16} />
            </button>
          </div>
        </PermissionGate>
      ),
    },
  ];

  return (
    <div>
      <PageEntete
        titre="Unités de mesure"
        description="Unité dans laquelle chaque produit est compté en stock (son unité de base). Les conditionnements (carton, palette…) se définissent sur la fiche produit."
        actions={
          <PermissionGate roles={ROLES_CATALOGUE}>
            <button className="btn-primaire" onClick={() => setEdition('nouvelle')}>
              <Plus size={16} aria-hidden /> Nouvelle unité
            </button>
          </PermissionGate>
        }
      />
      <DataTable colonnes={colonnes} lignes={unites} cleLigne={(u) => u.id} chargement={chargement} vide="Aucune unité de mesure." />

      {edition && (
        <UniteFormModal
          unite={edition === 'nouvelle' ? undefined : edition}
          onClose={() => setEdition(null)}
          onSaved={(u) => {
            showToast(edition === 'nouvelle' ? `Unité « ${u.nom} » créée` : `Unité « ${u.nom} » enregistrée`);
            setEdition(null);
            charger();
          }}
        />
      )}
      {aSupprimer && (
        <ConfirmDialog
          titre="Supprimer cette unité ?"
          message={`L’unité « ${aSupprimer.nom} » (${aSupprimer.symbole}) sera définitivement supprimée.`}
          libelleConfirmer="Supprimer l’unité"
          danger
          onConfirm={supprimer}
          onClose={() => setASupprimer(null)}
        />
      )}
    </div>
  );
}
