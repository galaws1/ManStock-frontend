import type { Auditable } from './api';

export interface Utilisateur extends Auditable {
  id: number;
  nom: string;
  prenom?: string;
  username: string;
  roleId: number;
  roleCode: string;
  roleLibelle: string;
  magasinId?: number;
  magasinNom?: string;
  actif: boolean;
  doitChangerMotDePasse: boolean;
}

export interface UtilisateurCreateRequest {
  nom: string;
  prenom?: string;
  username: string;
  motDePasse: string;
  roleId: number;
  magasinId?: number | null;
}

export type UtilisateurUpdateRequest = Omit<UtilisateurCreateRequest, 'motDePasse'>;
