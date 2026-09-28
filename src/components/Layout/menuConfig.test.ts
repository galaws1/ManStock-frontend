import { describe, expect, it } from 'vitest';
import { menuPourRole } from './menuConfig';

const chemins = (role: string | null) => menuPourRole(role).flatMap((s) => s.entrees.map((e) => e.chemin));
const sections = (role: string) => menuPourRole(role).map((s) => s.titre);

describe('menuPourRole (US644)', () => {
  it('un admin voit tout', () => {
    expect(chemins('ADMIN')).toEqual([
      '/', '/ventes/caisse', '/ventes/factures', '/ventes/clients',
      '/stock/etat', '/stock/mouvements', '/stock/transferts',
      '/achats/commandes', '/achats/fournisseurs',
      '/catalogue/familles', '/catalogue/categories', '/catalogue/produits', '/catalogue/unites',
      '/organisation/magasins', '/organisation/entrepots', '/organisation/caisses',
      '/admin/utilisateurs', '/admin/roles',
    ]);
  });

  it('un caissier : caisse, ses tickets, clients et état du stock ; les sections vides disparaissent', () => {
    expect(chemins('CAISSIER')).toEqual(['/', '/ventes/caisse', '/ventes/factures', '/ventes/clients', '/stock/etat']);
    expect(sections('CAISSIER')).not.toContain('Administration');
    expect(sections('CAISSIER')).not.toContain('Achats');
  });

  it('un facturier n’a pas accès à la caisse', () => {
    expect(chemins('FACTURIER')).toContain('/ventes/factures');
    expect(chemins('FACTURIER')).not.toContain('/ventes/caisse');
  });

  it('le gestionnaire : stock, achats et catalogue, pas les caisses ni l’administration', () => {
    const c = chemins('GESTIONNAIRE');
    expect(c).toEqual(expect.arrayContaining(['/stock/mouvements', '/stock/transferts', '/achats/commandes', '/catalogue/produits', '/organisation/entrepots']));
    expect(c).not.toContain('/organisation/caisses');
    expect(c).not.toContain('/ventes/caisse');
    expect(c).not.toContain('/admin/utilisateurs');
  });

  it('le manutentionnaire réceptionne (transferts, commandes) sans voir le journal', () => {
    expect(chemins('MANUTENTIONNAIRE')).toEqual(['/', '/stock/etat', '/stock/transferts', '/achats/commandes']);
  });

  it('le comptable consulte factures, mouvements, achats', () => {
    expect(chemins('COMPTABLE')).toEqual(expect.arrayContaining(['/ventes/factures', '/stock/mouvements', '/achats/commandes', '/achats/fournisseurs']));
  });

  it('aucun menu sans utilisateur', () => expect(menuPourRole(null)).toEqual([]));
});
