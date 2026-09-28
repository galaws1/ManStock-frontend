import type { Auditable } from './api';

/** Codes des rôles livrés par défaut. La table étant dynamique (US643), d'autres codes peuvent exister. */
export const ROLES = {
  ADMIN: 'ADMIN',
  DIRECTEUR: 'DIRECTEUR',
  GESTIONNAIRE: 'GESTIONNAIRE',
  FACTURIER: 'FACTURIER',
  CAISSIER: 'CAISSIER',
  COMPTABLE: 'COMPTABLE',
  MANUTENTIONNAIRE: 'MANUTENTIONNAIRE',
} as const;

export type RoleCode = string;

export interface Role extends Auditable {
  id: number;
  code: RoleCode;
  libelle: string;
  nbUtilisateurs: number;
}

export interface RoleRequest {
  code: string;
  libelle: string;
}

/**
 * Rôles autorisés à modifier le catalogue (familles, catégories, produits...).
 * Doit rester aligné avec Autorisations.CATALOGUE_ECRITURE côté backend.
 */
export const ROLES_CATALOGUE: string[] = [ROLES.ADMIN, ROLES.DIRECTEUR, ROLES.GESTIONNAIRE];

/**
 * Rôles autorisés à gérer l'organisation (magasins, entrepôts, caisses).
 * Doit rester aligné avec Autorisations.ORGANISATION_ECRITURE côté backend.
 */
export const ROLES_ORGANISATION: string[] = [ROLES.ADMIN, ROLES.DIRECTEUR];

/**
 * Rôles autorisés à organiser le stock au quotidien (emplacements, puis mouvements).
 * Doit rester aligné avec Autorisations.STOCK_ECRITURE côté backend.
 */
export const ROLES_STOCK: string[] = [ROLES.ADMIN, ROLES.DIRECTEUR, ROLES.GESTIONNAIRE];

// --- Ventes, facturation, achats, stock : alignés avec Autorisations.java ---
const { ADMIN, DIRECTEUR, GESTIONNAIRE, FACTURIER, CAISSIER, COMPTABLE, MANUTENTIONNAIRE } = ROLES;
export const ROLES_VENTE: string[] = [ADMIN, DIRECTEUR, CAISSIER];
export const ROLES_FACTURATION: string[] = [ADMIN, DIRECTEUR, FACTURIER];
export const ROLES_ENCAISSEMENT: string[] = [ADMIN, DIRECTEUR, FACTURIER, COMPTABLE];
export const ROLES_ANNULATION: string[] = [ADMIN, DIRECTEUR];
export const ROLES_APPROVISIONNEMENT: string[] = [ADMIN, DIRECTEUR, GESTIONNAIRE];
export const ROLES_VALIDATION_COMMANDE: string[] = [ADMIN, DIRECTEUR];
export const ROLES_RECEPTION: string[] = [ADMIN, DIRECTEUR, GESTIONNAIRE, MANUTENTIONNAIRE];
export const ROLES_CLIENTS: string[] = [ADMIN, DIRECTEUR, FACTURIER, CAISSIER];
/** Consultation (menus) : qui voit quoi. */
export const LECTURE_FACTURES: string[] = [ADMIN, DIRECTEUR, FACTURIER, COMPTABLE, CAISSIER];
export const LECTURE_CLIENTS: string[] = [...ROLES_CLIENTS, COMPTABLE];
export const LECTURE_MOUVEMENTS: string[] = [ADMIN, DIRECTEUR, GESTIONNAIRE, COMPTABLE];
export const LECTURE_ACHATS: string[] = [ADMIN, DIRECTEUR, GESTIONNAIRE, MANUTENTIONNAIRE, COMPTABLE];
export const LECTURE_FOURNISSEURS: string[] = [...ROLES_APPROVISIONNEMENT, COMPTABLE];
