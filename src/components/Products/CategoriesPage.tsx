import { Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useStock } from '../../context/StockContext';
import { usePagination } from '../../hooks/usePagination';
import { usePermission } from '../../hooks/usePermission';
import { ApiClientError } from '../../services/axiosConfig';
import { categorieService } from '../../services/domains/categorieService';
import { familleService } from '../../services/domains/familleService';
import type { Categorie } from '../../types/categorie';
import type { Option } from '../../types/common';
import { ROLES_CATALOGUE } from '../../types/role';
import { formatDateHeure } from '../../utils/formatters';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { DataTable, type Colonne } from '../common/DataTable';
import { PageEntete } from '../common/PageEntete';
import { Pagination } from '../common/Pagination';
import { PermissionGate } from '../common/PermissionGate';
import { CategorieFormModal } from './CategorieFormModal';

export function CategoriesPage() {
  const { showToast } = useStock();
  const { hasRole } = usePermission();
  // Le filtre famille est dans l'URL (?familleId=3) : lien direct depuis la page Familles, et partageable.
  const [params, setParams] = useSearchParams();
  const familleId = Number(params.get('familleId')) || undefined;

  const [familles, setFamilles] = useState<Option[] | null>(null);
  const [recherche, setRecherche] = useState('');
  const [edition, setEdition] = useState<Categorie | 'nouvelle' | null>(null);
  const [aSupprimer, setASupprimer] = useState<Categorie | null>(null);

  useEffect(() => {
    familleService
      .options()
      .then(setFamilles)
      .catch(() => {
        setFamilles([]);
        showToast('Impossible de charger les familles', 'erreur');
      });
  }, [showToast]);

  const filtres = useMemo(() => ({ recherche: recherche.trim(), familleId }), [recherche, familleId]);
  const liste = usePagination((p) => categorieService.getPage(p), filtres, {
    triInitial: 'nom',
    onErreur: (e) => showToast(e instanceof ApiClientError ? e.message : 'Chargement impossible', 'erreur'),
  });

  const choisirFamille = (id: string) => {
    const suivants = new URLSearchParams(params);
    if (id) suivants.set('familleId', id);
    else suivants.delete('familleId');
    setParams(suivants, { replace: true });
  };

  const supprimer = async () => {
    if (!aSupprimer) return;
    try {
      await categorieService.delete(aSupprimer.id);
      showToast(`Catégorie « ${aSupprimer.nom} » supprimée`);
      liste.recharger();
    } catch (e) {
      showToast(e instanceof ApiClientError ? e.message : 'Suppression impossible', 'erreur');
    }
  };

  const aucuneFamille = familles !== null && familles.length === 0;
  const familleFiltree = familles?.find((f) => f.id === familleId);

  const colonnes: Colonne<Categorie>[] = [
    { cle: 'nom', titre: 'Catégorie', tri: 'nom', rendu: (c) => <span className="font-medium">{c.nom}</span> },
    {
      cle: 'famille',
      titre: 'Famille',
      tri: 'famille',
      rendu: (c) => (
        <button className="text-left text-encre-douce hover:text-encre hover:underline" onClick={() => choisirFamille(String(c.familleId))}>
          {c.familleNom}
        </button>
      ),
    },
    {
      cle: 'produits',
      titre: 'Produits',
      className: 'text-right',
      rendu: (c) => (c.nbProduits > 0 ? c.nbProduits : <span className="text-encre-douce">Aucun</span>),
    },
    {
      cle: 'creation',
      titre: 'Créée le',
      tri: 'creation',
      rendu: (c) => (
        <span className="text-encre-douce">
          {formatDateHeure(c.createdAt)}
          {c.createdBy && <span className="block text-xs">par {c.createdBy}</span>}
        </span>
      ),
    },
    {
      cle: 'actions',
      titre: 'Actions',
      className: 'w-28 text-right',
      rendu: (c) => (
        <PermissionGate roles={ROLES_CATALOGUE}>
          <div className="flex justify-end gap-1">
            <button className="btn-discret" onClick={() => setEdition(c)} aria-label={`Modifier ${c.nom}`} title="Modifier">
              <Pencil size={16} />
            </button>
            <button
              className="btn-discret hover:!bg-alerte-pale hover:!text-alerte"
              onClick={() => setASupprimer(c)}
              disabled={c.nbProduits > 0}
              aria-label={`Supprimer ${c.nom}`}
              title={c.nbProduits > 0 ? 'Déplacez d’abord ses produits vers une autre catégorie' : 'Supprimer'}
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
        titre="Catégories de produits"
        description="Deuxième niveau du catalogue. Chaque catégorie appartient à une famille et regroupe des produits."
        actions={
          <PermissionGate roles={ROLES_CATALOGUE}>
            <button className="btn-primaire" onClick={() => setEdition('nouvelle')} disabled={!familles || aucuneFamille}>
              <Plus size={16} aria-hidden /> Nouvelle catégorie
            </button>
          </PermissionGate>
        }
      />

      {aucuneFamille ? (
        <div className="rounded border border-dashed border-ligne bg-white p-8">
          <h2>Aucune famille pour l’instant</h2>
          <p className="mt-1 max-w-prose text-sm text-encre-douce">
            Une catégorie est toujours rangée dans une famille. Créez d’abord au moins une famille (Boissons, Épicerie…).
          </p>
          {hasRole(...ROLES_CATALOGUE) && (
            <Link to="/catalogue/familles" className="btn-primaire mt-4">
              Créer une famille
            </Link>
          )}
        </div>
      ) : (
        <>
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <label className="relative min-w-[16rem] flex-1 sm:max-w-sm">
              <span className="sr-only">Rechercher une catégorie</span>
              <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-encre-douce" aria-hidden />
              <input className="champ pl-9" placeholder="Catégorie ou famille" value={recherche} onChange={(e) => setRecherche(e.target.value)} />
            </label>
            <label className="flex items-center gap-2 text-sm text-encre-douce">
              Famille
              <select className="champ w-auto min-w-[12rem]" value={familleId ?? ''} onChange={(e) => choisirFamille(e.target.value)}>
                <option value="">Toutes les familles</option>
                {familles?.map((f) => (
                  <option key={f.id} value={f.id}>{f.libelle}</option>
                ))}
              </select>
            </label>
          </div>

          <DataTable
            colonnes={colonnes}
            lignes={liste.lignes}
            cleLigne={(c) => c.id}
            chargement={liste.chargement}
            triCourant={{ tri: liste.tri, sens: liste.sens }}
            onTrier={liste.trier}
            vide={
              recherche
                ? `Aucune catégorie ne correspond à « ${recherche} ».`
                : familleFiltree
                  ? `La famille « ${familleFiltree.libelle} » ne contient encore aucune catégorie.`
                  : 'Aucune catégorie pour l’instant.'
            }
            pied={<Pagination resultat={liste.resultat} page={liste.page} onPage={liste.setPage} taille={liste.taille} onTaille={liste.setTaille} />}
          />
        </>
      )}

      {edition && familles && (
        <CategorieFormModal
          categorie={edition === 'nouvelle' ? undefined : edition}
          familles={familles}
          familleParDefaut={familleId}
          onClose={() => setEdition(null)}
          onSaved={(c) => {
            showToast(edition === 'nouvelle' ? `Catégorie « ${c.nom} » créée` : `Catégorie « ${c.nom} » enregistrée`);
            setEdition(null);
            liste.recharger();
          }}
        />
      )}
      {aSupprimer && (
        <ConfirmDialog
          titre="Supprimer cette catégorie ?"
          message={`La catégorie « ${aSupprimer.nom} » (famille ${aSupprimer.familleNom}) sera définitivement supprimée.`}
          libelleConfirmer="Supprimer la catégorie"
          danger
          onConfirm={supprimer}
          onClose={() => setASupprimer(null)}
        />
      )}
    </div>
  );
}
