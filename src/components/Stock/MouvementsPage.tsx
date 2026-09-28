import { useMemo, useState } from 'react';
import { useStock } from '../../context/StockContext';
import { useMagasins } from '../../hooks/useMagasins';
import { usePagination } from '../../hooks/usePagination';
import { ApiClientError } from '../../services/axiosConfig';
import { stockService } from '../../services/domains/stockService';
import type { Mouvement, TypeMouvement } from '../../types/stock';
import { LIBELLES_MOUVEMENT } from '../../types/stock';
import { formatDateHeure, formatNombre } from '../../utils/formatters';
import { DataTable, type Colonne } from '../common/DataTable';
import { PageEntete } from '../common/PageEntete';
import { Pagination } from '../common/Pagination';

/** Journal des mouvements (lecture seule : chaque variation de stock y est tracée). */
export function MouvementsPage() {
  const { showToast } = useStock();
  const { magasins, magasinId, setMagasinId, verrouille } = useMagasins();
  const [type, setType] = useState<TypeMouvement | ''>('');
  const [du, setDu] = useState('');
  const [au, setAu] = useState('');

  const filtres = useMemo(() => ({ magasinId, type: type || undefined, du: du || undefined, au: au || undefined }), [magasinId, type, du, au]);
  const liste = usePagination((p) => stockService.journal(p), filtres, {
    triInitial: 'date',
    sensInitial: 'desc',
    onErreur: (e) => showToast(e instanceof ApiClientError ? e.message : 'Chargement impossible', 'erreur'),
  });

  const colonnes: Colonne<Mouvement>[] = [
    { cle: 'date', titre: 'Date', tri: 'date', rendu: (m) => <span className="whitespace-nowrap text-encre-douce">{formatDateHeure(m.date)}</span> },
    { cle: 'produit', titre: 'Produit', tri: 'produit', rendu: (m) => <span className="font-medium">{m.produitNom}{m.numeroLot && <span className="block text-xs font-normal text-encre-douce">Lot {m.numeroLot}</span>}</span> },
    { cle: 'type', titre: 'Type', rendu: (m) => LIBELLES_MOUVEMENT[m.type] },
    {
      cle: 'quantite',
      titre: 'Quantité',
      className: 'text-right',
      rendu: (m) => <span className={`font-semibold tabular-nums ${m.sens === '+' ? 'text-succes' : 'text-alerte'}`}>{m.sens === '+' ? '+' : '−'}{formatNombre(m.quantite)} {m.uniteSymbole}</span>,
    },
    { cle: 'motif', titre: 'Motif / pièce', rendu: (m) => <span>{m.motif}{m.reference && m.reference !== 'MANUEL' && <span className="block font-mono text-xs text-encre-douce">{m.reference}</span>}</span> },
    { cle: 'qui', titre: 'Par', rendu: (m) => <span className="text-encre-douce">{m.utilisateur}</span> },
  ];

  return (
    <div>
      <PageEntete titre="Mouvements de stock" description="Journal de toutes les entrées et sorties : ventes, réceptions, transferts, ajustements et annulations." />
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <select className="champ w-auto min-w-[12rem]" aria-label="Magasin" value={magasinId ?? ''} disabled={verrouille} onChange={(e) => setMagasinId(Number(e.target.value))}>
          {magasins.map((m) => <option key={m.id} value={m.id}>{m.libelle}</option>)}
        </select>
        <select className="champ w-auto" aria-label="Type de mouvement" value={type} onChange={(e) => setType(e.target.value as TypeMouvement | '')}>
          <option value="">Tous les types</option>
          {(Object.keys(LIBELLES_MOUVEMENT) as TypeMouvement[]).filter((t) => t !== 'CONVERSION').map((t) => <option key={t} value={t}>{LIBELLES_MOUVEMENT[t]}</option>)}
        </select>
        <label className="flex items-center gap-1.5 text-sm text-encre-douce">Du <input type="date" className="champ w-auto py-1.5" value={du} onChange={(e) => setDu(e.target.value)} /></label>
        <label className="flex items-center gap-1.5 text-sm text-encre-douce">au <input type="date" className="champ w-auto py-1.5" value={au} onChange={(e) => setAu(e.target.value)} /></label>
      </div>
      <DataTable colonnes={colonnes} lignes={liste.lignes} cleLigne={(m) => m.id} chargement={liste.chargement}
        triCourant={{ tri: liste.tri, sens: liste.sens }} onTrier={liste.trier} vide="Aucun mouvement sur cette période."
        pied={<Pagination resultat={liste.resultat} page={liste.page} onPage={liste.setPage} taille={liste.taille} onTaille={liste.setTaille} />} />
    </div>
  );
}
