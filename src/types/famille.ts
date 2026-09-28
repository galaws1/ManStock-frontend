import type { Auditable } from './api';

export interface Famille extends Auditable {
  id: number;
  nom: string;
  nbCategories: number;
}

export interface FamilleRequest {
  nom: string;
}
