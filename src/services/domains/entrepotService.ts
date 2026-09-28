import { ApiService } from '../ApiService';
import { api } from '../axiosConfig';
import type { Emplacement, EmplacementRequest, Entrepot, EntrepotRequest } from '../../types/entrepot';
import type { Page, PageParams } from '../../types/pagination';

class EntrepotService extends ApiService<Entrepot, EntrepotRequest> {
  constructor() {
    super('entrepots');
  }

  override async getAll(): Promise<Entrepot[]> {
    throw new Error('Liste paginée : utilisez entrepotService.getPage()');
  }

  async emplacements(entrepotId: number, params: PageParams & { recherche?: string }): Promise<Page<Emplacement>> {
    const { recherche, ...reste } = params;
    const { data } = await api.get<Page<Emplacement>>(this.url(`${entrepotId}/emplacements`), {
      params: recherche ? { ...reste, recherche } : reste,
    });
    return data;
  }

  async creerEmplacement(entrepotId: number, payload: EmplacementRequest): Promise<Emplacement> {
    const { data } = await api.post<Emplacement>(this.url(`${entrepotId}/emplacements`), payload);
    return data;
  }
}

export const entrepotService = new EntrepotService();

/** Modification / suppression d'un emplacement (création via entrepotService.creerEmplacement). */
export const emplacementService = {
  async update(id: number, payload: EmplacementRequest): Promise<Emplacement> {
    const { data } = await api.put<Emplacement>(`/emplacements/${id}`, payload);
    return data;
  },
  async delete(id: number): Promise<void> {
    await api.delete(`/emplacements/${id}`);
  },
};
