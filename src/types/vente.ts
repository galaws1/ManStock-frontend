import type { Facture, ModePaiement, PaiementRequest } from './facture';

export interface SessionCaisse {
  id: number;
  caisseId: number;
  caisseNom: string;
  magasinId: number;
  magasinNom: string;
  caissier: string;
  statut: 'OUVERTE' | 'CLOTUREE';
  soldeOuverture: number;
  dateOuverture: string;
  soldeCloture?: number;
  dateCloture?: string;
  encaissements: { mode: ModePaiement; montant: number; nbTickets: number }[];
  totalEncaisse: number;
  especesAttendues: number;
  ecart?: number;
}

export interface TicketRequest {
  sessionId: number;
  remisePourcent: number;
  lignes: { produitId: number; paquetageId?: number; quantite: number }[];
  paiements: PaiementRequest[];
}

export interface TicketResponse {
  ticket: Facture;
  rendu: number;
}
