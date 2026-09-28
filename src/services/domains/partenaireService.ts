import { ApiService } from '../ApiService';
import { api } from '../axiosConfig';
import type { Option } from '../../types/common';
import type { Client, ClientRequest, Fournisseur, FournisseurRequest } from '../../types/partenaire';

class PartenaireService<T, R> extends ApiService<T, R> {
  override async getAll(): Promise<T[]> {
    throw new Error('Liste paginée : utilisez getPage() ou options()');
  }
  async options(): Promise<Option[]> {
    const { data } = await api.get<Option[]>(this.url('options'));
    return data;
  }
}

export const fournisseurService = new PartenaireService<Fournisseur, FournisseurRequest>('fournisseurs');
export const clientService = new PartenaireService<Client, ClientRequest>('clients');
