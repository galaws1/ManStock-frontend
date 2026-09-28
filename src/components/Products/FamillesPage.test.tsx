import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider } from '../../context/AuthContext';
import { StockProvider } from '../../context/StockContext';
import { ApiClientError } from '../../services/axiosConfig';
import { authService } from '../../services/domains/authService';
import { familleService } from '../../services/domains/familleService';
import type { Famille } from '../../types/famille';
import { tokenStorage } from '../../utils/security';
import { ToastViewport } from '../common/Toast';
import { FamillesPage } from './FamillesPage';

const FAMILLES: Famille[] = [
  { id: 1, nom: 'Boissons', nbCategories: 3 },
  { id: 2, nom: 'Quincaillerie', nbCategories: 0 },
];

function connecter(roleCode: string) {
  tokenStorage.set('jwt', new Date(Date.now() + 3_600_000).toISOString());
  vi.spyOn(authService, 'me').mockResolvedValue({
    id: 1, username: 'u', nom: 'N', roleCode, roleLibelle: roleCode, doitChangerMotDePasse: false,
  });
}

function rendre() {
  render(
    <StockProvider>
      <AuthProvider>
        <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <FamillesPage />
        </MemoryRouter>
        <ToastViewport />
      </AuthProvider>
    </StockProvider>,
  );
}

describe('FamillesPage', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(familleService, 'getPage').mockResolvedValue({ content: FAMILLES, page: 0, size: 20, totalElements: 2, totalPages: 1 });
  });

  it('liste les familles ; suppression impossible si la famille contient des catégories', async () => {
    connecter('GESTIONNAIRE');
    rendre();
    const ligne = (await screen.findByText('Boissons')).closest('tr')!;
    expect(within(ligne).getByRole('button', { name: 'Supprimer Boissons' })).toBeDisabled();

    const ligneVide = screen.getByText('Quincaillerie').closest('tr')!;
    expect(within(ligneVide).getByRole('button', { name: 'Supprimer Quincaillerie' })).toBeEnabled();
    expect(within(ligneVide).getByText('Aucune')).toBeInTheDocument();
  });

  it('crée une famille puis recharge la liste', async () => {
    connecter('ADMIN');
    const apres = { content: [...FAMILLES, { id: 3, nom: 'Épicerie fine', nbCategories: 0 }], page: 0, size: 20, totalElements: 3, totalPages: 1 };
    const getPage = vi.spyOn(familleService, 'getPage')
      .mockResolvedValueOnce({ content: FAMILLES, page: 0, size: 20, totalElements: 2, totalPages: 1 })
      .mockResolvedValue(apres);
    const create = vi.spyOn(familleService, 'create').mockResolvedValue({ id: 3, nom: 'Épicerie fine', nbCategories: 0 });
    rendre();
    await screen.findByRole('cell', { name: 'Boissons' }); // liste initiale affichée
    await userEvent.click(await screen.findByRole('button', { name: /Nouvelle famille/ }));
    await userEvent.type(screen.getByLabelText(/Nom de la famille/), '  Épicerie   fine ');
    await userEvent.click(screen.getByRole('button', { name: 'Créer la famille' }));

    await waitFor(() => expect(create).toHaveBeenCalledWith({ nom: 'Épicerie fine' }));
    expect(await screen.findByText('Famille « Épicerie fine » créée')).toBeInTheDocument();
    // La liste est rechargée : la nouvelle famille apparaît dans le tableau.
    expect(await screen.findByRole('cell', { name: 'Épicerie fine' })).toBeInTheDocument();
    expect(getPage).toHaveBeenCalledTimes(2);
  });

  it('affiche l’erreur du serveur (doublon) dans le formulaire', async () => {
    connecter('ADMIN');
    vi.spyOn(familleService, 'create').mockRejectedValue(new ApiClientError('La famille « Boissons » existe déjà', 409));
    rendre();
    await userEvent.click(await screen.findByRole('button', { name: /Nouvelle famille/ }));
    await userEvent.type(screen.getByLabelText(/Nom de la famille/), 'boissons');
    await userEvent.click(screen.getByRole('button', { name: 'Créer la famille' }));

    expect(await screen.findByText('La famille « Boissons » existe déjà')).toBeInTheDocument();
  });

  it('en lecture seule, aucun bouton de modification', async () => {
    connecter('CAISSIER');
    rendre();
    await screen.findByText('Boissons');
    await waitFor(() => expect(authService.me).toHaveBeenCalled());
    expect(screen.queryByRole('button', { name: /Nouvelle famille/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Renommer/ })).not.toBeInTheDocument();
  });
});
