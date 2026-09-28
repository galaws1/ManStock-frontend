export type TypeFacture = 'TICKET' | 'FACTURE';
export type StatutFacture = 'BROUILLON' | 'VALIDEE' | 'ANNULEE';
export type StatutPaiement = 'PAYEE' | 'PARTIELLE' | 'IMPAYEE';
export type ModePaiement = 'ESPECES' | 'CARTE' | 'MOBILE';

export const LIBELLES_MODE: Record<ModePaiement, string> = { ESPECES: 'Espèces', CARTE: 'Carte', MOBILE: 'Mobile money' };

export interface LigneFacture {
  id: number;
  produitId: number;
  produitNom: string;
  paquetageId?: number;
  conditionnement: string;
  quantite: number;
  prixUnitaire: number;
  montant: number;
}

export interface PaiementFacture {
  id: number;
  mode: ModePaiement;
  montant: number;
  date: string;
}

export interface Facture {
  id: number;
  numero?: string;
  type: TypeFacture;
  statut: StatutFacture;
  clientId?: number;
  clientNom?: string;
  magasinId: number;
  magasinNom: string;
  caisseNom?: string;
  vendeur: string;
  dateFacture: string;
  remisePourcent: number;
  montantTotal: number;
  montantPaye: number;
  resteAPayer: number;
  statutPaiement?: StatutPaiement;
  lignes?: LigneFacture[];
  paiements?: PaiementFacture[];
}

export interface LigneFactureRequest {
  produitId: number;
  paquetageId?: number;
  quantite: number;
  prixUnitaire?: number;
}

export interface FactureRequest {
  clientId?: number;
  magasinId?: number;
  remisePourcent: number;
  lignes: LigneFactureRequest[];
}

export interface PaiementRequest {
  mode: ModePaiement;
  montant: number;
}
