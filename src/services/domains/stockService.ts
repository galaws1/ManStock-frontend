import { api } from '../axiosConfig';
import type { Page, PageParams } from '../../types/pagination';
import type { DetailStockLigne, EtatStockLigne, Mouvement, StatutTransfert, Transfert, TypeMouvement } from '../../types/stock';

const sansVides = (p: object) => Object.fromEntries(Object.entries(p).filter(([, v]) => v !== undefined && v !== null && v !== ''));

export const stockService = {
  async etat(params: PageParams & { magasinId: number; recherche?: string; alerte?: boolean }): Promise<Page<EtatStockLigne>> {
    const { data } = await api.get<Page<EtatStockLigne>>('/stocks', { params: sansVides(params) });
    return data;
  },
  async detail(produitId: number, magasinId: number): Promise<DetailStockLigne[]> {
    const { data } = await api.get<DetailStockLigne[]>('/stocks/detail', { params: { produitId, magasinId } });
    return data;
  },
  async journal(params: PageParams & { magasinId?: number; produitId?: number; type?: TypeMouvement; du?: string; au?: string }): Promise<Page<Mouvement>> {
    const { data } = await api.get<Page<Mouvement>>('/mouvements', { params: sansVides(params) });
    return data;
  },
  async entree(payload: { produitId: number; magasinId: number; emplacementId?: number; numeroLot?: string; datePeremption?: string; quantite: number; motif: string }) {
    await api.post('/mouvements/entree', payload);
  },
  async sortie(payload: { produitId: number; magasinId: number; quantite: number; motif: string }) {
    await api.post('/mouvements/sortie', payload);
  },
  async ajustement(payload: { produitId: number; magasinId: number; emplacementId?: number; lotId?: number; quantiteComptee: number; motif: string }) {
    await api.post('/mouvements/ajustement', payload);
  },
  async transferts(params: PageParams & { magasinId?: number; statut?: StatutTransfert }): Promise<Page<Transfert>> {
    const { data } = await api.get<Page<Transfert>>('/transferts', { params: sansVides(params) });
    return data;
  },
  async transferer(payload: { produitId: number; magasinSourceId: number; magasinDestinationId: number; quantite: number }): Promise<Transfert> {
    const { data } = await api.post<Transfert>('/transferts', payload);
    return data;
  },
  async recevoirTransfert(id: number): Promise<Transfert> {
    const { data } = await api.post<Transfert>(`/transferts/${id}/reception`);
    return data;
  },
  async annulerTransfert(id: number): Promise<Transfert> {
    const { data } = await api.post<Transfert>(`/transferts/${id}/annulation`);
    return data;
  },
};
