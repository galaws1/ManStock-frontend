import { ArrowRight } from 'lucide-react';
import { useEffect, useId, useState } from 'react';
import { ApiClientError } from '../../services/axiosConfig';
import { produitService } from '../../services/domains/produitService';
import type { Conversion, Paquetage, Produit } from '../../types/produit';
import { formatNombre, parseNombre } from '../../utils/formatters';

/**
 * Calcul fait par le backend (ConversionService), qui servira aussi aux mouvements
 * de stock : une seule source de vérité pour les arrondis et la décomposition.
 */
export function ConversionCalculateur({ produit, paquetages }: { produit: Produit; paquetages: Paquetage[] }) {
  const plusGrand = paquetages.length ? paquetages[paquetages.length - 1].id : '';
  const [quantite, setQuantite] = useState('1');
  const [depuis, setDepuis] = useState<string>(String(plusGrand));
  const [vers, setVers] = useState('');
  const [resultat, setResultat] = useState<Conversion | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const idBase = useId();

  useEffect(() => {
    const q = parseNombre(quantite);
    if (Number.isNaN(q) || q <= 0) {
      setResultat(null);
      setErreur(quantite.trim() ? 'Quantité positive attendue' : null);
      return;
    }
    const t = window.setTimeout(() => {
      produitService
        .convertir(produit.id, q, depuis ? Number(depuis) : undefined, vers ? Number(vers) : undefined)
        .then((r) => {
          setResultat(r);
          setErreur(null);
        })
        .catch((e) => setErreur(e instanceof ApiClientError ? e.message : 'Conversion impossible'));
    }, 300);
    return () => window.clearTimeout(t);
  }, [produit.id, quantite, depuis, vers]);

  const choix = [{ id: '', nom: `${produit.uniteBaseNom} (${produit.uniteBaseSymbole})` }, ...paquetages.map((p) => ({ id: String(p.id), nom: p.nom }))];

  return (
    <div className="rounded border border-ligne bg-white p-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="w-28">
          <label htmlFor={`${idBase}-q`} className="etiquette">Quantité</label>
          <input id={`${idBase}-q`} className="champ" value={quantite} inputMode="decimal" onChange={(e) => setQuantite(e.target.value)} />
        </div>
        <div className="min-w-[10rem] flex-1">
          <label htmlFor={`${idBase}-de`} className="etiquette">De</label>
          <select id={`${idBase}-de`} className="champ" value={depuis} onChange={(e) => setDepuis(e.target.value)}>
            {choix.map((c) => (
              <option key={c.id || 'base'} value={c.id}>{c.nom}</option>
            ))}
          </select>
        </div>
        <ArrowRight size={18} className="mb-2.5 text-encre-douce" aria-hidden />
        <div className="min-w-[10rem] flex-1">
          <label htmlFor={`${idBase}-vers`} className="etiquette">Vers</label>
          <select id={`${idBase}-vers`} className="champ" value={vers} onChange={(e) => setVers(e.target.value)}>
            {choix.map((c) => (
              <option key={c.id || 'base'} value={c.id}>{c.nom}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-4 min-h-[3.5rem]" aria-live="polite">
        {erreur ? (
          <p className="text-sm text-alerte">{erreur}</p>
        ) : resultat ? (
          <>
            <p className="text-lg">
              {formatNombre(resultat.quantiteSource)} {resultat.sourceLibelle} ={' '}
              <strong className="tabular-nums">{formatNombre(resultat.quantiteResultat)}</strong> {resultat.cibleLibelle}
              {!resultat.exact && <span className="ml-2 text-sm text-ambre-fonce">(conditionnement incomplet)</span>}
            </p>
            <p className="mt-1 text-sm text-encre-douce">
              Soit {formatNombre(resultat.quantiteUniteBase)} {resultat.uniteBaseSymbole}, réparti en :{' '}
              {resultat.decomposition.map((l) => `${formatNombre(l.quantite)} × ${l.libelle}`).join(' + ')}
            </p>
          </>
        ) : null}
      </div>
    </div>
  );
}
