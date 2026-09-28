import { ArrowLeft } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useStock } from '../../context/StockContext';
import { useMagasins } from '../../hooks/useMagasins';
import { ApiClientError } from '../../services/axiosConfig';
import { factureService } from '../../services/domains/factureService';
import { clientService } from '../../services/domains/partenaireService';
import type { Option } from '../../types/common';
import type { FactureRequest } from '../../types/facture';
import { formatMontant, parseNombre, versSaisie } from '../../utils/formatters';
import { totalLignes } from '../../utils/ventes';
import { ErreurGlobale } from '../common/ErreurGlobale';
import { ProduitPicker } from '../common/ProduitPicker';
import { ajouterArticle, LignesVenteEditeur, type LigneEdition } from './LignesVenteEditeur';

/** Création ou modification d'un BROUILLON de facture (/ventes/factures/nouvelle, /ventes/factures/:id/modifier). */
export function FactureEditionPage() {
  const params = useParams();
  const id = params.id ? Number(params.id) : undefined;
  const navigate = useNavigate();
  const { showToast } = useStock();
  const { magasins, magasinId, setMagasinId, verrouille } = useMagasins();
  const [clients, setClients] = useState<Option[]>([]);
  const [clientId, setClientId] = useState('');
  const [remise, setRemise] = useState('0');
  const [lignes, setLignes] = useState<LigneEdition[]>([]);
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  useEffect(() => {
    clientService.options().then(setClients).catch(() => setClients([]));
  }, []);

  useEffect(() => {
    if (!id) return;
    factureService.getById(id).then((f) => {
      if (f.statut !== 'BROUILLON') navigate(`/ventes/factures/${id}`, { replace: true });
      setClientId(f.clientId ? String(f.clientId) : '');
      setRemise(versSaisie(f.remisePourcent));
      setMagasinId(f.magasinId);
      setLignes(
        (f.lignes ?? []).map((l) => ({
          cle: `f${l.id}`, produitId: l.produitId, produitNom: l.produitNom, uniteSymbole: l.paquetageId ? '' : l.conditionnement,
          paquetageId: l.paquetageId, conditionnement: l.conditionnement, prixUnitaire: l.prixUnitaire, prixCatalogue: l.prixUnitaire, quantite: l.quantite,
        })),
      );
    });
  }, [id, navigate, setMagasinId]);

  const remiseNum = Math.min(100, Math.max(0, parseNombre(remise) || 0));
  const { brut, remise: montantRemise, total } = totalLignes(lignes, remiseNum);

  const enregistrer = async () => {
    if (lignes.length === 0) return setErreur('Ajoutez au moins un article');
    const payload: FactureRequest = {
      clientId: clientId ? Number(clientId) : undefined,
      magasinId,
      remisePourcent: remiseNum,
      lignes: lignes.map((l) => ({ produitId: l.produitId, paquetageId: l.paquetageId, quantite: l.quantite, prixUnitaire: l.prixUnitaire })),
    };
    setEnCours(true);
    setErreur(null);
    try {
      const f = id ? await factureService.update(id, payload) : await factureService.create(payload);
      showToast('Brouillon enregistré');
      navigate(`/ventes/factures/${f.id}`);
    } catch (e) {
      setErreur(e instanceof ApiClientError ? e.message : 'Enregistrement impossible');
    } finally {
      setEnCours(false);
    }
  };

  return (
    <div>
      <Link to="/ventes/factures" className="mb-3 inline-flex items-center gap-1 text-sm text-encre-douce hover:text-encre">
        <ArrowLeft size={14} aria-hidden /> Factures
      </Link>
      <h1 className="mb-1">{id ? 'Modifier le brouillon' : 'Nouvelle facture'}</h1>
      <p className="mb-6 text-sm text-encre-douce">La facture reste un brouillon modifiable jusqu’à sa validation, qui la numérote et sort la marchandise du stock.</p>
      <ErreurGlobale message={erreur} />

      <div className="mb-4 grid gap-4 sm:grid-cols-2">
        <label>
          <span className="etiquette">Client</span>
          <select className="champ" value={clientId} onChange={(e) => setClientId(e.target.value)}>
            <option value="">Client comptoir (sans nom)</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.libelle}</option>
            ))}
          </select>
        </label>
        <label>
          <span className="etiquette">Magasin</span>
          <select className="champ" value={magasinId ?? ''} disabled={verrouille || !!id} onChange={(e) => setMagasinId(Number(e.target.value))}>
            {magasins.map((m) => (
              <option key={m.id} value={m.id}>{m.libelle}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="mb-3">
        <ProduitPicker onChoix={(c) => setLignes((l) => ajouterArticle(l, c))} />
      </div>
      <LignesVenteEditeur lignes={lignes} onChange={setLignes} prixModifiable />

      <div className="mt-4 flex flex-wrap items-start justify-end gap-6">
        <dl className="w-72 space-y-1.5 rounded border border-ligne bg-white p-4 text-sm">
          <div className="flex justify-between"><dt>Sous-total</dt><dd className="tabular-nums">{formatMontant(brut)}</dd></div>
          <div className="flex items-center justify-between">
            <dt><label htmlFor="remise-facture">Remise (%)</label></dt>
            <dd><input id="remise-facture" className="champ w-20 py-1 text-right" inputMode="decimal" value={remise} onChange={(e) => setRemise(e.target.value)} /></dd>
          </div>
          {montantRemise > 0 && <div className="flex justify-between text-encre-douce"><dt>Remise</dt><dd className="tabular-nums">−{formatMontant(montantRemise)}</dd></div>}
          <div className="flex justify-between border-t border-ligne pt-2 text-lg font-bold"><dt>Total</dt><dd className="tabular-nums">{formatMontant(total)}</dd></div>
        </dl>
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <Link to="/ventes/factures" className="btn-secondaire">Annuler</Link>
        <button className="btn-primaire" onClick={enregistrer} disabled={enCours || !magasinId}>
          {enCours ? 'Enregistrement…' : 'Enregistrer le brouillon'}
        </button>
      </div>
    </div>
  );
}
