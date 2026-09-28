import { Pencil, Plus, Power, PowerOff } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStock } from '../../context/StockContext';
import { usePagination } from '../../hooks/usePagination';
import { ApiClientError } from '../../services/axiosConfig';
import { categorieService } from '../../services/domains/categorieService';
import { familleService } from '../../services/domains/familleService';
import { produitService } from '../../services/domains/produitService';
import type { CategorieOption } from '../../types/categorie';
import type { Option } from '../../types/common';
import type { Produit } from '../../types/produit';
import { ROLES_CATALOGUE } from '../../types/role';
import { formatMontant } from '../../utils/formatters';
import { ChampRecherche } from '../common/ChampRecherche';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { DataTable, type Colonne } from '../common/DataTable';
import { actifDepuisFiltre, FiltreStatut, type FiltreStatutValeur } from '../common/FiltreStatut';
import { PageEntete } from '../common/PageEntete';
import { Pagination } from '../common/Pagination';
import { PermissionGate } from '../common/PermissionGate';
import { StatutBadge } from '../common/StatutBadge';
import { ProduitFormModal } from './ProduitFormModal';

export function ProduitsPage() {
  const { showToast } = useStock();
  const navigate = useNavigate();
  const [familles, setFamilles] = useState<Option[]>([]);
  const [categories, setCategories] = useState<CategorieOption[]>([]);
  const [recherche, setRecherche] = useState('');
  const [familleId, setFamilleId] = useState('');
  const [categorieId, setCategorieId] = useState('');
  const [statut, setStatut] = useState<FiltreStatutValeur>('actifs');
  const [edition, setEdition] = useState<Produit | 'nouveau' | null>(null);
  const [aBasculer, setABasculer] = useState<Produit | null>(null);

  useEffect(() => {
    Promise.all([familleService.options(), categorieService.options()])
      .then(([f, c]) => {
        setFamilles(f);
        setCategories(c);
      })
      .catch(() => showToast('Impossible de charger les familles et catégories', 'erreur'));
  }, [showToast]);

  const categoriesFiltrees = familleId ? categories.filter((c) => String(c.familleId) === familleId) : categories;

  const filtres = useMemo(
    () => ({
      recherche: recherche.trim(),
      familleId: familleId ? Number(familleId) : undefined,
      categorieId: categorieId ? Number(categorieId) : undefined,
      actif: actifDepuisFiltre(statut),
    }),
    [recherche, familleId, categorieId, statut],
  );
  const liste = usePagination((p) => produitService.getPage(p), filtres, {
    triInitial: 'nom',
    onErreur: (e) => showToast(e instanceof ApiClientError ? e.message : 'Chargement impossible', 'erreur'),
  });

  const basculer = async () => {
    if (!aBasculer) return;
    try {
      const p = await produitService.changerStatut(aBasculer.id, !aBasculer.actif);
      showToast(p.actif ? `« ${p.nom} » réactivé` : `« ${p.nom} » désactivé`);
      liste.recharger();
    } catch (e) {
      showToast(e instanceof ApiClientError ? e.message : 'Opération impossible', 'erreur');
    }
  };

  const colonnes: Colonne<Produit>[] = [
    {
      cle: 'nom',
      titre: 'Produit',
      tri: 'nom',
      rendu: (p) => (
        <div>
          <Link to={`/catalogue/produits/${p.id}`} className="font-medium hover:underline">
            {p.nom}
          </Link>
          {p.codeBarre && <p className="font-mono text-xs text-encre-douce">{p.codeBarre}</p>}
        </div>
      ),
    },
    {
      cle: 'categorie',
      titre: 'Catégorie',
      tri: 'categorie',
      rendu: (p) => (
        <span>
          <span className="text-encre-douce">{p.familleNom} › </span>
          {p.categorieNom}
        </span>
      ),
    },
    {
      cle: 'prix',
      titre: 'Prix de vente',
      tri: 'prixVente',
      className: 'text-right',
      rendu: (p) => (
        <span className="tabular-nums">
          {formatMontant(p.prixVente)}
          <span className="text-encre-douce"> / {p.uniteBaseSymbole}</span>
        </span>
      ),
    },
    {
      cle: 'conditionnements',
      titre: 'Conditionnements',
      className: 'text-right',
      rendu: (p) => (p.nbPaquetages > 0 ? p.nbPaquetages : <span className="text-encre-douce">—</span>),
    },
    {
      cle: 'statut',
      titre: 'Statut',
      tri: 'actif',
      rendu: (p) => (
        <div className="flex flex-wrap gap-1">
          <StatutBadge actif={p.actif} />
          {p.perissable && <span className="rounded-sm bg-ambre-pale px-2 py-0.5 text-xs font-medium text-ambre-fonce">Périssable</span>}
        </div>
      ),
    },
    {
      cle: 'actions',
      titre: 'Actions',
      className: 'w-28 text-right',
      rendu: (p) => (
        <PermissionGate roles={ROLES_CATALOGUE}>
          <div className="flex justify-end gap-1">
            <button className="btn-discret" onClick={() => setEdition(p)} aria-label={`Modifier ${p.nom}`} title="Modifier">
              <Pencil size={16} />
            </button>
            <button className="btn-discret" onClick={() => setABasculer(p)} aria-label={p.actif ? `Désactiver ${p.nom}` : `Réactiver ${p.nom}`} title={p.actif ? 'Désactiver' : 'Réactiver'}>
              {p.actif ? <PowerOff size={16} /> : <Power size={16} />}
            </button>
          </div>
        </PermissionGate>
      ),
    },
  ];

  return (
    <div>
      <PageEntete
        titre="Produits"
        description="Le catalogue des articles. Ouvrez un produit pour gérer ses conditionnements (carton, palette…) et ses conversions."
        actions={
          <PermissionGate roles={ROLES_CATALOGUE}>
            <button className="btn-primaire" onClick={() => setEdition('nouveau')}>
              <Plus size={16} aria-hidden /> Nouveau produit
            </button>
          </PermissionGate>
        }
      />
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <ChampRecherche valeur={recherche} onChange={setRecherche} placeholder="Nom ou code-barre" label="Rechercher un produit" />
        <select
          className="champ w-auto min-w-[11rem]"
          aria-label="Famille"
          value={familleId}
          onChange={(e) => {
            setFamilleId(e.target.value);
            setCategorieId('');
          }}
        >
          <option value="">Toutes les familles</option>
          {familles.map((f) => (
            <option key={f.id} value={f.id}>{f.libelle}</option>
          ))}
        </select>
        <select className="champ w-auto min-w-[11rem]" aria-label="Catégorie" value={categorieId} onChange={(e) => setCategorieId(e.target.value)}>
          <option value="">Toutes les catégories</option>
          {categoriesFiltrees.map((c) => (
            <option key={c.id} value={c.id}>{familleId ? c.nom : `${c.familleNom} › ${c.nom}`}</option>
          ))}
        </select>
        <FiltreStatut valeur={statut} onChange={setStatut} />
      </div>
      <DataTable
        colonnes={colonnes}
        lignes={liste.lignes}
        cleLigne={(p) => p.id}
        chargement={liste.chargement}
        classeLigne={(p) => (p.actif ? '' : 'text-encre-douce')}
        triCourant={{ tri: liste.tri, sens: liste.sens }}
        onTrier={liste.trier}
        vide={recherche ? `Aucun produit ne correspond à « ${recherche} ».` : 'Aucun produit dans cette liste.'}
        pied={<Pagination resultat={liste.resultat} page={liste.page} onPage={liste.setPage} taille={liste.taille} onTaille={liste.setTaille} />}
      />

      {edition && (
        <ProduitFormModal
          produit={edition === 'nouveau' ? undefined : edition}
          onClose={() => setEdition(null)}
          onSaved={(p) => {
            const creation = edition === 'nouveau';
            showToast(creation ? `« ${p.nom} » créé` : `« ${p.nom} » enregistré`);
            setEdition(null);
            // Après une création, on ouvre la fiche pour ajouter les conditionnements.
            if (creation) navigate(`/catalogue/produits/${p.id}`);
            else liste.recharger();
          }}
        />
      )}
      {aBasculer && (
        <ConfirmDialog
          titre={aBasculer.actif ? 'Désactiver ce produit ?' : 'Réactiver ce produit ?'}
          message={
            aBasculer.actif
              ? `« ${aBasculer.nom} » ne sera plus proposé à la vente ni en commande. Son historique est conservé.`
              : `« ${aBasculer.nom} » redeviendra disponible à la vente.`
          }
          libelleConfirmer={aBasculer.actif ? 'Désactiver le produit' : 'Réactiver le produit'}
          danger={aBasculer.actif}
          onConfirm={basculer}
          onClose={() => setABasculer(null)}
        />
      )}
    </div>
  );
}
