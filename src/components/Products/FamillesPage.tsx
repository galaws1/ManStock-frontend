import { Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useStock } from '../../context/StockContext';
import { usePagination } from '../../hooks/usePagination';
import { ApiClientError } from '../../services/axiosConfig';
import { familleService } from '../../services/domains/familleService';
import type { Famille } from '../../types/famille';
import { ROLES_CATALOGUE } from '../../types/role';
import { formatDateHeure } from '../../utils/formatters';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { DataTable, type Colonne } from '../common/DataTable';
import { PageEntete } from '../common/PageEntete';
import { Pagination } from '../common/Pagination';
import { PermissionGate } from '../common/PermissionGate';
import { FamilleFormModal } from './FamilleFormModal';

export function FamillesPage() {
  const { showToast } = useStock();
  const [recherche, setRecherche] = useState('');
  const [edition, setEdition] = useState<Famille | 'nouvelle' | null>(null);
  const [aSupprimer, setASupprimer] = useState<Famille | null>(null);

  const filtres = useMemo(() => ({ recherche: recherche.trim() }), [recherche]);
  const liste = usePagination((p) => familleService.getPage(p), filtres, {
    triInitial: 'nom',
    onErreur: (e) => showToast(e instanceof ApiClientError ? e.message : 'Chargement impossible', 'erreur'),
  });

  const supprimer = async () => {
    if (!aSupprimer) return;
    try {
      await familleService.delete(aSupprimer.id);
      showToast(`Famille « ${aSupprimer.nom} » supprimée`);
      liste.recharger();
    } catch (e) {
      showToast(e instanceof ApiClientError ? e.message : 'Suppression impossible', 'erreur');
    }
  };

  const colonnes: Colonne<Famille>[] = [
    { cle: 'nom', titre: 'Famille', tri: 'nom', rendu: (f) => <span className="font-medium">{f.nom}</span> },
    {
      cle: 'categories',
      titre: 'Catégories',
      className: 'text-right',
      rendu: (f) => (
        <Link
          to={`/catalogue/categories?familleId=${f.id}`}
          className="hover:underline"
          title={`Voir les catégories de ${f.nom}`}
        >
          {f.nbCategories > 0 ? f.nbCategories : <span className="text-encre-douce">Aucune</span>}
        </Link>
      ),
    },
    {
      cle: 'creation',
      titre: 'Créée le',
      tri: 'creation',
      rendu: (f) => (
        <span className="text-encre-douce">
          {formatDateHeure(f.createdAt)}
          {f.createdBy && <span className="block text-xs">par {f.createdBy}</span>}
        </span>
      ),
    },
    {
      cle: 'actions',
      titre: 'Actions',
      className: 'w-28 text-right',
      rendu: (f) => (
        <PermissionGate roles={ROLES_CATALOGUE}>
          <div className="flex justify-end gap-1">
            <button className="btn-discret" onClick={() => setEdition(f)} aria-label={`Renommer ${f.nom}`} title="Renommer">
              <Pencil size={16} />
            </button>
            <button
              className="btn-discret hover:!bg-alerte-pale hover:!text-alerte"
              onClick={() => setASupprimer(f)}
              disabled={f.nbCategories > 0}
              aria-label={`Supprimer ${f.nom}`}
              title={f.nbCategories > 0 ? 'Supprimez ou déplacez d’abord ses catégories' : 'Supprimer'}
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
        titre="Familles de produits"
        description="Premier niveau du catalogue : chaque produit appartient à une catégorie, elle-même rangée dans une famille."
        actions={
          <PermissionGate roles={ROLES_CATALOGUE}>
            <button className="btn-primaire" onClick={() => setEdition('nouvelle')}>
              <Plus size={16} aria-hidden /> Nouvelle famille
            </button>
          </PermissionGate>
        }
      />

      <label className="relative mb-4 block max-w-sm">
        <span className="sr-only">Rechercher une famille</span>
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-encre-douce" aria-hidden />
        <input className="champ pl-9" placeholder="Rechercher une famille" value={recherche} onChange={(e) => setRecherche(e.target.value)} />
      </label>

      <DataTable
        colonnes={colonnes}
        lignes={liste.lignes}
        cleLigne={(f) => f.id}
        chargement={liste.chargement}
        triCourant={{ tri: liste.tri, sens: liste.sens }}
        onTrier={liste.trier}
        vide={recherche ? `Aucune famille ne correspond à « ${recherche} ».` : 'Aucune famille pour l’instant. Créez la première pour organiser votre catalogue.'}
        pied={
          <Pagination resultat={liste.resultat} page={liste.page} onPage={liste.setPage} taille={liste.taille} onTaille={liste.setTaille} />
        }
      />

      {edition && (
        <FamilleFormModal
          famille={edition === 'nouvelle' ? undefined : edition}
          onClose={() => setEdition(null)}
          onSaved={(f) => {
            showToast(edition === 'nouvelle' ? `Famille « ${f.nom} » créée` : `Famille « ${f.nom} » enregistrée`);
            setEdition(null);
            liste.recharger();
          }}
        />
      )}
      {aSupprimer && (
        <ConfirmDialog
          titre="Supprimer cette famille ?"
          message={`La famille « ${aSupprimer.nom} » sera définitivement supprimée.`}
          libelleConfirmer="Supprimer la famille"
          danger
          onConfirm={supprimer}
          onClose={() => setASupprimer(null)}
        />
      )}
    </div>
  );
}
