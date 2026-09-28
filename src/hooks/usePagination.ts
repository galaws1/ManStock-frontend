import { useCallback, useEffect, useRef, useState } from 'react';
import { TAILLE_PAGE_DEFAUT, type Page, type PageParams, type SensTri } from '../types/pagination';

interface Options {
  triInitial: string;
  sensInitial?: SensTri;
  tailleInitiale?: number;
  /** Délai avant chargement (ms) : évite une requête par frappe dans la recherche. */
  delai?: number;
  onErreur?: (e: unknown) => void;
}

/**
 * État d'une liste paginée côté serveur : page, taille, tri, filtres, chargement.
 * - Un changement de filtre, de taille ou de tri ramène à la première page.
 * - Si la page courante n'existe plus (ex : dernier élément désactivé), on recule à la dernière page.
 * - Les réponses arrivées dans le désordre sont ignorées.
 *
 * Usage : const liste = usePagination((p) => produitService.getPage(p), { recherche }, { triInitial: 'nom' });
 */
export function usePagination<T, F extends Record<string, unknown>>(
  charger: (params: PageParams & F) => Promise<Page<T>>,
  filtres: F,
  { triInitial, sensInitial = 'asc', tailleInitiale = TAILLE_PAGE_DEFAUT, delai = 250, onErreur }: Options,
) {
  const [page, setPage] = useState(0);
  const [taille, setTailleState] = useState(tailleInitiale);
  const [tri, setTri] = useState(triInitial);
  const [sens, setSens] = useState<SensTri>(sensInitial);
  const [resultat, setResultat] = useState<Page<T> | null>(null);
  const [chargement, setChargement] = useState(true);
  const [version, setVersion] = useState(0);

  const chargerRef = useRef(charger);
  const onErreurRef = useRef(onErreur);
  chargerRef.current = charger;
  onErreurRef.current = onErreur;
  const derniereRequete = useRef(0);

  // Retour en première page quand les filtres changent.
  const cleFiltres = JSON.stringify(filtres);
  const cleFiltresPrec = useRef(cleFiltres);
  useEffect(() => {
    if (cleFiltresPrec.current !== cleFiltres) {
      cleFiltresPrec.current = cleFiltres;
      setPage(0);
    }
  }, [cleFiltres]);

  useEffect(() => {
    const numero = ++derniereRequete.current;
    setChargement(true);
    const t = window.setTimeout(async () => {
      try {
        const params = { ...(JSON.parse(cleFiltres) as F), page, size: taille, tri, sens };
        const r = await chargerRef.current(params);
        if (numero !== derniereRequete.current) return;
        if (r.totalPages > 0 && page > r.totalPages - 1) {
          setPage(r.totalPages - 1);
          return;
        }
        setResultat(r);
        setChargement(false);
      } catch (e) {
        if (numero !== derniereRequete.current) return;
        setChargement(false);
        onErreurRef.current?.(e);
      }
    }, delai);
    return () => window.clearTimeout(t);
  }, [cleFiltres, page, taille, tri, sens, version, delai]);

  const trier = useCallback(
    (cle: string) => {
      if (cle === tri) {
        setSens((s) => (s === 'asc' ? 'desc' : 'asc'));
      } else {
        setTri(cle);
        setSens('asc');
      }
      setPage(0);
    },
    [tri],
  );

  const setTaille = useCallback((t: number) => {
    setTailleState(t);
    setPage(0);
  }, []);

  /** Recharge la page courante (après une création, modification, désactivation...). */
  const recharger = useCallback(() => setVersion((v) => v + 1), []);

  return {
    lignes: resultat?.content ?? [],
    resultat,
    chargement,
    page,
    setPage,
    taille,
    setTaille,
    tri,
    sens,
    trier,
    recharger,
  };
}
