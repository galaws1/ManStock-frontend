import {
  ArrowRightLeft, Boxes, ClipboardList, FileText, FolderTree, History, KeyRound, LayoutDashboard, Monitor, Package, Ruler,
  ShoppingCart, Store, Tags, Truck, Users, Users2, Warehouse, type LucideIcon,
} from 'lucide-react';
import {
  LECTURE_ACHATS, LECTURE_CLIENTS, LECTURE_FACTURES, LECTURE_FOURNISSEURS, LECTURE_MOUVEMENTS,
  ROLES, ROLES_CATALOGUE, ROLES_ORGANISATION, ROLES_RECEPTION, ROLES_STOCK, ROLES_VENTE,
} from '../../types/role';

export interface EntreeMenu {
  chemin: string;
  libelle: string;
  icone: LucideIcon;
  /** Rôles autorisés ; vide = tout utilisateur connecté. Doit refléter les @PreAuthorize du backend. */
  roles: string[];
}

export interface SectionMenu {
  titre: string;
  entrees: EntreeMenu[];
}

/**
 * Menu construit dynamiquement selon le rôle (US644).
 * La section Comptabilité sera
 * ajoutées au fil des étapes validées.
 */
export const MENU: SectionMenu[] = [
  {
    titre: 'Pilotage',
    entrees: [{ chemin: '/', libelle: 'Tableau de bord', icone: LayoutDashboard, roles: [] }],
  },
  {
    titre: 'Ventes',
    entrees: [
      { chemin: '/ventes/caisse', libelle: 'Caisse', icone: ShoppingCart, roles: ROLES_VENTE },
      { chemin: '/ventes/factures', libelle: 'Factures et tickets', icone: FileText, roles: LECTURE_FACTURES },
      { chemin: '/ventes/clients', libelle: 'Clients', icone: Users2, roles: LECTURE_CLIENTS },
    ],
  },
  {
    titre: 'Stock',
    entrees: [
      { chemin: '/stock/etat', libelle: 'État du stock', icone: Boxes, roles: [] },
      { chemin: '/stock/mouvements', libelle: 'Mouvements', icone: History, roles: LECTURE_MOUVEMENTS },
      { chemin: '/stock/transferts', libelle: 'Transferts', icone: ArrowRightLeft, roles: ROLES_RECEPTION },
    ],
  },
  {
    titre: 'Achats',
    entrees: [
      { chemin: '/achats/commandes', libelle: 'Commandes', icone: ClipboardList, roles: LECTURE_ACHATS },
      { chemin: '/achats/fournisseurs', libelle: 'Fournisseurs', icone: Truck, roles: LECTURE_FOURNISSEURS },
    ],
  },
  {
    titre: 'Catalogue',
    entrees: [
      { chemin: '/catalogue/familles', libelle: 'Familles', icone: FolderTree, roles: ROLES_CATALOGUE },
      { chemin: '/catalogue/categories', libelle: 'Catégories', icone: Tags, roles: ROLES_CATALOGUE },
      { chemin: '/catalogue/produits', libelle: 'Produits', icone: Package, roles: ROLES_CATALOGUE },
      { chemin: '/catalogue/unites', libelle: 'Unités de mesure', icone: Ruler, roles: ROLES_CATALOGUE },
    ],
  },
  {
    titre: 'Organisation',
    entrees: [
      { chemin: '/organisation/magasins', libelle: 'Magasins', icone: Store, roles: ROLES_ORGANISATION },
      // Le gestionnaire y gère les emplacements ; créer un entrepôt reste réservé à l'admin / directeur.
      { chemin: '/organisation/entrepots', libelle: 'Entrepôts', icone: Warehouse, roles: ROLES_STOCK },
      { chemin: '/organisation/caisses', libelle: 'Caisses', icone: Monitor, roles: ROLES_ORGANISATION },
    ],
  },
  {
    titre: 'Administration',
    entrees: [
      { chemin: '/admin/utilisateurs', libelle: 'Utilisateurs', icone: Users, roles: [ROLES.ADMIN] },
      { chemin: '/admin/roles', libelle: 'Rôles', icone: KeyRound, roles: [ROLES.ADMIN] },
    ],
  },
];

export function menuPourRole(roleCode: string | null): SectionMenu[] {
  if (!roleCode) return [];
  return MENU.map((s) => ({
    ...s,
    entrees: s.entrees.filter((e) => e.roles.length === 0 || e.roles.includes(roleCode)),
  })).filter((s) => s.entrees.length > 0);
}
