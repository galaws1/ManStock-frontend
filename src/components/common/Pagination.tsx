import { ChevronLeft, ChevronRight } from 'lucide-react';
import { TAILLES_PAGE, type Page } from '../../types/pagination';

/**
 * Numéros de page à afficher (base 0), avec '…' pour les trous.
 * Toujours : première, dernière, courante et ses voisines.
 */
export function pagesVisibles(courante: number, total: number, voisins = 1): (number | '…')[] {
  if (total <= 0) return [];
  const garder = new Set<number>([0, total - 1]);
  for (let i = courante - voisins; i <= courante + voisins; i++) if (i >= 0 && i < total) garder.add(i);
  const tri = [...garder].sort((a, b) => a - b);
  const res: (number | '…')[] = [];
  tri.forEach((p, i) => {
    if (i > 0) {
      const ecart = p - tri[i - 1];
      if (ecart === 2) res.push(p - 1); // un seul numéro manquant : on l'affiche plutôt que '…'
      else if (ecart > 2) res.push('…');
    }
    res.push(p);
  });
  return res;
}

interface Props {
  resultat: Page<unknown> | null;
  page: number;
  onPage: (p: number) => void;
  taille: number;
  onTaille: (t: number) => void;
}

export function Pagination({ resultat, page, onPage, taille, onTaille }: Props) {
  if (!resultat || resultat.totalElements === 0) return null;
  const { totalElements, totalPages } = resultat;
  const debut = page * taille + 1;
  const fin = Math.min((page + 1) * taille, totalElements);
  const fmt = (n: number) => n.toLocaleString('fr-FR');

  return (
    <nav aria-label="Pagination" className="flex flex-wrap items-center justify-between gap-3 border-t border-ligne px-4 py-2.5 text-sm">
      <p className="text-encre-douce" aria-live="polite">
        {fmt(debut)}–{fmt(fin)} sur {fmt(totalElements)}
      </p>

      <div className="flex items-center gap-1">
        <button className="btn-discret" onClick={() => onPage(page - 1)} disabled={page === 0} aria-label="Page précédente">
          <ChevronLeft size={16} />
        </button>
        {pagesVisibles(page, totalPages).map((p, i) =>
          p === '…' ? (
            <span key={`e${i}`} className="px-1.5 text-encre-douce" aria-hidden>
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPage(p)}
              aria-current={p === page ? 'page' : undefined}
              aria-label={`Page ${p + 1}`}
              className={`min-w-[2rem] rounded-sm px-2 py-1 tabular-nums ${
                p === page ? 'bg-acier font-semibold text-white' : 'text-encre-douce hover:bg-acier-pale hover:text-encre'
              }`}
            >
              {p + 1}
            </button>
          ),
        )}
        <button className="btn-discret" onClick={() => onPage(page + 1)} disabled={page >= totalPages - 1} aria-label="Page suivante">
          <ChevronRight size={16} />
        </button>
      </div>

      <label className="flex items-center gap-2 text-encre-douce">
        Lignes par page
        <select className="champ w-auto py-1" value={taille} onChange={(e) => onTaille(Number(e.target.value))}>
          {TAILLES_PAGE.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </label>
    </nav>
  );
}
