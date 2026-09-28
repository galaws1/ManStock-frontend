import { ArrowLeft, Pencil, Plus, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useStock } from '../../context/StockContext';
import { usePagination } from '../../hooks/usePagination';
import { ApiClientError } from '../../services/axiosConfig';
import { emplacementService, entrepotService } from '../../services/domains/entrepotService';
import type { Emplacement, Entrepot } from '../../types/entrepot';
import { ROLES_STOCK } from '../../types/role';
import { formatDateHeure } from '../../utils/formatters';
import { ChampRecherche } from '../common/ChampRecherche';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { DataTable, type Colonne } from '../common/DataTable';
import { Pagination } from '../common/Pagination';
import { PermissionGate } from '../common/PermissionGate';
import { EmplacementFormModal } from './EmplacementFormModal';

export function EntrepotDetailPage() {
  const id = Number(useParams().id);
  const { showToast } = useStock();
  const [entrepot, setEntrepot] = useState<Entrepot | null>(null);
  const [introuvable, setIntrouvable] = useState(false);
  const [recherche, setRecherche] = useState('');
  const [edition, setEdition] = useState<Emplacement | 'nouveau' | null>(null);
  const [aSupprimer, setASupprimer] = useState<Emplacement | null>(null);

  const chargerEntete = () =>
    entrepotService
      .getById(id)
      .then(setEntrepot)
      .catch((e) => (e instanceof ApiClientError && e.status === 404 ? setIntrouvable(true) : showToast('Chargement impossible', 'erreur')));

  useEffect(() => {
    chargerEntete();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const filtres = useMemo(() => ({ recherche: recherche.trim() }), [recherche]);
  const liste = usePagination((p) => entrepotService.emplacements(id, p), filtres, {
    triInitial: 'code',
    onErreur: () => undefined,
  });

  const apresModification = () => {
    liste.recharger();
    chargerEntete();
  };

  const supprimer = async () => {
    if (!aSupprimer) return;
    try {
      await emplacementService.delete(aSupprimer.id);
      showToast(`Emplacement ${aSupprimer.code} supprimé`);
      apresModification();
    } catch (e) {
      showToast(e instanceof ApiClientError ? e.message : 'Suppression impossible', 'erreur');
    }
  };

  if (introuvable) {
    return (
      <div className="rounded border border-ligne bg-white p-8">
        <h1>Entrepôt introuvable</h1>
        <Link to="/organisation/entrepots" className="btn-secondaire mt-4">Retour aux entrepôts</Link>
      </div>
    );
  }

  const colonnes: Colonne<Emplacement>[] = [
    { cle: 'code', titre: 'Code', tri: 'code', rendu: (e) => <span className="font-mono font-semibold">{e.code}</span> },
    { cle: 'description', titre: 'Description', rendu: (e) => e.description ?? <span className="text-encre-douce">—</span> },
    { cle: 'creation', titre: 'Créé le', tri: 'creation', rendu: (e) => <span className="text-encre-douce">{formatDateHeure(e.createdAt)}</span> },
    {
      cle: 'actions',
      titre: 'Actions',
      className: 'w-28 text-right',
      rendu: (e) => (
        <PermissionGate roles={ROLES_STOCK}>
          <div className="flex justify-end gap-1">
            <button className="btn-discret" onClick={() => setEdition(e)} aria-label={`Modifier ${e.code}`} title="Modifier">
              <Pencil size={16} />
            </button>
            <button className="btn-discret hover:!bg-alerte-pale hover:!text-alerte" onClick={() => setASupprimer(e)} aria-label={`Supprimer ${e.code}`} title="Supprimer">
              <Trash2 size={16} />
            </button>
          </div>
        </PermissionGate>
      ),
    },
  ];

  return (
    <div>
      <Link to="/organisation/entrepots" className="mb-3 inline-flex items-center gap-1 text-sm text-encre-douce hover:text-encre">
        <ArrowLeft size={14} aria-hidden /> Entrepôts
      </Link>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1>{entrepot?.nom ?? 'Chargement…'}</h1>
          {entrepot && (
            <p className="mt-1 text-sm text-encre-douce">
              {entrepot.magasinNom} · {entrepot.nbEmplacements} emplacement(s)
            </p>
          )}
        </div>
        <PermissionGate roles={ROLES_STOCK}>
          <button className="btn-primaire" onClick={() => setEdition('nouveau')} disabled={!entrepot}>
            <Plus size={16} aria-hidden /> Nouvel emplacement
          </button>
        </PermissionGate>
      </div>

      <div className="mb-4">
        <ChampRecherche valeur={recherche} onChange={setRecherche} placeholder="Code ou description" label="Rechercher un emplacement" />
      </div>
      <DataTable
        colonnes={colonnes}
        lignes={liste.lignes}
        cleLigne={(e) => e.id}
        chargement={liste.chargement}
        triCourant={{ tri: liste.tri, sens: liste.sens }}
        onTrier={liste.trier}
        vide={recherche ? `Aucun emplacement ne correspond à « ${recherche} ».` : 'Aucun emplacement : ajoutez-en pour localiser précisément le stock.'}
        pied={<Pagination resultat={liste.resultat} page={liste.page} onPage={liste.setPage} taille={liste.taille} onTaille={liste.setTaille} />}
      />

      {edition && (
        <EmplacementFormModal
          entrepotId={id}
          emplacement={edition === 'nouveau' ? undefined : edition}
          onClose={() => setEdition(null)}
          onSaved={(e) => {
            showToast(edition === 'nouveau' ? `Emplacement ${e.code} créé` : `Emplacement ${e.code} enregistré`);
            setEdition(null);
            apresModification();
          }}
        />
      )}
      {aSupprimer && (
        <ConfirmDialog
          titre="Supprimer cet emplacement ?"
          message={`L’emplacement ${aSupprimer.code} sera supprimé. C’est impossible s’il contient du stock.`}
          libelleConfirmer="Supprimer l’emplacement"
          danger
          onConfirm={supprimer}
          onClose={() => setASupprimer(null)}
        />
      )}
    </div>
  );
}
