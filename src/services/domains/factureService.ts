import { ApiService } from '../ApiService';
import { api } from '../axiosConfig';
import type { Facture, FactureRequest, PaiementRequest } from '../../types/facture';

class FactureService extends ApiService<Facture, FactureRequest> {
  constructor() {
    super('factures');
  }
  override async getAll(): Promise<Facture[]> {
    throw new Error('Liste paginée : utilisez getPage()');
  }
  async valider(id: number): Promise<Facture> {
    const { data } = await api.post<Facture>(this.url(`${id}/validation`));
    return data;
  }
  async payer(id: number, paiement: PaiementRequest): Promise<Facture> {
    const { data } = await api.post<Facture>(this.url(`${id}/paiements`), paiement);
    return data;
  }
  async annuler(id: number, motif: string): Promise<Facture> {
    const { data } = await api.post<Facture>(this.url(`${id}/annulation`), { motif });
    return data;
  }
}

export const factureService = new FactureService();
