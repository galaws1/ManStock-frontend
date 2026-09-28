import { ApiService } from '../ApiService';
import { api } from '../axiosConfig';
import type { Commande, CommandeRequest, ReceptionRequest } from '../../types/commande';

class CommandeService extends ApiService<Commande, CommandeRequest> {
  constructor() {
    super('commandes');
  }
  override async getAll(): Promise<Commande[]> {
    throw new Error('Liste paginée : utilisez getPage()');
  }
  private async action(id: number, action: string, payload?: unknown): Promise<Commande> {
    const { data } = await api.post<Commande>(this.url(`${id}/${action}`), payload);
    return data;
  }
  soumettre = (id: number) => this.action(id, 'soumission');
  valider = (id: number) => this.action(id, 'validation');
  annuler = (id: number) => this.action(id, 'annulation');
  recevoir = (id: number, payload: ReceptionRequest) => this.action(id, 'reception', payload);
}

export const commandeService = new CommandeService();
