import type { Auditable } from './api';

export interface Magasin extends Auditable {
  id: number;
  nom: string;
  adresse?: string;
  telephone?: string;
  actif: boolean;
  /** Utilisateurs ACTIFS rattachés : la désactivation est refusée tant qu'il y en a. */
  nbUtilisateurs: number;
}

export interface MagasinRequest {
  nom: string;
  adresse?: string;
  telephone?: string;
}
