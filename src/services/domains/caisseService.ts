import { ApiService } from '../ApiService';
import { api } from '../axiosConfig';
import type { Caisse, CaisseRequest } from '../../types/caisse';

class CaisseService extends ApiService<Caisse, CaisseRequest> {
  constructor() {
    super('caisses');
  }

  override async getAll(): Promise<Caisse[]> {
    throw new Error('Liste paginée : utilisez caisseService.getPage()');
  }

  async changerStatut(id: number, actif: boolean): Promise<Caisse> {
    const { data } = await api.patch<Caisse>(this.url(`${id}/statut`), { actif });
    return data;
  }

  override async delete(): Promise<void> {
    throw new Error('Les caisses ne se suppriment pas : désactivez-les.');
  }
}

export const caisseService = new CaisseService();
