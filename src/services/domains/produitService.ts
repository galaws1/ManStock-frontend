import { ApiService } from '../ApiService';
import { api } from '../axiosConfig';
import type { Conversion, Paquetage, PaquetageRequest, Produit, ProduitRequest } from '../../types/produit';

class ProduitService extends ApiService<Produit, ProduitRequest> {
  constructor() {
    super('produits');
  }

  override async getAll(): Promise<Produit[]> {
    throw new Error('Liste paginée : utilisez produitService.getPage()');
  }

  /** US213 : pas de suppression, désactivation. */
  async changerStatut(id: number, actif: boolean): Promise<Produit> {
    const { data } = await api.patch<Produit>(this.url(`${id}/statut`), { actif });
    return data;
  }

  override async delete(): Promise<void> {
    throw new Error('Les produits ne se suppriment pas : désactivez-les.');
  }

  async paquetages(produitId: number): Promise<Paquetage[]> {
    const { data } = await api.get<Paquetage[]>(this.url(`${produitId}/paquetages`));
    return data;
  }

  async creerPaquetage(produitId: number, payload: PaquetageRequest): Promise<Paquetage> {
    const { data } = await api.post<Paquetage>(this.url(`${produitId}/paquetages`), payload);
    return data;
  }

  /** depuis / vers absents = unité de base. */
  async convertir(produitId: number, quantite: number, depuis?: number, vers?: number): Promise<Conversion> {
    const params: Record<string, number> = { quantite };
    if (depuis) params.depuis = depuis;
    if (vers) params.vers = vers;
    const { data } = await api.get<Conversion>(this.url(`${produitId}/conversion`), { params });
    return data;
  }
}

export const produitService = new ProduitService();

/** Article identifié par un scan (produit, ou l'un de ses conditionnements). */
export interface ArticleScanne {
  produitId: number;
  produitNom: string;
  paquetageId?: number;
  conditionnement: string;
  quantiteUniteBase: number;
  prixVente: number;
  actif: boolean;
}

export async function scanner(code: string): Promise<ArticleScanne> {
  const { data } = await api.get<ArticleScanne>(`/produits/code-barre/${encodeURIComponent(code.trim())}`);
  return data;
}

export const paquetageService = {
  async update(id: number, payload: PaquetageRequest): Promise<Paquetage> {
    const { data } = await api.put<Paquetage>(`/paquetages/${id}`, payload);
    return data;
  },
  async delete(id: number): Promise<void> {
    await api.delete(`/paquetages/${id}`);
  },
};
