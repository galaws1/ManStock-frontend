import type { Auditable } from './api';

export interface Unite extends Auditable {
  id: number;
  nom: string;
  symbole: string;
  nbProduits: number;
}

export interface UniteRequest {
  nom: string;
  symbole: string;
}
