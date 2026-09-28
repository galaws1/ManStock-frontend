import { useState } from 'react';
import { ApiClientError } from '../../services/axiosConfig';
import { stockService } from '../../services/domains/stockService';
import type { Option } from '../../types/common';
import { nbDecimales, parseNombre } from '../../utils/formatters';
import { ErreurGlobale } from '../common/ErreurGlobale';
import { Modal } from '../common/Modal';
import { ProduitPicker, type ChoixProduit } from '../common/ProduitPicker';

export type TypeSaisie = 'entree' | 'sortie' | 'ajustement' | 'transfert';

const TITRES: Record<TypeSaisie, string> = {
  entree: 'Entrée en stock', sortie: 'Sortie de stock (perte, casse…)', ajustement: 'Ajustement d’inventaire', transfert: 'Transfert vers un autre magasin',
};

/** Contrôle commun de la quantité (3 décimales, positive ; zéro admis pour un inventaire). */
export function quantiteValide(saisie: string, zeroAdmis = false): number | null {
  const q = parseNombre(saisie);
  if (Number.isNaN(q) || q < 0 || (!zeroAdmis && q === 0) || nbDecimales(saisie) > 3) return null;
  return q;
}

interface Props {
  type: TypeSaisie;
  magasinId: number;
  magasins: Option[];
  onClose: () => void;
  onFait: (message: string) => void;
}

export function MouvementModal({ type, magasinId, magasins, onClose, onFait }: Props) {
  const [produit, setProduit] = useState<ChoixProduit | null>(null);
  const [quantite, setQuantite] = useState('');
  const [motif, setMotif] = useState('');
  const [numeroLot, setNumeroLot] = useState('');
  const [peremption, setPeremption] = useState('');
  const [destination, setDestination] = useState('');
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  const valider = async () => {
    if (!produit) return setErreur('Choisissez un produit');
    const q = quantiteValide(quantite, type === 'ajustement');
    if (q === null) return setErreur(type === 'ajustement' ? 'Quantité comptée invalide' : 'Quantité positive attendue (3 décimales max.)');
    if (type !== 'transfert' && !motif.trim()) return setErreur('Le motif est obligatoire');
    if (type === 'transfert' && !destination) return setErreur('Choisissez le magasin de destination');
    setEnCours(true);
    setErreur(null);
    try {
      const base = { produitId: produit.produitId, magasinId };
      if (type === 'entree') await stockService.entree({ ...base, quantite: q, motif: motif.trim(), numeroLot: numeroLot.trim() || undefined, datePeremption: peremption || undefined });
      if (type === 'sortie') await stockService.sortie({ ...base, quantite: q, motif: motif.trim() });
      if (type === 'ajustement') await stockService.ajustement({ ...base, quantiteComptee: q, motif: motif.trim() });
      if (type === 'transfert') await stockService.transferer({ produitId: produit.produitId, magasinSourceId: magasinId, magasinDestinationId: Number(destination), quantite: q });
      onFait(type === 'transfert' ? 'Transfert envoyé : à réceptionner par le magasin de destination' : 'Mouvement enregistré');
    } catch (e) {
      setErreur(e instanceof ApiClientError ? e.message : 'Opération impossible');
    } finally {
      setEnCours(false);
    }
  };

  return (
    <Modal titre={TITRES[type]} onClose={onClose}
      pied={<><button className="btn-secondaire" onClick={onClose}>Annuler</button><button className="btn-primaire" onClick={valider} disabled={enCours}>{enCours ? 'Enregistrement…' : 'Enregistrer'}</button></>}>
      <ErreurGlobale message={erreur} />
      <div className="space-y-4">
        {produit ? (
          <p className="flex items-center justify-between rounded bg-papier px-3 py-2 text-sm">
            <span className="font-medium">{produit.produitNom}</span>
            <button className="btn-discret text-xs" onClick={() => setProduit(null)}>Changer</button>
          </p>
        ) : (
          <ProduitPicker scan={false} placeholder="Choisir le produit" onChoix={setProduit} autoFocus />
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <label>
            <span className="etiquette">{type === 'ajustement' ? `Quantité comptée${produit ? ` (${produit.uniteSymbole})` : ''}` : `Quantité${produit ? ` (${produit.uniteSymbole})` : ''}`}</span>
            <input className="champ" inputMode="decimal" value={quantite} onChange={(e) => setQuantite(e.target.value)} />
          </label>
          {type === 'transfert' ? (
            <label>
              <span className="etiquette">Vers le magasin</span>
              <select className="champ" value={destination} onChange={(e) => setDestination(e.target.value)}>
                <option value="">Choisir…</option>
                {magasins.filter((m) => m.id !== magasinId).map((m) => <option key={m.id} value={m.id}>{m.libelle}</option>)}
              </select>
            </label>
          ) : (
            <label>
              <span className="etiquette">Motif</span>
              <input className="champ" value={motif} maxLength={200} placeholder={type === 'sortie' ? 'Casse, périmé, vol…' : type === 'entree' ? 'Stock initial, retour client…' : 'Inventaire du…'} onChange={(e) => setMotif(e.target.value)} />
            </label>
          )}
        </div>
        {type === 'entree' && (
          <div className="grid gap-4 sm:grid-cols-2">
            <label><span className="etiquette">N° de lot (facultatif)</span><input className="champ" value={numeroLot} maxLength={60} onChange={(e) => setNumeroLot(e.target.value)} /></label>
            <label><span className="etiquette">Péremption{produit?.perissable ? ' (obligatoire)' : ''}</span><input type="date" className="champ" value={peremption} onChange={(e) => setPeremption(e.target.value)} /></label>
          </div>
        )}
        {type === 'ajustement' && <p className="text-sm text-encre-douce">L’écart avec la quantité enregistrée est calculé et tracé comme mouvement d’ajustement (stock sans lot ni emplacement).</p>}
      </div>
    </Modal>
  );
}
