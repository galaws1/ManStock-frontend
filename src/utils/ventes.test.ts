import { describe, expect, it } from 'vitest';
import { ajouterArticle, type LigneEdition } from '../components/Ventes/LignesVenteEditeur';
import { validerReception } from '../components/Achats/CommandeDetailPage';
import { validerLignesCommande } from '../components/Achats/CommandeEditionPage';
import { validerPartenaire } from '../components/Partenaires/PartenairesPage';
import { quantiteValide } from '../components/Stock/MouvementModal';
import { calculerRendu, totalLignes } from './ventes';

describe('totalLignes (même calcul que le serveur)', () => {
  it('somme, remise et arrondi au centime', () => {
    expect(totalLignes([{ quantite: 3, prixUnitaire: 400 }, { quantite: 1, prixUnitaire: 3300 }], 10)).toEqual({ brut: 4500, remise: 450, total: 4050 });
    expect(totalLignes([{ quantite: 1, prixUnitaire: 999.99 }], 33.33).total).toBe(666.69);
  });
});

describe('calculerRendu', () => {
  it('rendu en espèces', () => expect(calculerRendu(4050, [{ mode: 'ESPECES', montant: 5000 }])).toMatchObject({ rendu: 950, manque: 0, erreur: undefined }));
  it('paiement insuffisant', () => expect(calculerRendu(4050, [{ mode: 'CARTE', montant: 4000 }]).manque).toBe(50));
  it('mixte carte + espèces', () => expect(calculerRendu(4050, [{ mode: 'CARTE', montant: 3000 }, { mode: 'ESPECES', montant: 2000 }]).rendu).toBe(950));
  it('trop-perçu par carte refusé', () => expect(calculerRendu(4050, [{ mode: 'CARTE', montant: 5000 }]).erreur).toMatch(/espèces/));
});

describe('panier', () => {
  const coca = { produitId: 5, produitNom: 'Coca', uniteSymbole: 'u', conditionnement: 'u', prixUnitaire: 400 };
  it('même article et même conditionnement : +1 sur la ligne', () => {
    let l: LigneEdition[] = ajouterArticle([], coca);
    l = ajouterArticle(l, coca);
    expect(l).toHaveLength(1);
    expect(l[0].quantite).toBe(2);
  });
  it('autre conditionnement : nouvelle ligne', () => {
    const l = ajouterArticle(ajouterArticle([], coca), { ...coca, paquetageId: 8, conditionnement: 'Pack de 24', prixUnitaire: 9000 });
    expect(l).toHaveLength(2);
  });
});

describe('contrôles de saisie', () => {
  const ligne = { ligneId: 30, produitNom: 'Yaourt', perissable: true, quantite: '480', numeroLot: '', datePeremption: '' };
  it('réception : péremption obligatoire pour un périssable reçu', () => {
    expect(validerReception([ligne]).erreur).toMatch(/périssable/);
    expect(validerReception([{ ...ligne, quantite: '0' }]).erreur).toMatch(/Aucune quantité/);
    expect(validerReception([{ ...ligne, datePeremption: '2027-01-01', numeroLot: ' L1 ' }]).payload).toEqual({
      lignes: [{ ligneId: 30, quantiteRecue: 480, numeroLot: 'L1', datePeremption: '2027-01-01' }],
    });
  });
  it('commande : quantité et prix valides', () => {
    expect(validerLignesCommande([]).erreur).toBeDefined();
    expect(validerLignesCommande([{ produitId: 7, produitNom: 'Riz', uniteSymbole: 'kg', quantite: '0', prix: '600' }]).erreur).toMatch(/Quantité/);
    expect(validerLignesCommande([{ produitId: 7, produitNom: 'Riz', uniteSymbole: 'kg', quantite: '500,5', prix: '600' }]).lignes)
      .toEqual([{ produitId: 7, quantite: 500.5, prixUnitaire: 600 }]);
  });
  it('mouvement : quantité (zéro admis seulement pour un inventaire)', () => {
    expect(quantiteValide('0')).toBeNull();
    expect(quantiteValide('0', true)).toBe(0);
    expect(quantiteValide('1,2345')).toBeNull();
    expect(quantiteValide('12,5')).toBe(12.5);
  });
  it('partenaire : nom, téléphone et e-mail', () => {
    expect(Object.keys(validerPartenaire({ nom: ' ', telephone: 'abc', email: 'pas-un-mail' })).sort()).toEqual(['email', 'nom', 'telephone']);
    expect(validerPartenaire({ nom: 'Grossiste', telephone: '+221 33 000 00 00', email: 'contact@grossiste.sn' })).toEqual({});
  });
});
