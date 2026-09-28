export type TypeMouvement = 'ENTREE' | 'SORTIE' | 'TRANSFERT' | 'AJUSTEMENT_INVENTAIRE' | 'CONVERSION';
export type StatutTransfert = 'EN_COURS' | 'RECU' | 'ANNULE';

export interface EtatStockLigne {
  produitId: number;
  produitNom: string;
  codeBarre?: string;
  categorieNom: string;
  uniteSymbole: string;
  seuilAlerte: number;
  quantite: number;
  prochainePeremption?: string;
  critique: boolean;
}

export interface DetailStockLigne {
  stockId: number;
  lotId?: number;
  numeroLot?: string;
  datePeremption?: string;
  emplacementId?: number;
  emplacementCode?: string;
  quantite: number;
}

export interface Mouvement {
  id: number;
  date: string;
  type: TypeMouvement;
  sens: '+' | '-';
  produitId: number;
  produitNom: string;
  uniteSymbole: string;
  magasinId: number;
  magasinNom: string;
  quantite: number;
  numeroLot?: string;
  motif?: string;
  reference?: string;
  utilisateur: string;
}

export interface Transfert {
  id: number;
  reference: string;
  produitId: number;
  produitNom: string;
  uniteSymbole: string;
  magasinSourceId: number;
  magasinSourceNom: string;
  magasinDestinationId: number;
  magasinDestinationNom: string;
  quantite: number;
  statut: StatutTransfert;
  utilisateur: string;
  dateTransfert: string;
  dateReception?: string;
}

export const LIBELLES_MOUVEMENT: Record<TypeMouvement, string> = {
  ENTREE: 'Entrée',
  SORTIE: 'Sortie',
  TRANSFERT: 'Transfert',
  AJUSTEMENT_INVENTAIRE: 'Ajustement',
  CONVERSION: 'Conversion',
};
