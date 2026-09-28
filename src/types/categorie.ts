import type { Auditable } from './api';

export interface Categorie extends Auditable {
  id: number;
  nom: string;
  familleId: number;
  familleNom: string;
  nbProduits: number;
}

export interface CategorieRequest {
  nom: string;
  familleId: number;
}

/** Liste déroulante des catégories (groupable par famille avec <optgroup>). */
export interface CategorieOption {
  id: number;
  nom: string;
  familleId: number;
  familleNom: string;
}
