import { Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useStock } from '../../context/StockContext';
import { usePagination } from '../../hooks/usePagination';
import { ApiClientError } from '../../services/axiosConfig';
import { factureService } from '../../services/domains/factureService';
import type { Facture, StatutFacture, TypeFacture } from '../../types/facture';
import { ROLES_FACTURATION } from '../../types/role';
import { formatDateHeure, formatMontant } from '../../utils/formatters';
import { ChampRecherche } from '../common/ChampRecherche';
import { DataTable, type Colonne } from '../common/DataTable';
import { PageEntete } from '../common/PageEntete';
import { Pagination } from '../common/Pagination';
import { PermissionGate } from '../common/PermissionGate';
import { BadgeFacture } from './badges';

export function FacturesPage() {
  const { showToast } = useStock();
  const [recherche, setRecherche] = useState('');
  const [type, setType] = useState<TypeFacture | ''>('');
  const [statut, setStatut] = useState<StatutFacture | ''>('');
  const [du, setDu] = useState('');
  const [au, setAu] = useState('');

  const filtres = useMemo(
    () => ({ recherche: recherche.trim(), type: type || undefined, statut: statut || undefined, du: du || undefined, au: au || undefined }),
    [recherche, type, statut, du, au],
  );
  const liste = usePagination((p) => factureService.getPage(p), filtres, {
    triInitial: 'date',
    sensInitial: 'desc',
    onErreur: (e) => showToast(e instanceof ApiClientError ? e.message : 'Chargement impossible', 'erreur'),
  });

  const colonnes: Colonne<Facture>[] = [
    {
      cle: 'numero',
      titre: 'Pièce',
      tri: 'numero',
      rendu: (f) => (
        <Link to={`/ventes/factures/${f.id}`} className="font-medium hover:underline">
          {f.numero ?? 'Brouillon'}
          <span className="block text-xs font-normal text-encre-douce">{f.type === 'TICKET' ? `Ticket · ${f.caisseNom ?? ''}` : 'Facture'}</span>
        </Link>
      ),
    },
    { cle: 'date', titre: 'Date', tri: 'date', rendu: (f) => <span className="text-encre-douce">{formatDateHeure(f.dateFacture)}</span> },
    { cle: 'client', titre: 'Client', rendu: (f) => f.clientNom ?? <span className="text-encre-douce">—</span> },
    { cle: 'magasin', titre: 'Magasin', rendu: (f) => f.magasinNom },
    { cle: 'montant', titre: 'Montant', tri: 'montant', className: 'text-right', rendu: (f) => <span className="tabular-nums">{formatMontant(f.montantTotal)}</span> },
    {
      cle: 'reste',
      titre: 'Reste dû',
      className: 'text-right',
      rendu: (f) => (f.statut === 'VALIDEE' && f.resteAPayer > 0 ? <span className="tabular-nums text-ambre-fonce">{formatMontant(f.resteAPayer)}</span> : <span className="text-encre-douce">—</span>),
    },
    { cle: 'statut', titre: 'Statut', rendu: (f) => <BadgeFacture statut={f.statut} paiement={f.statutPaiement} /> },
  ];

  return (
    <div>
      <PageEntete
        titre="Factures et tickets"
        description="Toutes les ventes : tickets de caisse et factures. Une pièce validée ne se modifie plus ; elle peut être annulée par un responsable."
        actions={
          <PermissionGate roles={ROLES_FACTURATION}>
            <Link to="/ventes/factures/nouvelle" className="btn-primaire">
              <Plus size={16} aria-hidden /> Nouvelle facture
            </Link>
          </PermissionGate>
        }
      />
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <ChampRecherche valeur={recherche} onChange={setRecherche} placeholder="Numéro ou client" label="Rechercher une pièce" />
        <select className="champ w-auto" aria-label="Type" value={type} onChange={(e) => setType(e.target.value as TypeFacture | '')}>
          <option value="">Tickets et factures</option>
          <option value="TICKET">Tickets</option>
          <option value="FACTURE">Factures</option>
        </select>
        <select className="champ w-auto" aria-label="Statut" value={statut} onChange={(e) => setStatut(e.target.value as StatutFacture | '')}>
          <option value="">Tous les statuts</option>
          <option value="BROUILLON">Brouillons</option>
          <option value="VALIDEE">Validées</option>
          <option value="ANNULEE">Annulées</option>
        </select>
        <label className="flex items-center gap-1.5 text-sm text-encre-douce">
          Du <input type="date" className="champ w-auto py-1.5" value={du} onChange={(e) => setDu(e.target.value)} />
        </label>
        <label className="flex items-center gap-1.5 text-sm text-encre-douce">
          au <input type="date" className="champ w-auto py-1.5" value={au} onChange={(e) => setAu(e.target.value)} />
        </label>
      </div>
      <DataTable
        colonnes={colonnes}
        lignes={liste.lignes}
        cleLigne={(f) => f.id}
        chargement={liste.chargement}
        classeLigne={(f) => (f.statut === 'ANNULEE' ? 'text-encre-douce line-through decoration-encre-douce/40' : '')}
        triCourant={{ tri: liste.tri, sens: liste.sens }}
        onTrier={liste.trier}
        vide="Aucune pièce sur cette période."
        pied={<Pagination resultat={liste.resultat} page={liste.page} onPage={liste.setPage} taille={liste.taille} onTaille={liste.setTaille} />}
      />
    </div>
  );
}
