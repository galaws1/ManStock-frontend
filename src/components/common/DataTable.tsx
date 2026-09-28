import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import type { ReactNode } from 'react';
import type { SensTri } from '../../types/pagination';

export interface Colonne<T> {
  cle: string;
  titre: string;
  rendu: (ligne: T) => ReactNode;
  className?: string;
  /** Clé de tri envoyée au backend (doit figurer dans sa liste blanche). Absente = colonne non triable. */
  tri?: string;
}

interface Props<T> {
  colonnes: Colonne<T>[];
  lignes: T[];
  cleLigne: (ligne: T) => string | number;
  chargement?: boolean;
  vide?: ReactNode;
  classeLigne?: (ligne: T) => string;
  /** Tri courant et callback : rend les en-têtes des colonnes triables cliquables. */
  triCourant?: { tri: string; sens: SensTri };
  onTrier?: (cle: string) => void;
  /** Contenu affiché sous le tableau, dans le même cadre (ex : <Pagination />). */
  pied?: ReactNode;
}

export function DataTable<T>({ colonnes, lignes, cleLigne, chargement, vide, classeLigne, triCourant, onTrier, pied }: Props<T>) {
  const premierChargement = chargement && lignes.length === 0;
  return (
    <div className="rounded border border-ligne bg-white">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[40rem] text-left text-sm" aria-busy={chargement}>
          <thead className="border-b border-ligne bg-papier text-encre-douce">
            <tr>
              {colonnes.map((c) => {
                const actif = c.tri && triCourant?.tri === c.tri;
                const ariaSort = actif ? (triCourant!.sens === 'asc' ? 'ascending' : 'descending') : undefined;
                return (
                  <th key={c.cle} scope="col" aria-sort={ariaSort} className={`px-4 py-2.5 font-semibold ${c.className ?? ''}`}>
                    {c.tri && onTrier ? (
                      <button
                        onClick={() => onTrier(c.tri!)}
                        className={`-mx-1 inline-flex items-center gap-1 rounded-sm px-1 hover:text-encre ${actif ? 'text-encre' : ''}`}
                      >
                        {c.titre}
                        {actif ? (
                          triCourant!.sens === 'asc' ? <ArrowUp size={14} aria-hidden /> : <ArrowDown size={14} aria-hidden />
                        ) : (
                          <ArrowUpDown size={14} className="opacity-40" aria-hidden />
                        )}
                      </button>
                    ) : (
                      c.titre
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className={chargement && !premierChargement ? 'opacity-60 transition-opacity' : ''}>
            {premierChargement ? (
              <tr>
                <td colSpan={colonnes.length} className="px-4 py-10 text-center text-encre-douce">
                  Chargement…
                </td>
              </tr>
            ) : lignes.length === 0 ? (
              <tr>
                <td colSpan={colonnes.length} className="px-4 py-10 text-center text-encre-douce">
                  {vide ?? 'Aucun élément.'}
                </td>
              </tr>
            ) : (
              lignes.map((l) => (
                <tr key={cleLigne(l)} className={`border-b border-ligne last:border-0 hover:bg-papier/70 ${classeLigne?.(l) ?? ''}`}>
                  {colonnes.map((c) => (
                    <td key={c.cle} className={`px-4 py-2.5 align-middle ${c.className ?? ''}`}>
                      {c.rendu(l)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {pied}
    </div>
  );
}
