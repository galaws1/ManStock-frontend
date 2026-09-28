export type StatutCommande = 'BROUILLON' | 'EN_ATTENTE_VALIDATION' | 'VALIDEE' | 'RECUE' | 'ANNULEE';

export const LIBELLES_STATUT_COMMANDE: Record<StatutCommande, string> = {
  BROUILLON: 'Brouillon',
  EN_ATTENTE_VALIDATION: 'À valider',
  VALIDEE: 'Validée',
  RECUE: 'Reçue',
  ANNULEE: 'Annulée',
};

export interface LigneCommande {
  id: number;
  produitId: number;
  produitNom: string;
  uniteSymbole: string;
  perissable: boolean;
  quantite: number;
  prixUnitaire: number;
  montant: number;
  quantiteRecue?: number;
}

export interface Commande {
  id: number;
  reference: string;
  fournisseurId: number;
  fournisseurNom: string;
  magasinId: number;
  magasinNom: string;
  statut: StatutCommande;
  montantTotal: number;
  /** Au-dessus du seuil : validation d'un directeur requise (US131). */
  validationRequise: boolean;
  validePar?: string;
  dateCommande: string;
  dateReception?: string;
  createdBy?: string;
  lignes?: LigneCommande[];
}

export interface CommandeRequest {
  fournisseurId: number;
  magasinId: number;
  lignes: { produitId: number; quantite: number; prixUnitaire: number }[];
}

export interface ReceptionRequest {
  emplacementId?: number;
  lignes: { ligneId: number; quantiteRecue: number; numeroLot?: string; datePeremption?: string }[];
}
