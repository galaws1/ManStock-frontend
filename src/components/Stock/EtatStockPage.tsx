import { ArrowDownToLine, ArrowRightLeft, ArrowUpFromLine, ClipboardCheck } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useStock } from '../../context/StockContext';
import { useMagasins } from '../../hooks/useMagasins';
import { usePagination } from '../../hooks/usePagination';
import { ApiClientError } from '../../services/axiosConfig';
import { produitService } from '../../services/domains/produitService';
import { stockService } from '../../services/domains/stockService';
import { ROLES_STOCK } from '../../types/role';
import type { DetailStockLigne, EtatStockLigne } from '../../types/stock';
import { formatNombre } from '../../utils/formatters';
import { ChampRecherche } from '../common/ChampRecherche';
import { DataTable, type Colonne } from '../common/DataTable';
import { Modal } from '../common/Modal';
import { PageEntete } from '../common/PageEntete';
import { Pagination } from '../common/Pagination';
import { PermissionGate } from '../common/PermissionGate';
import { MouvementModal, type TypeSaisie } from './MouvementModal';

function DetailModal({ ligne, magasinId, onClose }: { ligne: EtatStockLigne; magasinId: number; onClose: () => void }) {
  const [detail, setDetail] = useState<DetailStockLigne[] | null>(null);
  const [repartition, setRepartition] = useState<string | null>(null);
  useEffect(() => {
    stockService.detail(ligne.produitId, magasinId).then(setDetail).catch(() => setDetail([]));
    if (ligne.quantite > 0) {
      produitService.convertir(ligne.produitId, ligne.quantite)
        .then((c) => setRepartition(c.decomposition.map((d) => `${formatNombre(d.quantite)} × ${d.libelle}`).join(' + ')))
        .catch(() => undefined);
    }
  }, [ligne, magasinId]);
  return (
    <Modal titre={ligne.produitNom} onClose={onClose} pied={<button className="btn-secondaire" onClick={onClose}>Fermer</button>}>
      <p className="text-lg font-semibold">{formatNombre(ligne.quantite)} {ligne.uniteSymbole}</p>
      {repartition && <p className="mb-4 text-sm text-encre-douce">Soit {repartition}</p>}
      <table className="w-full text-sm">
        <thead className="border-b border-ligne text-left text-encre-douce"><tr><th className="py-1.5">Lot</th><th className="py-1.5">Péremption</th><th className="py-1.5">Emplacement</th><th className="py-1.5 text-right">Quantité</th></tr></thead>
        <tbody>
          {detail?.map((d) => (
            <tr key={d.stockId} className="border-b border-ligne last:border-0">
              <td className="py-1.5">{d.numeroLot ?? '—'}</td>
              <td className="py-1.5">{d.datePeremption ? new Date(d.datePeremption).toLocaleDateString('fr-FR') : '—'}</td>
              <td className="py-1.5 font-mono">{d.emplacementCode ?? '—'}</td>
              <td className="py-1.5 text-right tabular-nums">{formatNombre(d.quantite)}</td>
            </tr>
          ))}
          {detail?.length === 0 && <tr><td colSpan={4} className="py-4 text-center text-encre-douce">Aucun stock.</td></tr>}
        </tbody>
      </table>
    </Modal>
  );
}

export function EtatStockPage() {
  const { showToast } = useStock();
  const { magasins, magasinId, setMagasinId, verrouille } = useMagasins();
  const [recherche, setRecherche] = useState('');
  const [alerte, setAlerte] = useState(false);
  const [detail, setDetail] = useState<EtatStockLigne | null>(null);
  const [saisie, setSaisie] = useState<TypeSaisie | null>(null);

  const filtres = useMemo(() => ({ magasinId: magasinId ?? 0, recherche: recherche.trim(), alerte }), [magasinId, recherche, alerte]);
  const liste = usePagination((p) => (p.magasinId ? stockService.etat(p) : Promise.resolve({ content: [], page: 0, size: p.size, totalElements: 0, totalPages: 0 })), filtres, {
    triInitial: 'nom',
    onErreur: (e) => showToast(e instanceof ApiClientError ? e.message : 'Chargement impossible', 'erreur'),
  });

  const aujourdHui = new Date();
  const colonnes: Colonne<EtatStockLigne>[] = [
    { cle: 'produit', titre: 'Produit', rendu: (l) => <button className="text-left font-medium hover:underline" onClick={() => setDetail(l)}>{l.produitNom}<span className="block text-xs font-normal text-encre-douce">{l.categorieNom}</span></button> },
    { cle: 'quantite', titre: 'En stock', className: 'text-right', rendu: (l) => <span className={`tabular-nums ${l.critique ? 'font-semibold text-alerte' : ''}`}>{formatNombre(l.quantite)} {l.uniteSymbole}</span> },
    { cle: 'seuil', titre: 'Seuil', className: 'text-right', rendu: (l) => <span className="tabular-nums text-encre-douce">{formatNombre(l.seuilAlerte)}</span> },
    {
      cle: 'peremption',
      titre: 'Prochaine péremption',
      rendu: (l) => {
        if (!l.prochainePeremption) return <span className="text-encre-douce">—</span>;
        const d = new Date(l.prochainePeremption);
        const jours = Math.ceil((d.getTime() - aujourdHui.getTime()) / 86_400_000);
        return <span className={jours <= 0 ? 'font-semibold text-alerte' : jours <= 30 ? 'text-ambre-fonce' : ''}>{d.toLocaleDateString('fr-FR')}{jours <= 0 ? ' (périmé)' : jours <= 30 ? ` (J-${jours})` : ''}</span>;
      },
    },
    { cle: 'etat', titre: 'État', rendu: (l) => (l.critique ? <span className="rounded-sm bg-alerte-pale px-2 py-0.5 text-xs font-medium text-alerte">{l.quantite === 0 ? 'Rupture' : 'Stock critique'}</span> : <span className="rounded-sm bg-succes-pale px-2 py-0.5 text-xs font-medium text-succes">Suffisant</span>) },
  ];

  return (
    <div>
      <PageEntete
        titre="État du stock"
        description="Quantités par magasin, en unité de base. Cliquez sur un produit pour voir ses lots, emplacements et l’équivalent en cartons."
        actions={
          <PermissionGate roles={ROLES_STOCK}>
            <div className="flex flex-wrap gap-2">
              <button className="btn-secondaire" onClick={() => setSaisie('entree')} disabled={!magasinId}><ArrowDownToLine size={15} aria-hidden /> Entrée</button>
              <button className="btn-secondaire" onClick={() => setSaisie('sortie')} disabled={!magasinId}><ArrowUpFromLine size={15} aria-hidden /> Sortie</button>
              <button className="btn-secondaire" onClick={() => setSaisie('ajustement')} disabled={!magasinId}><ClipboardCheck size={15} aria-hidden /> Inventaire</button>
              <button className="btn-secondaire" onClick={() => setSaisie('transfert')} disabled={!magasinId || magasins.length < 2}><ArrowRightLeft size={15} aria-hidden /> Transfert</button>
            </div>
          </PermissionGate>
        }
      />
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <select className="champ w-auto min-w-[12rem]" aria-label="Magasin" value={magasinId ?? ''} disabled={verrouille} onChange={(e) => setMagasinId(Number(e.target.value))}>
          {magasins.map((m) => <option key={m.id} value={m.id}>{m.libelle}</option>)}
        </select>
        <ChampRecherche valeur={recherche} onChange={setRecherche} placeholder="Nom ou code-barre" label="Rechercher un produit" />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" className="h-4 w-4 accent-acier" checked={alerte} onChange={(e) => setAlerte(e.target.checked)} />
          Stock critique uniquement
        </label>
      </div>
      <DataTable
        colonnes={colonnes}
        lignes={liste.lignes}
        cleLigne={(l) => l.produitId}
        chargement={liste.chargement}
        classeLigne={(l) => (l.critique ? 'bg-alerte-pale/30' : '')}
        vide={alerte ? 'Aucun produit en stock critique.' : 'Aucun produit.'}
        pied={<Pagination resultat={liste.resultat} page={liste.page} onPage={liste.setPage} taille={liste.taille} onTaille={liste.setTaille} />}
      />
      {detail && magasinId && <DetailModal ligne={detail} magasinId={magasinId} onClose={() => setDetail(null)} />}
      {saisie && magasinId && (
        <MouvementModal type={saisie} magasinId={magasinId} magasins={magasins} onClose={() => setSaisie(null)}
          onFait={(m) => { setSaisie(null); showToast(m); liste.recharger(); }} />
      )}
    </div>
  );
}
