import type { Auditable } from './api';

export interface Caisse extends Auditable {
  id: number;
  nom: string;
  magasinId: number;
  magasinNom: string;
  actif: boolean;
}

export interface CaisseRequest {
  nom: string;
  magasinId: number;
}
