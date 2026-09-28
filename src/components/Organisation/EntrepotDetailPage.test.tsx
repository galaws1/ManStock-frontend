import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { entrepotService } from '../../services/domains/entrepotService';
import { connecter, rendreEcran } from '../../test/rendu';
import { EntrepotDetailPage } from './EntrepotDetailPage';

describe('EntrepotDetailPage', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(entrepotService, 'getById').mockResolvedValue({ id: 5, nom: 'Réserve', magasinId: 1, magasinNom: 'Magasin principal', nbEmplacements: 1 });
    vi.spyOn(entrepotService, 'emplacements').mockResolvedValue({
      content: [{ id: 9, entrepotId: 5, code: 'A-01-01' }], page: 0, size: 20, totalElements: 1, totalPages: 1,
    });
  });

  it('un gestionnaire ajoute un emplacement, code mis en majuscules', async () => {
    connecter('GESTIONNAIRE');
    const creer = vi.spyOn(entrepotService, 'creerEmplacement').mockResolvedValue({ id: 10, entrepotId: 5, code: 'A-03-02' });
    rendreEcran(<EntrepotDetailPage />, { chemin: '/organisation/entrepots/:id', url: '/organisation/entrepots/5' });

    await screen.findByRole('cell', { name: 'A-01-01' });
    expect(screen.getByRole('heading', { name: 'Réserve' })).toBeInTheDocument();
    await userEvent.click(await screen.findByRole('button', { name: /Nouvel emplacement/ }));
    await userEvent.type(screen.getByLabelText(/Code/), ' a-03-02 ');
    await userEvent.click(screen.getByRole('button', { name: 'Créer l’emplacement' }));

    await waitFor(() => expect(creer).toHaveBeenCalledWith(5, { code: 'A-03-02', description: undefined }));
  });

  it('refuse un code avec espace sans appeler le serveur', async () => {
    connecter('ADMIN');
    const creer = vi.spyOn(entrepotService, 'creerEmplacement');
    rendreEcran(<EntrepotDetailPage />, { chemin: '/organisation/entrepots/:id', url: '/organisation/entrepots/5' });
    await userEvent.click(await screen.findByRole('button', { name: /Nouvel emplacement/ }));
    await userEvent.type(screen.getByLabelText(/Code/), 'A 03');
    await userEvent.click(screen.getByRole('button', { name: 'Créer l’emplacement' }));

    expect(await screen.findByText(/sans espace/)).toBeInTheDocument();
    expect(creer).not.toHaveBeenCalled();
  });
});
