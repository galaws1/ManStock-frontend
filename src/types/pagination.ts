export type SensTri = 'asc' | 'desc';

/** Format renvoyé par toutes les listes paginées du backend (PageResponse.java). */
export interface Page<T> {
  content: T[];
  /** Numéro de page, à partir de 0. */
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  tri?: string;
  sens?: SensTri;
}

/** Paramètres standard : ?page=0&size=20&tri=nom&sens=asc */
export interface PageParams {
  page: number;
  size: number;
  tri?: string;
  sens?: SensTri;
}

export const TAILLES_PAGE = [10, 20, 50, 100] as const;
export const TAILLE_PAGE_DEFAUT = 20;
