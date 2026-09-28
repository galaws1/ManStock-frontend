import type { Auditable } from './api';

export interface Entrepot extends Auditable {
  id: number;
  nom: string;
  magasinId: number;
  magasinNom: string;
  nbEmplacements: number;
}

export interface EntrepotRequest {
  nom: string;
  magasinId: number;
}

export interface Emplacement extends Auditable {
  id: number;
  entrepotId: number;
  code: string;
  description?: string;
}

export interface EmplacementRequest {
  code: string;
  description?: string;
}
