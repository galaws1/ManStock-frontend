import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiClientError } from '../../services/axiosConfig';
import { caisseService } from '../../services/domains/caisseService';
import { magasinService } from '../../services/domains/magasinService';
import { connecter, rendreEcran } from '../../test/rendu';
import { CaissesPage } from './CaissesPage';

const CAISSE = { id: 3, nom: 'Caisse 1', magasinId: 1, magasinNom: 'Magasin principal', actif: true };

describe('CaissesPage', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(magasinService, 'options').mockResolvedValue([{ id: 1, libelle: 'Magasin principal' }, { id: 2, libelle: 'Dépôt Nord' }]);
    vi.spyOn(caisseService, 'getPage').mockResolvedValue({ content: [CAISSE], page: 0, size: 20, totalElements: 1, totalPages: 1 });
  });

  it('filtre par magasin', async () => {
    connecter('DIRECTEUR');
    rendreEcran(<CaissesPage />);
    await screen.findByRole('cell', { name: 'Caisse 1' });
    await waitFor(() => expect(screen.getByRole('option', { name: 'Dépôt Nord' })).toBeInTheDocument());

    await userEvent.selectOptions(screen.getByLabelText('Magasin'), '2');

    await waitFor(() => expect(caisseService.getPage).toHaveBeenLastCalledWith(expect.objectContaining({ magasinId: 2, actif: true })));
  });

  it('affiche le refus du serveur (session ouverte)', async () => {
    connecter('DIRECTEUR');
    vi.spyOn(caisseService, 'changerStatut').mockRejectedValue(
      new ApiClientError('Impossible de désactiver « Caisse 1 » : une session de caisse est ouverte. Clôturez-la d’abord.', 409),
    );
    rendreEcran(<CaissesPage />);
    await screen.findByRole('cell', { name: 'Caisse 1' });
    await userEvent.click(screen.getByRole('button', { name: 'Désactiver Caisse 1' }));
    await userEvent.click(screen.getByRole('button', { name: 'Désactiver la caisse' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('session de caisse est ouverte');
  });
});
