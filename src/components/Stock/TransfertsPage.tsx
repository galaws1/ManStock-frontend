import { useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useStock } from '../../context/StockContext';
import { usePagination } from '../../hooks/usePagination';
import { usePermission } from '../../hooks/usePermission';
import { ApiClientError } from '../../services/axiosConfig';
import { stockService } from '../../services/domains/stockService';
import { ROLES_RECEPTION, ROLES_STOCK } from '../../types/role';
import type { StatutTransfert, Transfert } from '../../types/stock';
import { formatDateHeure, formatNombre } from '../../utils/formatters';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { DataTable, type Colonne } from '../common/DataTable';
import { PageEntete } from '../common/PageEntete';
import { Pagination } from '../common/Pagination';

const LIBELLES: Record<StatutTransfert, string> = { EN_COURS: 'En route', RECU: 'Reçu', ANNULE: 'Annulé' };

export function TransfertsPage() {
  const { user } = useAuth();
  const { hasRole } = usePermission();
  const { showToast } = useStock();
  const [statut, setStatut] = useState<StatutTransfert | ''>('EN_COURS');
  const [action, setAction] = useState<{ t: Transfert; type: 'recevoir' | 'annuler' } | null>(null);

  const filtres = useMemo(() => ({ magasinId: user?.magasinId, statut: statut || undefined }), [user?.magasinId, statut]);
  const liste = usePagination((p) => stockService.transferts(p), filtres, {
    triInitial: 'date',
    sensInitial: 'desc',
    onErreur: (e) => showToast(e instanceof ApiClientError ? e.message : 'Chargement impossible', 'erreur'),
  });

  // Réception par le magasin d'arrivée, annulation par le magasin de départ (tous pour un utilisateur sans magasin).
  const peutRecevoir = (t: Transfert) => hasRole(...ROLES_RECEPTION) && (!user?.magasinId || user.magasinId === t.magasinDestinationId);
  const peutAnnuler = (t: Transfert) => hasRole(...ROLES_STOCK) && (!user?.magasinId || user.magasinId === t.magasinSourceId);

  const colonnes: Colonne<Transfert>[] = [
    { cle: 'ref', titre: 'Transfert', rendu: (t) => <span className="font-mono">{t.reference}</span> },
    { cle: 'date', titre: 'Envoyé le', tri: 'date', rendu: (t) => <span className="text-encre-douce">{formatDateHeure(t.dateTransfert)}</span> },
    { cle: 'produit', titre: 'Produit', rendu: (t) => <span className="font-medium">{t.produitNom}</span> },
    { cle: 'qte', titre: 'Quantité', className: 'text-right', rendu: (t) => <span className="tabular-nums">{formatNombre(t.quantite)} {t.uniteSymbole}</span> },
    { cle: 'trajet', titre: 'Trajet', rendu: (t) => <span>{t.magasinSourceNom} → {t.magasinDestinationNom}</span> },
    { cle: 'statut', titre: 'Statut', tri: 'statut', rendu: (t) => LIBELLES[t.statut] },
    {
      cle: 'actions',
      titre: 'Actions',
      className: 'text-right',
      rendu: (t) =>
        t.statut === 'EN_COURS' ? (
          <div className="flex justify-end gap-1">
            {peutAnnuler(t) && <button className="btn-discret" onClick={() => setAction({ t, type: 'annuler' })}>Annuler</button>}
            {peutRecevoir(t) && <button className="btn-secondaire py-1" onClick={() => setAction({ t, type: 'recevoir' })}>Réceptionner</button>}
          </div>
        ) : null,
    },
  ];

  return (
    <div>
      <PageEntete titre="Transferts entre magasins" description="La marchandise quitte le stock de départ à l’envoi et entre dans celui d’arrivée à la réception. Pour envoyer un transfert : État du stock → Transfert." />
      <select className="champ mb-4 w-auto" aria-label="Statut" value={statut} onChange={(e) => setStatut(e.target.value as StatutTransfert | '')}>
        <option value="EN_COURS">En route</option>
        <option value="RECU">Reçus</option>
        <option value="ANNULE">Annulés</option>
        <option value="">Tous</option>
      </select>
      <DataTable colonnes={colonnes} lignes={liste.lignes} cleLigne={(t) => t.id} chargement={liste.chargement}
        triCourant={{ tri: liste.tri, sens: liste.sens }} onTrier={liste.trier} vide="Aucun transfert."
        pied={<Pagination resultat={liste.resultat} page={liste.page} onPage={liste.setPage} taille={liste.taille} onTaille={liste.setTaille} />} />
      {action && (
        <ConfirmDialog
          titre={action.type === 'recevoir' ? 'Réceptionner ce transfert ?' : 'Annuler ce transfert ?'}
          message={action.type === 'recevoir'
            ? `${formatNombre(action.t.quantite)} ${action.t.uniteSymbole} de « ${action.t.produitNom} » entreront dans le stock de ${action.t.magasinDestinationNom}.`
            : `La marchandise reviendra dans le stock de ${action.t.magasinSourceNom}.`}
          libelleConfirmer={action.type === 'recevoir' ? 'Réceptionner' : 'Annuler le transfert'}
          danger={action.type === 'annuler'}
          onConfirm={async () => {
            try {
              if (action.type === 'recevoir') await stockService.recevoirTransfert(action.t.id);
              else await stockService.annulerTransfert(action.t.id);
              showToast(action.type === 'recevoir' ? 'Transfert réceptionné' : 'Transfert annulé');
              liste.recharger();
            } catch (e) {
              showToast(e instanceof ApiClientError ? e.message : 'Opération impossible', 'erreur');
            }
          }}
          onClose={() => setAction(null)}
        />
      )}
    </div>
  );
}
