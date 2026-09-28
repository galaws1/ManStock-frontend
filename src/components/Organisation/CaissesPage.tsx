import { Pencil, Plus, Power, PowerOff } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useStock } from '../../context/StockContext';
import { usePagination } from '../../hooks/usePagination';
import { ApiClientError } from '../../services/axiosConfig';
import { caisseService } from '../../services/domains/caisseService';
import { magasinService } from '../../services/domains/magasinService';
import type { Caisse } from '../../types/caisse';
import type { Option } from '../../types/common';
import { ROLES_ORGANISATION } from '../../types/role';
import { ChampRecherche } from '../common/ChampRecherche';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { DataTable, type Colonne } from '../common/DataTable';
import { actifDepuisFiltre, FiltreStatut, type FiltreStatutValeur } from '../common/FiltreStatut';
import { PageEntete } from '../common/PageEntete';
import { Pagination } from '../common/Pagination';
import { PermissionGate } from '../common/PermissionGate';
import { StatutBadge } from '../common/StatutBadge';
import { CaisseFormModal } from './CaisseFormModal';

export function CaissesPage() {
  const { showToast } = useStock();
  const [magasins, setMagasins] = useState<Option[]>([]);
  const [recherche, setRecherche] = useState('');
  const [magasinId, setMagasinId] = useState('');
  const [statut, setStatut] = useState<FiltreStatutValeur>('actifs');
  const [edition, setEdition] = useState<Caisse | 'nouvelle' | null>(null);
  const [aBasculer, setABasculer] = useState<Caisse | null>(null);

  useEffect(() => {
    magasinService.options().then(setMagasins).catch(() => showToast('Impossible de charger les magasins', 'erreur'));
  }, [showToast]);

  const filtres = useMemo(
    () => ({ recherche: recherche.trim(), magasinId: magasinId ? Number(magasinId) : undefined, actif: actifDepuisFiltre(statut) }),
    [recherche, magasinId, statut],
  );
  const liste = usePagination((p) => caisseService.getPage(p), filtres, {
    triInitial: 'magasin',
    onErreur: (e) => showToast(e instanceof ApiClientError ? e.message : 'Chargement impossible', 'erreur'),
  });

  const basculer = async () => {
    if (!aBasculer) return;
    try {
      const c = await caisseService.changerStatut(aBasculer.id, !aBasculer.actif);
      showToast(c.actif ? `Caisse « ${c.nom} » réactivée` : `Caisse « ${c.nom} » désactivée`);
      liste.recharger();
    } catch (e) {
      showToast(e instanceof ApiClientError ? e.message : 'Opération impossible', 'erreur');
    }
  };

  const colonnes: Colonne<Caisse>[] = [
    { cle: 'nom', titre: 'Caisse', tri: 'nom', rendu: (c) => <span className="font-medium">{c.nom}</span> },
    { cle: 'magasin', titre: 'Magasin', tri: 'magasin', rendu: (c) => c.magasinNom },
    { cle: 'statut', titre: 'Statut', tri: 'actif', rendu: (c) => <StatutBadge actif={c.actif} libelles={['Active', 'Désactivée']} /> },
    {
      cle: 'actions',
      titre: 'Actions',
      className: 'w-28 text-right',
      rendu: (c) => (
        <PermissionGate roles={ROLES_ORGANISATION}>
          <div className="flex justify-end gap-1">
            <button className="btn-discret" onClick={() => setEdition(c)} aria-label={`Modifier ${c.nom}`} title="Modifier">
              <Pencil size={16} />
            </button>
            <button className="btn-discret" onClick={() => setABasculer(c)} aria-label={c.actif ? `Désactiver ${c.nom}` : `Réactiver ${c.nom}`} title={c.actif ? 'Désactiver' : 'Réactiver'}>
              {c.actif ? <PowerOff size={16} /> : <Power size={16} />}
            </button>
          </div>
        </PermissionGate>
      ),
    },
  ];

  return (
    <div>
      <PageEntete
        titre="Caisses"
        description="Postes d’encaissement de chaque magasin. Une caisse ne se supprime pas ; elle ne peut pas être désactivée tant qu’une session y est ouverte."
        actions={
          <PermissionGate roles={ROLES_ORGANISATION}>
            <button className="btn-primaire" onClick={() => setEdition('nouvelle')} disabled={magasins.length === 0}>
              <Plus size={16} aria-hidden /> Nouvelle caisse
            </button>
          </PermissionGate>
        }
      />
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <ChampRecherche valeur={recherche} onChange={setRecherche} placeholder="Caisse ou magasin" label="Rechercher une caisse" />
        <label className="flex items-center gap-2 text-sm text-encre-douce">
          Magasin
          <select className="champ w-auto min-w-[12rem]" value={magasinId} onChange={(e) => setMagasinId(e.target.value)}>
            <option value="">Tous les magasins</option>
            {magasins.map((m) => (
              <option key={m.id} value={m.id}>{m.libelle}</option>
            ))}
          </select>
        </label>
        <FiltreStatut valeur={statut} onChange={setStatut} />
      </div>
      <DataTable
        colonnes={colonnes}
        lignes={liste.lignes}
        cleLigne={(c) => c.id}
        chargement={liste.chargement}
        classeLigne={(c) => (c.actif ? '' : 'text-encre-douce')}
        triCourant={{ tri: liste.tri, sens: liste.sens }}
        onTrier={liste.trier}
        vide="Aucune caisse dans cette liste."
        pied={<Pagination resultat={liste.resultat} page={liste.page} onPage={liste.setPage} taille={liste.taille} onTaille={liste.setTaille} />}
      />

      {edition && (
        <CaisseFormModal
          caisse={edition === 'nouvelle' ? undefined : edition}
          magasins={magasins}
          magasinParDefaut={magasinId ? Number(magasinId) : undefined}
          onClose={() => setEdition(null)}
          onSaved={(c) => {
            showToast(edition === 'nouvelle' ? `Caisse « ${c.nom} » créée` : `Caisse « ${c.nom} » enregistrée`);
            setEdition(null);
            liste.recharger();
          }}
        />
      )}
      {aBasculer && (
        <ConfirmDialog
          titre={aBasculer.actif ? 'Désactiver cette caisse ?' : 'Réactiver cette caisse ?'}
          message={
            aBasculer.actif
              ? `« ${aBasculer.nom} » (${aBasculer.magasinNom}) ne pourra plus ouvrir de session. Son historique est conservé.`
              : `« ${aBasculer.nom} » pourra de nouveau ouvrir des sessions de caisse.`
          }
          libelleConfirmer={aBasculer.actif ? 'Désactiver la caisse' : 'Réactiver la caisse'}
          danger={aBasculer.actif}
          onConfirm={basculer}
          onClose={() => setABasculer(null)}
        />
      )}
    </div>
  );
}
