import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { categorieService } from '../../services/domains/categorieService';
import { familleService } from '../../services/domains/familleService';
import { produitService } from '../../services/domains/produitService';
import { uniteService } from '../../services/domains/uniteService';
import { connecter, rendreEcran } from '../../test/rendu';
import type { Produit } from '../../types/produit';
import { ProduitsPage } from './ProduitsPage';

const COCA: Produit = {
  id: 5, nom: 'Coca-Cola 33 cl', codeBarre: '5449000000996', categorieId: 10, categorieNom: 'Sodas', familleId: 1, familleNom: 'Boissons',
  uniteBaseId: 1, uniteBaseNom: 'Unité', uniteBaseSymbole: 'u', prixAchat: 250, prixVente: 400, seuilAlerte: 24,
  perissable: false, actif: true, nbPaquetages: 1,
};

describe('ProduitsPage', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(familleService, 'options').mockResolvedValue([{ id: 1, libelle: 'Boissons' }, { id: 2, libelle: 'Épicerie' }]);
    vi.spyOn(categorieService, 'options').mockResolvedValue([
      { id: 10, nom: 'Sodas', familleId: 1, familleNom: 'Boissons' },
      { id: 20, nom: 'Riz', familleId: 2, familleNom: 'Épicerie' },
    ]);
  });

  it('choisir une famille filtre les catégories proposées et la requête', async () => {
    connecter('GESTIONNAIRE');
    const getPage = vi.spyOn(produitService, 'getPage').mockResolvedValue({ content: [COCA], page: 0, size: 20, totalElements: 1, totalPages: 1 });
    rendreEcran(<ProduitsPage />);
    await screen.findByRole('link', { name: 'Coca-Cola 33 cl' });
    await waitFor(() => expect(screen.getByRole('option', { name: 'Épicerie' })).toBeInTheDocument());

    await userEvent.selectOptions(screen.getByLabelText('Famille'), '2');

    expect(screen.queryByRole('option', { name: /Sodas/ })).not.toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Riz' })).toBeInTheDocument();
    await waitFor(() => expect(getPage).toHaveBeenLastCalledWith(expect.objectContaining({ familleId: 2, actif: true })));
    expect(getPage.mock.lastCall![0]).not.toHaveProperty('categorieId'); // catégorie remise à zéro, non envoyée
  });

  it('après création, ouvre la fiche du produit', async () => {
    connecter('ADMIN');
    vi.spyOn(produitService, 'getPage').mockResolvedValue({ content: [], page: 0, size: 20, totalElements: 0, totalPages: 0 });
    vi.spyOn(uniteService, 'getAll').mockResolvedValue([{ id: 1, nom: 'Unité', symbole: 'u', nbProduits: 0 }]);
    const create = vi.spyOn(produitService, 'create').mockResolvedValue(COCA);
    rendreEcran(<ProduitsPage />);

    await userEvent.click(await screen.findByRole('button', { name: /Nouveau produit/ }));
    const dialogue = screen.getByRole('dialog');
    await userEvent.type(screen.getByLabelText(/Nom du produit/), 'Coca-Cola 33 cl');
    await waitFor(() => expect(screen.getByRole('option', { name: 'Sodas' })).toBeInTheDocument());
    await userEvent.selectOptions(screen.getByLabelText(/Catégorie/, { selector: 'select[id]' }), '10');
    await waitFor(() => expect(screen.getByLabelText(/Unité de base/)).toHaveValue('1')); // "u" par défaut
    await userEvent.type(screen.getByLabelText(/Prix d’achat/), '250');
    await userEvent.type(screen.getByLabelText(/Prix de vente/), '200');
    expect(dialogue).toHaveTextContent('vente à perte');
    await userEvent.click(screen.getByRole('button', { name: 'Créer le produit' }));

    await waitFor(() => expect(create).toHaveBeenCalledWith(expect.objectContaining({ nom: 'Coca-Cola 33 cl', categorieId: 10, uniteBaseId: 1, prixVente: 200 })));
    expect(await screen.findByText('Autre page')).toBeInTheDocument(); // navigation vers /catalogue/produits/5
  });
});
