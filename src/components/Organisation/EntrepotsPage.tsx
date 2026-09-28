import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useStock } from '../../context/StockContext';
import { usePagination } from '../../hooks/usePagination';
import { ApiClientError } from '../../services/axiosConfig';
import { entrepotService } from '../../services/domains/entrepotService';
import { magasinService } from '../../services/domains/magasinService';
import type { Option } from '../../types/common';
import type { Entrepot } from '../../types/entrepot';
import { ROLES_ORGANISATION } from '../../types/role';
import { ChampRecherche } from '../common/ChampRecherche';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { DataTable, type Colonne } from '../common/DataTable';
import { PageEntete } from '../common/PageEntete';
import { Pagination } from '../common/Pagination';
import { PermissionGate } from '../common/PermissionGate';
import { EntrepotFormModal } from './EntrepotFormModal';

export function EntrepotsPage() {
  const { showToast } = useStock();
  const [magasins, setMagasins] = useState<Option[]>([]);
  const [recherche, setRecherche] = useState('');
  const [magasinId, setMagasinId] = useState('');
  const [edition, setEdition] = useState<Entrepot | 'nouveau' | null>(null);
  const [aSupprimer, setASupprimer] = useState<Entrepot | null>(null);

  useEffect(() => {
    magasinService.options().then(setMagasins).catch(() => showToast('Impossible de charger les magasins', 'erreur'));
  }, [showToast]);

  const filtres = useMemo(() => ({ recherche: recherche.trim(), magasinId: magasinId ? Number(magasinId) : undefined }), [recherche, magasinId]);
  const liste = usePagination((p) => entrepotService.getPage(p), filtres, {
    triInitial: 'nom',
    onErreur: (e) => showToast(e instanceof ApiClientError ? e.message : 'Chargement impossible', 'erreur'),
  });

  const supprimer = async () => {
    if (!aSupprimer) return;
    try {
      await entrepotService.delete(aSupprimer.id);
      showToast(`Entrepôt « ${aSupprimer.nom} » supprimé`);
      liste.recharger();
    } catch (e) {
      showToast(e instanceof ApiClientError ? e.message : 'Suppression impossible', 'erreur');
    }
  };

  const colonnes: Colonne<Entrepot>[] = [
    {
      cle: 'nom',
      titre: 'Entrepôt',
      tri: 'nom',
      rendu: (e) => (
        <Link to={`/organisation/entrepots/${e.id}`} className="font-medium hover:underline">
          {e.nom}
        </Link>
      ),
    },
    { cle: 'magasin', titre: 'Magasin', tri: 'magasin', rendu: (e) => e.magasinNom },
    {
      cle: 'emplacements',
      titre: 'Emplacements',
      className: 'text-right',
      rendu: (e) => (
        <Link to={`/organisation/entrepots/${e.id}`} className="hover:underline">
          {e.nbEmplacements > 0 ? e.nbEmplacements : <span className="text-encre-douce">Aucun</span>}
        </Link>
      ),
    },
    {
      cle: 'actions',
      titre: 'Actions',
      className: 'w-28 text-right',
      rendu: (e) => (
        <PermissionGate roles={ROLES_ORGANISATION}>
          <div className="flex justify-end gap-1">
            <button className="btn-discret" onClick={() => setEdition(e)} aria-label={`Modifier ${e.nom}`} title="Modifier">
              <Pencil size={16} />
            </button>
            <button
              className="btn-discret hover:!bg-alerte-pale hover:!text-alerte"
              onClick={() => setASupprimer(e)}
              disabled={e.nbEmplacements > 0}
              aria-label={`Supprimer ${e.nom}`}
              title={e.nbEmplacements > 0 ? 'Supprimez d’abord ses emplacements' : 'Supprimer'}
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
        titre="Entrepôts"
        description="Zones de stockage de chaque magasin. Ouvrez un entrepôt pour gérer ses emplacements (allée, rayon, niveau)."
        actions={
          <PermissionGate roles={ROLES_ORGANISATION}>
            <button className="btn-primaire" onClick={() => setEdition('nouveau')} disabled={magasins.length === 0}>
              <Plus size={16} aria-hidden /> Nouvel entrepôt
            </button>
          </PermissionGate>
        }
      />
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <ChampRecherche valeur={recherche} onChange={setRecherche} placeholder="Entrepôt ou magasin" label="Rechercher un entrepôt" />
        <label className="flex items-center gap-2 text-sm text-encre-douce">
          Magasin
          <select className="champ w-auto min-w-[12rem]" value={magasinId} onChange={(e) => setMagasinId(e.target.value)}>
            <option value="">Tous les magasins</option>
            {magasins.map((m) => (
              <option key={m.id} value={m.id}>{m.libelle}</option>
            ))}
          </select>
        </label>
      </div>
      <DataTable
        colonnes={colonnes}
        lignes={liste.lignes}
        cleLigne={(e) => e.id}
        chargement={liste.chargement}
        triCourant={{ tri: liste.tri, sens: liste.sens }}
        onTrier={liste.trier}
        vide="Aucun entrepôt pour l’instant."
        pied={<Pagination resultat={liste.resultat} page={liste.page} onPage={liste.setPage} taille={liste.taille} onTaille={liste.setTaille} />}
      />

      {edition && (
        <EntrepotFormModal
          entrepot={edition === 'nouveau' ? undefined : edition}
          magasins={magasins}
          magasinParDefaut={magasinId ? Number(magasinId) : undefined}
          onClose={() => setEdition(null)}
          onSaved={(e) => {
            showToast(edition === 'nouveau' ? `Entrepôt « ${e.nom} » créé` : `Entrepôt « ${e.nom} » enregistré`);
            setEdition(null);
            liste.recharger();
          }}
        />
      )}
      {aSupprimer && (
        <ConfirmDialog
          titre="Supprimer cet entrepôt ?"
          message={`L’entrepôt « ${aSupprimer.nom} » (${aSupprimer.magasinNom}) sera définitivement supprimé.`}
          libelleConfirmer="Supprimer l’entrepôt"
          danger
          onConfirm={supprimer}
          onClose={() => setASupprimer(null)}
        />
      )}
    </div>
  );
}
