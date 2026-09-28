import { Plus } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useStock } from '../../context/StockContext';
import { usePagination } from '../../hooks/usePagination';
import { ApiClientError } from '../../services/axiosConfig';
import { commandeService } from '../../services/domains/commandeService';
import { fournisseurService } from '../../services/domains/partenaireService';
import type { Commande, StatutCommande } from '../../types/commande';
import { LIBELLES_STATUT_COMMANDE } from '../../types/commande';
import type { Option } from '../../types/common';
import { ROLES_APPROVISIONNEMENT } from '../../types/role';
import { formatDateHeure, formatMontant } from '../../utils/formatters';
import { DataTable, type Colonne } from '../common/DataTable';
import { PageEntete } from '../common/PageEntete';
import { Pagination } from '../common/Pagination';
import { PermissionGate } from '../common/PermissionGate';
import { BadgeCommande } from '../Ventes/badges';

export function CommandesPage() {
  const { showToast } = useStock();
  const [fournisseurs, setFournisseurs] = useState<Option[]>([]);
  const [fournisseurId, setFournisseurId] = useState('');
  const [statut, setStatut] = useState<StatutCommande | ''>('');

  useEffect(() => {
    fournisseurService.options().then(setFournisseurs).catch(() => setFournisseurs([]));
  }, []);

  const filtres = useMemo(() => ({ fournisseurId: fournisseurId ? Number(fournisseurId) : undefined, statut: statut || undefined }), [fournisseurId, statut]);
  const liste = usePagination((p) => commandeService.getPage(p), filtres, {
    triInitial: 'date',
    sensInitial: 'desc',
    onErreur: (e) => showToast(e instanceof ApiClientError ? e.message : 'Chargement impossible', 'erreur'),
  });

  const colonnes: Colonne<Commande>[] = [
    { cle: 'ref', titre: 'Commande', rendu: (c) => <Link to={`/achats/commandes/${c.id}`} className="font-medium hover:underline">{c.reference}</Link> },
    { cle: 'date', titre: 'Date', tri: 'date', rendu: (c) => <span className="text-encre-douce">{formatDateHeure(c.dateCommande)}</span> },
    { cle: 'fournisseur', titre: 'Fournisseur', tri: 'fournisseur', rendu: (c) => c.fournisseurNom },
    { cle: 'magasin', titre: 'Magasin', rendu: (c) => c.magasinNom },
    { cle: 'montant', titre: 'Montant', tri: 'montant', className: 'text-right', rendu: (c) => <span className="tabular-nums">{formatMontant(c.montantTotal)}</span> },
    { cle: 'statut', titre: 'Statut', rendu: (c) => <BadgeCommande statut={c.statut} /> },
  ];

  return (
    <div>
      <PageEntete
        titre="Commandes fournisseurs"
        description="Brouillon → soumise → validée (par un directeur au-delà du seuil) → reçue. La réception fait entrer la marchandise en stock."
        actions={
          <PermissionGate roles={ROLES_APPROVISIONNEMENT}>
            <Link to="/achats/commandes/nouvelle" className="btn-primaire"><Plus size={16} aria-hidden /> Nouvelle commande</Link>
          </PermissionGate>
        }
      />
      <div className="mb-4 flex flex-wrap gap-3">
        <select className="champ w-auto min-w-[12rem]" aria-label="Fournisseur" value={fournisseurId} onChange={(e) => setFournisseurId(e.target.value)}>
          <option value="">Tous les fournisseurs</option>
          {fournisseurs.map((f) => <option key={f.id} value={f.id}>{f.libelle}</option>)}
        </select>
        <select className="champ w-auto" aria-label="Statut" value={statut} onChange={(e) => setStatut(e.target.value as StatutCommande | '')}>
          <option value="">Tous les statuts</option>
          {(Object.keys(LIBELLES_STATUT_COMMANDE) as StatutCommande[]).map((s) => <option key={s} value={s}>{LIBELLES_STATUT_COMMANDE[s]}</option>)}
        </select>
      </div>
      <DataTable
        colonnes={colonnes}
        lignes={liste.lignes}
        cleLigne={(c) => c.id}
        chargement={liste.chargement}
        triCourant={{ tri: liste.tri, sens: liste.sens }}
        onTrier={liste.trier}
        vide="Aucune commande."
        pied={<Pagination resultat={liste.resultat} page={liste.page} onPage={liste.setPage} taille={liste.taille} onTaille={liste.setTaille} />}
      />
    </div>
  );
}
