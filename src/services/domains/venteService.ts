import { api } from '../axiosConfig';
import type { SessionCaisse, TicketRequest, TicketResponse } from '../../types/vente';

export const venteService = {
  /** null si l'utilisateur n'a pas de session ouverte (réponse 204). */
  async sessionCourante(): Promise<SessionCaisse | null> {
    const r = await api.get<SessionCaisse>('/caisse/session');
    return r.status === 204 || !r.data ? null : r.data;
  },
  async ouvrir(caisseId: number, soldeOuverture: number): Promise<SessionCaisse> {
    const { data } = await api.post<SessionCaisse>('/caisse/session', { caisseId, soldeOuverture });
    return data;
  },
  async cloturer(sessionId: number, soldeCompte: number): Promise<SessionCaisse> {
    const { data } = await api.post<SessionCaisse>(`/caisse/session/${sessionId}/cloture`, { soldeCompte });
    return data;
  },
  async resume(sessionId: number): Promise<SessionCaisse> {
    const { data } = await api.get<SessionCaisse>(`/caisse/session/${sessionId}`);
    return data;
  },
  async vendre(payload: TicketRequest): Promise<TicketResponse> {
    const { data } = await api.post<TicketResponse>('/ventes', payload);
    return data;
  },
};
