import { Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import type { ModePaiement, PaiementRequest } from '../../types/facture';
import { LIBELLES_MODE } from '../../types/facture';
import { formatMontant, parseNombre, versSaisie } from '../../utils/formatters';
import { calculerRendu, MODES } from '../../utils/ventes';
import { ErreurGlobale } from '../common/ErreurGlobale';
import { Modal } from '../common/Modal';

interface Props {
  total: number;
  enCours: boolean;
  erreur: string | null;
  onValider: (paiements: PaiementRequest[]) => void;
  onClose: () => void;
}

/** Encaissement : un ou plusieurs moyens ; le rendu de monnaie est calculé en direct. */
export function PaiementModal({ total, enCours, erreur, onValider, onClose }: Props) {
  const [lignes, setLignes] = useState<{ mode: ModePaiement; saisie: string }[]>([{ mode: 'ESPECES', saisie: versSaisie(total) }]);
  const paiements = lignes.map((l) => ({ mode: l.mode, montant: parseNombre(l.saisie) })).filter((p) => !Number.isNaN(p.montant) && p.montant > 0);
  const { recu, rendu, manque, erreur: erreurRendu } = calculerRendu(total, paiements);
  const possible = manque === 0 && !erreurRendu && paiements.length > 0;
  const billets = [total, Math.ceil(total / 1000) * 1000, Math.ceil(total / 5000) * 5000, Math.ceil(total / 10000) * 10000]
    .filter((v, i, t) => v >= total && t.indexOf(v) === i);

  return (
    <Modal
      titre={`Encaisser ${formatMontant(total)}`}
      onClose={onClose}
      largeur="sm"
      pied={
        <>
          <button className="btn-secondaire" onClick={onClose} disabled={enCours}>Retour au panier</button>
          <button className="btn-primaire" onClick={() => onValider(paiements)} disabled={!possible || enCours}>
            {enCours ? 'Enregistrement…' : 'Valider la vente'}
          </button>
        </>
      }
    >
      <ErreurGlobale message={erreur} />
      <div className="space-y-2">
        {lignes.map((l, i) => (
          <div key={i} className="flex items-center gap-2">
            <select aria-label="Mode de paiement" className="champ w-40" value={l.mode} onChange={(e) => setLignes(lignes.map((x, j) => (j === i ? { ...x, mode: e.target.value as ModePaiement } : x)))}>
              {MODES.map((m) => (
                <option key={m} value={m}>{LIBELLES_MODE[m]}</option>
              ))}
            </select>
            <input
              aria-label="Montant reçu"
              className="champ flex-1 text-right text-lg tabular-nums"
              inputMode="decimal"
              value={l.saisie}
              autoFocus={i === 0}
              onChange={(e) => setLignes(lignes.map((x, j) => (j === i ? { ...x, saisie: e.target.value } : x)))}
            />
            {lignes.length > 1 && (
              <button className="btn-discret" aria-label="Retirer ce paiement" onClick={() => setLignes(lignes.filter((_, j) => j !== i))}>
                <Trash2 size={15} />
              </button>
            )}
          </div>
        ))}
      </div>
      {lignes.length === 1 && lignes[0].mode === 'ESPECES' && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {billets.map((b) => (
            <button key={b} className="btn-secondaire px-2.5 py-1 text-xs" onClick={() => setLignes([{ mode: 'ESPECES', saisie: versSaisie(b) }])}>
              {formatMontant(b)}
            </button>
          ))}
        </div>
      )}
      <button className="btn-discret mt-2 text-sm" onClick={() => setLignes([...lignes, { mode: 'CARTE', saisie: versSaisie(manque || 0) }])}>
        <Plus size={14} aria-hidden /> Ajouter un moyen de paiement
      </button>
      <dl className="mt-4 space-y-1 border-t border-ligne pt-3 text-sm">
        <div className="flex justify-between"><dt>Reçu</dt><dd className="tabular-nums">{formatMontant(recu)}</dd></div>
        {manque > 0 && <div className="flex justify-between font-medium text-alerte"><dt>Reste à payer</dt><dd className="tabular-nums">{formatMontant(manque)}</dd></div>}
        {rendu > 0 && !erreurRendu && (
          <div className="flex justify-between text-lg font-bold"><dt>À rendre</dt><dd className="tabular-nums">{formatMontant(rendu)}</dd></div>
        )}
        {erreurRendu && <p className="text-alerte">{erreurRendu}</p>}
      </dl>
    </Modal>
  );
}
