import type { Auditable } from './api';

export interface Produit extends Auditable {
  id: number;
  codeBarre?: string;
  nom: string;
  categorieId: number;
  categorieNom: string;
  familleId: number;
  familleNom: string;
  uniteBaseId: number;
  uniteBaseNom: string;
  uniteBaseSymbole: string;
  prixAchat: number;
  prixVente: number;
  /** Exprimé dans l'unité de base. */
  seuilAlerte: number;
  perissable: boolean;
  delaiAlertePeremptionJours?: number;
  actif: boolean;
  nbPaquetages: number;
}

export interface ProduitRequest {
  nom: string;
  codeBarre?: string;
  categorieId: number;
  uniteBaseId: number;
  prixAchat: number;
  prixVente: number;
  seuilAlerte: number;
  perissable: boolean;
  delaiAlertePeremptionJours?: number;
}

/** Conditionnement de vente (carton de 12...). quantiteUniteBase = facteur de conversion. */
export interface Paquetage extends Auditable {
  id: number;
  produitId: number;
  nom: string;
  codeBarre?: string;
  quantiteUniteBase: number;
  /** Absent : prix unitaire du produit × quantité. */
  prixVente?: number;
  seuilAlerte?: number;
}

export interface PaquetageRequest {
  nom: string;
  codeBarre?: string;
  quantiteUniteBase: number;
  prixVente?: number;
  seuilAlerte?: number;
}

export interface Conversion {
  produitId: number;
  quantiteSource: number;
  sourceLibelle: string;
  quantiteResultat: number;
  cibleLibelle: string;
  quantiteUniteBase: number;
  uniteBaseSymbole: string;
  /** true si la quantité tombe juste dans le conditionnement cible. */
  exact: boolean;
  decomposition: { paquetageId?: number; libelle: string; quantite: number }[];
}
