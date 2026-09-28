import { ApiService } from '../ApiService';
import { api } from '../axiosConfig';
import type { Categorie, CategorieOption, CategorieRequest } from '../../types/categorie';

class CategorieService extends ApiService<Categorie, CategorieRequest> {
  constructor() {
    super('categories');
  }

  /** Liste paginée côté serveur : utiliser getPage(). */
  override async getAll(): Promise<Categorie[]> {
    throw new Error('Liste paginée : utilisez categorieService.getPage() ou categorieService.options()');
  }

  /** Catégories (d'une famille si précisée) pour les listes déroulantes, triées par famille puis nom. */
  async options(familleId?: number): Promise<CategorieOption[]> {
    const { data } = await api.get<CategorieOption[]>(this.url('options'), { params: familleId ? { familleId } : undefined });
    return data;
  }
}

export const categorieService = new CategorieService();
