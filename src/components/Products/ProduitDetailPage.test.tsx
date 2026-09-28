import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { produitService } from '../../services/domains/produitService';
import { connecter, rendreEcran } from '../../test/rendu';
import type { Conversion, Produit } from '../../types/produit';
import { ProduitDetailPage } from './ProduitDetailPage';

const EAU: Produit = {
  id: 5, nom: 'Eau 1,5 L', codeBarre: '6111000000001', categorieId: 10, categorieNom: 'Eaux', familleId: 1, familleNom: 'Boissons',
  uniteBaseId: 1, uniteBaseNom: 'Unité', uniteBaseSymbole: 'u', prixAchat: 200, prixVente: 300, seuilAlerte: 48,
  perissable: false, actif: true, nbPaquetages: 2,
};
const PAQUETAGES = [
  { id: 11, produitId: 5, nom: 'Pack de 6', quantiteUniteBase: 6 },
  { id: 12, produitId: 5, nom: 'Carton de 12', quantiteUniteBase: 12, prixVente: 3000 },
];

describe('ProduitDetailPage', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(produitService, 'getById').mockResolvedValue(EAU);
    vi.spyOn(produitService, 'paquetages').mockResolvedValue(PAQUETAGES);
  });

  it('affiche les conditionnements avec prix calculé ou propre et remise unitaire', async () => {
    connecter('GESTIONNAIRE');
    vi.spyOn(produitService, 'convertir').mockResolvedValue({} as Conversion);
    rendreEcran(<ProduitDetailPage />, { chemin: '/catalogue/produits/:id', url: '/catalogue/produits/5' });

    const pack = (await screen.findByRole('cell', { name: 'Pack de 6' })).closest('tr')!;
    expect(within(pack).getByText('calculé')).toBeInTheDocument(); // 6 × 300
    const carton = screen.getByRole('cell', { name: 'Carton de 12' }).closest('tr')!;
    expect(within(carton).getByText('−17 %')).toBeInTheDocument(); // 3000 / 12 = 250 au lieu de 300
  });

  it('calculateur : convertit via le backend et affiche la décomposition', async () => {
    connecter('CAISSIER');
    const convertir = vi.spyOn(produitService, 'convertir').mockResolvedValue({
      produitId: 5, quantiteSource: 30, sourceLibelle: 'Unité', quantiteResultat: 2.5, cibleLibelle: 'Carton de 12',
      quantiteUniteBase: 30, uniteBaseSymbole: 'u', exact: false,
      decomposition: [{ paquetageId: 12, libelle: 'Carton de 12', quantite: 2 }, { paquetageId: 11, libelle: 'Pack de 6', quantite: 1 }],
    });
    rendreEcran(<ProduitDetailPage />, { chemin: '/catalogue/produits/:id', url: '/catalogue/produits/5' });
    await screen.findByRole('heading', { name: 'Conversions' });

    const quantite = screen.getByLabelText('Quantité');
    await userEvent.clear(quantite);
    await userEvent.type(quantite, '30');
    await userEvent.selectOptions(screen.getByLabelText('De'), '');
    await userEvent.selectOptions(screen.getByLabelText('Vers'), '12');

    await waitFor(() => expect(convertir).toHaveBeenLastCalledWith(5, 30, undefined, 12));
    expect(await screen.findByText('(conditionnement incomplet)')).toBeInTheDocument();
    expect(screen.getByText(/2 × Carton de 12 \+ 1 × Pack de 6/)).toBeInTheDocument();
  });

  it('lecture seule pour un caissier', async () => {
    connecter('CAISSIER');
    vi.spyOn(produitService, 'convertir').mockResolvedValue({} as Conversion);
    rendreEcran(<ProduitDetailPage />, { chemin: '/catalogue/produits/:id', url: '/catalogue/produits/5' });
    await screen.findByRole('cell', { name: 'Pack de 6' });
    await waitFor(() => expect(screen.queryByRole('button', { name: /Ajouter un conditionnement/ })).not.toBeInTheDocument());
    expect(screen.queryByRole('button', { name: /Modifier/ })).not.toBeInTheDocument();
  });
});
