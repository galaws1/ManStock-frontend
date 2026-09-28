import { ApiService } from '../ApiService';
import type { Unite, UniteRequest } from '../../types/unite';

/** Petit référentiel non paginé : getAll() renvoie toutes les unités. */
export const uniteService = new ApiService<Unite, UniteRequest>('unites');
