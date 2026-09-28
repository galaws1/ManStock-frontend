import { ApiService } from '../ApiService';
import { api } from '../axiosConfig';
import type { Option } from '../../types/common';
import type { Magasin, MagasinRequest } from '../../types/magasin';

class MagasinService extends ApiService<Magasin, MagasinRequest> {
  constructor() {
    super('magasins');
  }

  /** Liste paginée côté serveur : utiliser getPage(). */
  override async getAll(): Promise<Magasin[]> {
    throw new Error('Liste paginée : utilisez magasinService.getPage() ou magasinService.options()');
  }

  /** Magasins ACTIFS pour les listes déroulantes. */
  async options(): Promise<Option[]> {
    const { data } = await api.get<Option[]>(this.url('options'));
    return data;
  }

  /** Pas de suppression : activation / désactivation. */
  async changerStatut(id: number, actif: boolean): Promise<Magasin> {
    const { data } = await api.patch<Magasin>(this.url(`${id}/statut`), { actif });
    return data;
  }

  override async delete(): Promise<void> {
    throw new Error('Les magasins ne se suppriment pas : désactivez-les.');
  }
}

export const magasinService = new MagasinService();
