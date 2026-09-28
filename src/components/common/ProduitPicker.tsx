import { ScanLine, Search } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { ApiClientError } from '../../services/axiosConfig';
import { produitService, scanner } from '../../services/domains/produitService';
import type { Produit } from '../../types/produit';
import { formatMontant } from '../../utils/formatters';

/** Produit choisi : par recherche (unité de base) ou par scan (produit ou conditionnement). */
export interface ChoixProduit {
  produitId: number;
  produitNom: string;
  uniteSymbole: string;
  paquetageId?: number;
  conditionnement: string;
  prixUnitaire: number;
  prixAchat?: number;
  perissable?: boolean;
}

export const CODE_SCAN = /^[0-9A-Za-z-]{4,50}$/;

interface Props {
  onChoix: (c: ChoixProduit) => void;
  /** Lecteur de code-barre : Entrée sur un code → ajout direct. */
  scan?: boolean;
  placeholder?: string;
  autoFocus?: boolean;
}

export function ProduitPicker({ onChoix, scan = true, placeholder = 'Rechercher un produit', autoFocus }: Props) {
  const [saisie, setSaisie] = useState('');
  const [resultats, setResultats] = useState<Produit[]>([]);
  const [ouvert, setOuvert] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const champ = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const q = saisie.trim();
    if (q.length < 2) {
      setResultats([]);
      return;
    }
    const t = window.setTimeout(() => {
      produitService
        .getPage({ page: 0, size: 8, tri: 'nom', sens: 'asc', recherche: q, actif: true })
        .then((p) => {
          setResultats(p.content);
          setOuvert(true);
        })
        .catch(() => setResultats([]));
    }, 250);
    return () => window.clearTimeout(t);
  }, [saisie]);

  const choisir = (c: ChoixProduit) => {
    onChoix(c);
    setSaisie('');
    setResultats([]);
    setOuvert(false);
    setErreur(null);
    champ.current?.focus();
  };

  const choisirProduit = (p: Produit) =>
    choisir({
      produitId: p.id, produitNom: p.nom, uniteSymbole: p.uniteBaseSymbole, conditionnement: p.uniteBaseSymbole,
      prixUnitaire: p.prixVente, prixAchat: p.prixAchat, perissable: p.perissable,
    });

  const valider = async () => {
    const code = saisie.trim();
    if (scan && CODE_SCAN.test(code)) {
      try {
        const a = await scanner(code);
        if (!a.actif) {
          setErreur(`« ${a.produitNom} » est désactivé`);
          return;
        }
        choisir({
          produitId: a.produitId, produitNom: a.produitNom, uniteSymbole: a.conditionnement,
          paquetageId: a.paquetageId, conditionnement: a.conditionnement, prixUnitaire: a.prixVente,
        });
        return;
      } catch (e) {
        if (!(e instanceof ApiClientError && e.status === 404)) {
          setErreur(e instanceof ApiClientError ? e.message : 'Lecture impossible');
          return;
        }
      }
    }
    if (resultats.length === 1) choisirProduit(resultats[0]);
    else if (resultats.length === 0 && code) setErreur(`Aucun produit pour « ${code} »`);
  };

  return (
    <div className="relative">
      <label className="relative block">
        <span className="sr-only">{placeholder}</span>
        {scan ? (
          <ScanLine size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-encre-douce" aria-hidden />
        ) : (
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-encre-douce" aria-hidden />
        )}
        <input
          ref={champ}
          className="champ pl-9"
          placeholder={scan ? `${placeholder} ou scanner un code-barre` : placeholder}
          value={saisie}
          autoFocus={autoFocus}
          onChange={(e) => {
            setSaisie(e.target.value);
            setErreur(null);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              valider();
            }
            if (e.key === 'Escape') setOuvert(false);
          }}
          onBlur={() => window.setTimeout(() => setOuvert(false), 150)}
          onFocus={() => resultats.length && setOuvert(true)}
          aria-autocomplete="list"
          aria-expanded={ouvert}
        />
      </label>
      {erreur && <p className="mt-1 text-xs text-alerte" role="alert">{erreur}</p>}
      {ouvert && resultats.length > 0 && (
        <ul role="listbox" className="absolute z-20 mt-1 max-h-72 w-full overflow-y-auto rounded border border-ligne bg-white py-1 shadow-lg">
          {resultats.map((p) => (
            <li key={p.id} role="option" aria-selected={false}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => choisirProduit(p)}
                className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-papier"
              >
                <span>
                  <span className="font-medium">{p.nom}</span>
                  <span className="block text-xs text-encre-douce">{p.familleNom} › {p.categorieNom}{p.codeBarre ? ` · ${p.codeBarre}` : ''}</span>
                </span>
                <span className="shrink-0 tabular-nums">{formatMontant(p.prixVente)} / {p.uniteBaseSymbole}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
