import { ApiService } from '../ApiService';
import { api } from '../axiosConfig';
import type { Option } from '../../types/common';
import type { Famille, FamilleRequest } from '../../types/famille';

class FamilleService extends ApiService<Famille, FamilleRequest> {
  constructor() {
    super('familles');
  }

  /** Liste paginée côté serveur : utiliser getPage(). */
  override async getAll(): Promise<Famille[]> {
    throw new Error('Liste paginée : utilisez familleService.getPage() ou familleService.options()');
  }

  /** Toutes les familles (id + libellé) pour les listes déroulantes. */
  async options(): Promise<Option[]> {
    const { data } = await api.get<Option[]>(this.url('options'));
    return data;
  }
}

export const familleService = new FamilleService();
