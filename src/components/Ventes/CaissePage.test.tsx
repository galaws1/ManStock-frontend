import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiClientError } from '../../services/axiosConfig';
import { caisseService } from '../../services/domains/caisseService';
import * as produits from '../../services/domains/produitService';
import { venteService } from '../../services/domains/venteService';
import { connecter, rendreEcran } from '../../test/rendu';
import type { SessionCaisse } from '../../types/vente';
import { CaissePage } from './CaissePage';

const SESSION: SessionCaisse = {
  id: 9, caisseId: 3, caisseNom: 'Caisse 1', magasinId: 1, magasinNom: 'Magasin principal', caissier: 'lucie', statut: 'OUVERTE',
  soldeOuverture: 20000, dateOuverture: '2026-09-24T08:00:00', encaissements: [], totalEncaisse: 0, especesAttendues: 20000,
};

describe('CaissePage', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(produits.produitService, 'paquetages').mockResolvedValue([]);
    vi.spyOn(produits.produitService, 'getById').mockResolvedValue({ prixVente: 400 } as never);
  });

  it('sans session : ouverture avec fond de caisse', async () => {
    connecter('CAISSIER');
    vi.spyOn(venteService, 'sessionCourante').mockResolvedValue(null);
    vi.spyOn(caisseService, 'getPage').mockResolvedValue({ content: [{ id: 3, nom: 'Caisse 1', magasinId: 1, magasinNom: 'Magasin principal', actif: true }], page: 0, size: 100, totalElements: 1, totalPages: 1 });
    const ouvrir = vi.spyOn(venteService, 'ouvrir').mockResolvedValue(SESSION);
    rendreEcran(<CaissePage />);

    expect(await screen.findByRole('heading', { name: 'Ouvrir la caisse' })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByLabelText(/Caisse/)).toHaveValue('3')); // seule caisse : présélectionnée
    const fond = screen.getByLabelText(/Fond de caisse/);
    await userEvent.clear(fond);
    await userEvent.type(fond, '20 000');
    await userEvent.click(screen.getByRole('button', { name: 'Ouvrir la session' }));

    await waitFor(() => expect(ouvrir).toHaveBeenCalledWith(3, 20000));
    expect(await screen.findByRole('heading', { name: 'Caisse 1' })).toBeInTheDocument();
  });

  it('scan, encaissement en espèces avec rendu, ticket affiché', async () => {
    connecter('CAISSIER');
    vi.spyOn(venteService, 'sessionCourante').mockResolvedValue(SESSION);
    vi.spyOn(produits, 'scanner').mockResolvedValue({ produitId: 5, produitNom: 'Coca-Cola 33 cl', conditionnement: 'u', quantiteUniteBase: 1, prixVente: 400, actif: true });
    const vendre = vi.spyOn(venteService, 'vendre').mockResolvedValue({
      rendu: 200,
      ticket: {
        id: 1, numero: 'TK-2026-000001', type: 'TICKET', statut: 'VALIDEE', magasinId: 1, magasinNom: 'Magasin principal', caisseNom: 'Caisse 1',
        vendeur: 'lucie', dateFacture: '2026-09-24T10:00:00', remisePourcent: 0, montantTotal: 800, montantPaye: 800, resteAPayer: 0,
        lignes: [{ id: 1, produitId: 5, produitNom: 'Coca-Cola 33 cl', conditionnement: 'u', quantite: 2, prixUnitaire: 400, montant: 800 }],
        paiements: [{ id: 1, mode: 'ESPECES', montant: 800, date: '2026-09-24T10:00:00' }],
      },
    });
    rendreEcran(<CaissePage />);

    const champ = await screen.findByPlaceholderText(/scanner un code-barre/);
    await userEvent.type(champ, '5449000000996{Enter}');
    await userEvent.type(champ, '5449000000996{Enter}');
    expect(await screen.findByLabelText('Quantité de Coca-Cola 33 cl')).toHaveValue('2');

    await userEvent.click(screen.getByRole('button', { name: /Encaisser/ }));
    const recu = screen.getByLabelText('Montant reçu');
    await userEvent.clear(recu);
    await userEvent.type(recu, '1000');
    expect(screen.getByText('À rendre')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Valider la vente' }));

    await waitFor(() => expect(vendre).toHaveBeenCalledWith({
      sessionId: 9, remisePourcent: 0, lignes: [{ produitId: 5, paquetageId: undefined, quantite: 2 }], paiements: [{ mode: 'ESPECES', montant: 1000 }],
    }));
    expect(await screen.findByText(/TK-2026-000001 ·/)).toBeInTheDocument(); // ticket affiché
    expect(screen.getByText('Aucun article pour l’instant.')).toBeInTheDocument(); // panier vidé
  });

  it('stock insuffisant : message du serveur dans la fenêtre d’encaissement, panier conservé', async () => {
    connecter('CAISSIER');
    vi.spyOn(venteService, 'sessionCourante').mockResolvedValue(SESSION);
    vi.spyOn(produits, 'scanner').mockResolvedValue({ produitId: 5, produitNom: 'Coca-Cola 33 cl', conditionnement: 'u', quantiteUniteBase: 1, prixVente: 400, actif: true });
    vi.spyOn(venteService, 'vendre').mockRejectedValue(new ApiClientError('Stock insuffisant pour « Coca-Cola 33 cl » : 1 u demandé(s), 0 u disponible(s)', 409));
    rendreEcran(<CaissePage />);

    await userEvent.type(await screen.findByPlaceholderText(/scanner un code-barre/), '5449000000996{Enter}');
    await userEvent.click(await screen.findByRole('button', { name: /Encaisser/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Valider la vente' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Stock insuffisant');
    expect(screen.getByLabelText('Quantité de Coca-Cola 33 cl')).toBeInTheDocument();
  });

  it('paiement insuffisant : validation impossible', async () => {
    connecter('CAISSIER');
    vi.spyOn(venteService, 'sessionCourante').mockResolvedValue(SESSION);
    vi.spyOn(produits, 'scanner').mockResolvedValue({ produitId: 5, produitNom: 'Coca', conditionnement: 'u', quantiteUniteBase: 1, prixVente: 400, actif: true });
    rendreEcran(<CaissePage />);
    await userEvent.type(await screen.findByPlaceholderText(/scanner un code-barre/), '5449000000996{Enter}');
    await userEvent.click(await screen.findByRole('button', { name: /Encaisser/ }));
    const recu = screen.getByLabelText('Montant reçu');
    await userEvent.clear(recu);
    await userEvent.type(recu, '300');

    expect(screen.getByText('Reste à payer')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Valider la vente' })).toBeDisabled();
  });
});
