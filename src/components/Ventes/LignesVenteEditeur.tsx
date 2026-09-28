import { Minus, Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { produitService } from '../../services/domains/produitService';
import type { Paquetage } from '../../types/produit';
import { formatMontant, formatNombre, parseNombre, versSaisie } from '../../utils/formatters';
import type { ChoixProduit } from '../common/ProduitPicker';

export interface LigneEdition extends ChoixProduit {
  cle: string;
  quantite: number;
  /** Prix du catalogue pour le conditionnement choisi (référence si prix modifié). */
  prixCatalogue: number;
}

let compteur = 0;
export const nouvelleLigne = (c: ChoixProduit): LigneEdition => ({ ...c, cle: `l${++compteur}`, quantite: 1, prixCatalogue: c.prixUnitaire });

/** Ajoute un article ; même produit et même conditionnement → +1 sur la ligne existante. */
export function ajouterArticle(lignes: LigneEdition[], c: ChoixProduit): LigneEdition[] {
  const i = lignes.findIndex((l) => l.produitId === c.produitId && (l.paquetageId ?? null) === (c.paquetageId ?? null));
  if (i < 0) return [...lignes, nouvelleLigne(c)];
  return lignes.map((l, j) => (j === i ? { ...l, quantite: l.quantite + 1 } : l));
}

interface Props {
  lignes: LigneEdition[];
  onChange: (l: LigneEdition[]) => void;
  /** Factures : prix unitaire modifiable. Caisse : prix du catalogue imposé. */
  prixModifiable?: boolean;
  lectureSeule?: boolean;
}

export function LignesVenteEditeur({ lignes, onChange, prixModifiable = false, lectureSeule = false }: Props) {
  const [paquetages, setPaquetages] = useState<Record<number, Paquetage[]>>({});
  const [prixProduit, setPrixProduit] = useState<Record<number, number>>({});

  // Conditionnements de chaque produit présent (chargés une fois).
  useEffect(() => {
    lignes
      .filter((l) => !(l.produitId in paquetages))
      .forEach((l) => {
        setPaquetages((p) => ({ ...p, [l.produitId]: [] }));
        Promise.all([produitService.paquetages(l.produitId), produitService.getById(l.produitId)])
          .then(([pq, prod]) => {
            setPaquetages((p) => ({ ...p, [l.produitId]: pq }));
            setPrixProduit((p) => ({ ...p, [l.produitId]: prod.prixVente }));
          })
          .catch(() => undefined);
      });
  }, [lignes, paquetages]);

  const maj = (cle: string, patch: Partial<LigneEdition>) => onChange(lignes.map((l) => (l.cle === cle ? { ...l, ...patch } : l)));

  const changerConditionnement = (l: LigneEdition, valeur: string) => {
    const pq = (paquetages[l.produitId] ?? []).find((p) => String(p.id) === valeur);
    const base = prixProduit[l.produitId] ?? l.prixCatalogue;
    const prix = pq ? pq.prixVente ?? base * pq.quantiteUniteBase : base;
    maj(l.cle, { paquetageId: pq?.id, conditionnement: pq ? pq.nom : l.uniteSymbole, prixUnitaire: prix, prixCatalogue: prix });
  };

  if (lignes.length === 0) {
    return <p className="rounded border border-dashed border-ligne bg-white px-4 py-8 text-center text-sm text-encre-douce">Aucun article pour l’instant.</p>;
  }

  return (
    <div className="overflow-x-auto rounded border border-ligne bg-white">
      <table className="w-full min-w-[36rem] text-sm">
        <thead className="border-b border-ligne bg-papier text-left text-encre-douce">
          <tr>
            <th className="min-w-[10rem] px-3 py-2 font-semibold">Article</th>
            <th className="px-3 py-2 font-semibold">Format</th>
            <th className="px-3 py-2 text-right font-semibold">Quantité</th>
            <th className="px-3 py-2 text-right font-semibold">Prix</th>
            <th className="px-3 py-2 text-right font-semibold">Montant</th>
            {!lectureSeule && <th className="w-10 px-2 py-2"><span className="sr-only">Retirer</span></th>}
          </tr>
        </thead>
        <tbody>
          {lignes.map((l) => {
            const pqs = paquetages[l.produitId] ?? [];
            return (
              <tr key={l.cle} className="border-b border-ligne last:border-0">
                <td className="px-3 py-2 font-medium">{l.produitNom}</td>
                <td className="px-3 py-2">
                  {lectureSeule || pqs.length === 0 ? (
                    l.conditionnement
                  ) : (
                    <select aria-label={`Conditionnement de ${l.produitNom}`} className="champ py-1" value={l.paquetageId ?? ''} onChange={(e) => changerConditionnement(l, e.target.value)}>
                      <option value="">{l.uniteSymbole === l.conditionnement ? l.uniteSymbole : 'Unité de base'}</option>
                      {pqs.map((p) => (
                        <option key={p.id} value={p.id}>{p.nom} ({formatNombre(p.quantiteUniteBase)})</option>
                      ))}
                    </select>
                  )}
                </td>
                <td className="px-3 py-2">
                  {lectureSeule ? (
                    <span className="block text-right tabular-nums">{formatNombre(l.quantite)}</span>
                  ) : (
                    <div className="flex items-center justify-end gap-1">
                      <button type="button" className="btn-discret px-1.5" aria-label={`Diminuer ${l.produitNom}`} onClick={() => l.quantite > 1 && maj(l.cle, { quantite: l.quantite - 1 })}>
                        <Minus size={14} />
                      </button>
                      <input
                        aria-label={`Quantité de ${l.produitNom}`}
                        className="champ w-20 py-1 text-right tabular-nums"
                        inputMode="decimal"
                        defaultValue={versSaisie(l.quantite)}
                        key={`${l.cle}-${l.quantite}`}
                        onBlur={(e) => {
                          const q = parseNombre(e.target.value);
                          if (!Number.isNaN(q) && q > 0) maj(l.cle, { quantite: q });
                          else e.target.value = versSaisie(l.quantite);
                        }}
                      />
                      <button type="button" className="btn-discret px-1.5" aria-label={`Augmenter ${l.produitNom}`} onClick={() => maj(l.cle, { quantite: l.quantite + 1 })}>
                        <Plus size={14} />
                      </button>
                    </div>
                  )}
                </td>
                <td className="px-3 py-2 text-right tabular-nums">
                  {prixModifiable && !lectureSeule ? (
                    <input
                      aria-label={`Prix de ${l.produitNom}`}
                      className="champ w-28 py-1 text-right"
                      inputMode="decimal"
                      defaultValue={versSaisie(l.prixUnitaire)}
                      key={`${l.cle}-p-${l.prixUnitaire}`}
                      onBlur={(e) => {
                        const p = parseNombre(e.target.value);
                        if (!Number.isNaN(p) && p >= 0) maj(l.cle, { prixUnitaire: p });
                        else e.target.value = versSaisie(l.prixUnitaire);
                      }}
                    />
                  ) : (
                    formatMontant(l.prixUnitaire)
                  )}
                </td>
                <td className="px-3 py-2 text-right font-medium tabular-nums">{formatMontant(l.quantite * l.prixUnitaire)}</td>
                {!lectureSeule && (
                  <td className="px-2 py-2">
                    <button type="button" className="btn-discret px-1.5 hover:!text-alerte" aria-label={`Retirer ${l.produitNom}`} onClick={() => onChange(lignes.filter((x) => x.cle !== l.cle))}>
                      <Trash2 size={15} />
                    </button>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
