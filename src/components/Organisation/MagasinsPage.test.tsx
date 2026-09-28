import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider } from '../../context/AuthContext';
import { StockProvider } from '../../context/StockContext';
import { ApiClientError } from '../../services/axiosConfig';
import { authService } from '../../services/domains/authService';
import { magasinService } from '../../services/domains/magasinService';
import type { Magasin } from '../../types/magasin';
import { tokenStorage } from '../../utils/security';
import { ToastViewport } from '../common/Toast';
import { validerMagasin } from './MagasinFormModal';
import { MagasinsPage } from './MagasinsPage';

const MAGASINS: Magasin[] = [
  { id: 1, nom: 'Magasin principal', adresse: 'Rue 12', telephone: '33 000 00 00', actif: true, nbUtilisateurs: 4 },
  { id: 2, nom: 'Dépôt Nord', actif: true, nbUtilisateurs: 0 },
];
const page = (content: Magasin[]) => ({ content, page: 0, size: 20, totalElements: content.length, totalPages: 1 });

function connecter(roleCode = 'DIRECTEUR') {
  tokenStorage.set('jwt', new Date(Date.now() + 3_600_000).toISOString());
  vi.spyOn(authService, 'me').mockResolvedValue({ id: 1, username: 'u', nom: 'N', roleCode, roleLibelle: roleCode, doitChangerMotDePasse: false });
}

function rendre() {
  render(
    <StockProvider>
      <AuthProvider>
        <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <MagasinsPage />
        </MemoryRouter>
        <ToastViewport />
      </AuthProvider>
    </StockProvider>,
  );
}

describe('MagasinsPage', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('affiche les actifs par défaut, avec coordonnées et nombre d’utilisateurs', async () => {
    connecter();
    const getPage = vi.spyOn(magasinService, 'getPage').mockResolvedValue(page(MAGASINS));
    rendre();

    const ligne = (await screen.findByRole('cell', { name: 'Magasin principal' })).closest('tr')!;
    expect(within(ligne).getByText('Rue 12')).toBeInTheDocument();
    expect(within(ligne).getByText('4')).toBeInTheDocument();
    expect(getPage).toHaveBeenLastCalledWith(expect.objectContaining({ actif: true, tri: 'nom' }));
  });

  it('désactivation bloquée côté écran quand des utilisateurs actifs sont rattachés', async () => {
    connecter();
    vi.spyOn(magasinService, 'getPage').mockResolvedValue(page(MAGASINS));
    const changer = vi.spyOn(magasinService, 'changerStatut');
    rendre();
    await screen.findByRole('cell', { name: 'Magasin principal' });

    await userEvent.click(screen.getByRole('button', { name: 'Désactiver Magasin principal' }));
    expect(screen.getByRole('heading', { name: 'Désactivation impossible pour l’instant' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Annuler' })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Compris' }));
    expect(changer).not.toHaveBeenCalled();
  });

  it('désactive un magasin libre puis recharge', async () => {
    connecter();
    const getPage = vi.spyOn(magasinService, 'getPage').mockResolvedValue(page(MAGASINS));
    vi.spyOn(magasinService, 'changerStatut').mockResolvedValue({ ...MAGASINS[1], actif: false });
    rendre();
    await screen.findByRole('cell', { name: 'Dépôt Nord' });

    await userEvent.click(screen.getByRole('button', { name: 'Désactiver Dépôt Nord' }));
    await userEvent.click(screen.getByRole('button', { name: 'Désactiver le magasin' }));

    expect(await screen.findByText('Magasin « Dépôt Nord » désactivé')).toBeInTheDocument();
    await waitFor(() => expect(getPage).toHaveBeenCalledTimes(2));
  });

  it('affiche le refus du serveur (dernier magasin actif)', async () => {
    connecter();
    vi.spyOn(magasinService, 'getPage').mockResolvedValue(page([MAGASINS[1]]));
    vi.spyOn(magasinService, 'changerStatut').mockRejectedValue(
      new ApiClientError('Impossible de désactiver « Dépôt Nord » : c’est le dernier magasin actif', 409),
    );
    rendre();
    await screen.findByRole('cell', { name: 'Dépôt Nord' });
    await userEvent.click(screen.getByRole('button', { name: 'Désactiver Dépôt Nord' }));
    await userEvent.click(screen.getByRole('button', { name: 'Désactiver le magasin' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('dernier magasin actif');
  });

  it('crée un magasin avec des champs facultatifs vides', async () => {
    connecter('ADMIN');
    vi.spyOn(magasinService, 'getPage').mockResolvedValue(page(MAGASINS));
    const create = vi.spyOn(magasinService, 'create').mockResolvedValue({ id: 3, nom: 'Boutique Sud', actif: true, nbUtilisateurs: 0 });
    rendre();
    await screen.findByRole('cell', { name: 'Dépôt Nord' });

    await userEvent.click(screen.getByRole('button', { name: /Nouveau magasin/ }));
    await userEvent.type(screen.getByLabelText(/Nom du magasin/), '  Boutique   Sud ');
    await userEvent.click(screen.getByRole('button', { name: 'Créer le magasin' }));

    await waitFor(() => expect(create).toHaveBeenCalledWith({ nom: 'Boutique Sud', adresse: undefined, telephone: undefined }));
  });

  it('lecture seule pour un gestionnaire', async () => {
    connecter('GESTIONNAIRE');
    vi.spyOn(magasinService, 'getPage').mockResolvedValue(page(MAGASINS));
    rendre();
    await screen.findByRole('cell', { name: 'Dépôt Nord' });
    await waitFor(() => expect(authService.me).toHaveBeenCalled());
    expect(screen.queryByRole('button', { name: /Nouveau magasin/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Désactiver/ })).not.toBeInTheDocument();
  });
});

describe('validerMagasin', () => {
  it('nom obligatoire, téléphone facultatif mais contrôlé', () => {
    expect(validerMagasin({ nom: ' ', adresse: '', telephone: '' })).toEqual({ nom: 'Le nom est obligatoire' });
    expect(validerMagasin({ nom: 'A', adresse: '', telephone: 'appelez-moi' })).toHaveProperty('telephone');
    expect(validerMagasin({ nom: 'A', adresse: '', telephone: '+221 (33) 000-00.00' })).toEqual({});
  });
});
