import { describe, expect, it } from 'vitest';
import { validerPaquetage } from './PaquetageFormModal';
import { validerProduit, type FormulaireProduit } from './ProduitFormModal';

const base: FormulaireProduit = {
  nom: '  Coca-Cola   33 cl ', codeBarre: ' 5449 000000996 ', categorieId: '10', uniteBaseId: '1',
  prixAchat: '250', prixVente: '400,50', seuilAlerte: '24', perissable: false, delai: '',
};

describe('validerProduit', () => {
  it('construit la requête (nom nettoyé, code-barre sans espace, décimales françaises)', () => {
    expect(validerProduit(base).payload).toEqual({
      nom: 'Coca-Cola 33 cl', codeBarre: '5449000000996', categorieId: 10, uniteBaseId: 1,
      prixAchat: 250, prixVente: 400.5, seuilAlerte: 24, perissable: false, delaiAlertePeremptionJours: undefined,
    });
  });
  it('signale chaque champ fautif', () => {
    const { erreurs, payload } = validerProduit({ ...base, nom: ' ', codeBarre: 'ab', categorieId: '', prixAchat: '-1', prixVente: '10,555', seuilAlerte: 'x' });
    expect(payload).toBeUndefined();
    expect(Object.keys(erreurs).sort()).toEqual(['categorieId', 'codeBarre', 'nom', 'prixAchat', 'prixVente', 'seuilAlerte']);
  });
  it('périssable : délai obligatoire entre 1 et 3650 jours', () => {
    expect(validerProduit({ ...base, perissable: true, delai: '' }).erreurs).toHaveProperty('delai');
    expect(validerProduit({ ...base, perissable: true, delai: '0' }).erreurs).toHaveProperty('delai');
    expect(validerProduit({ ...base, perissable: true, delai: '30' }).payload?.delaiAlertePeremptionJours).toBe(30);
  });
  it('non périssable : le délai saisi est ignoré', () => {
    expect(validerProduit({ ...base, perissable: false, delai: '30' }).payload?.delaiAlertePeremptionJours).toBeUndefined();
  });
});

describe('validerPaquetage', () => {
  it('contenu positif obligatoire, prix facultatif', () => {
    expect(validerPaquetage({ nom: 'Carton de 12', codeBarre: '', quantite: '12', prixVente: '', seuilAlerte: '' }).payload).toEqual({
      nom: 'Carton de 12', codeBarre: undefined, quantiteUniteBase: 12, prixVente: undefined, seuilAlerte: undefined,
    });
    expect(validerPaquetage({ nom: 'Carton', codeBarre: '', quantite: '0', prixVente: '', seuilAlerte: '' }).erreurs).toHaveProperty('quantite');
    expect(validerPaquetage({ nom: 'Sac', codeBarre: '', quantite: '2,5555', prixVente: '', seuilAlerte: '' }).erreurs).toHaveProperty('quantite');
  });
});
