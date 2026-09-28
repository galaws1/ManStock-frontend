import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider } from '../../context/AuthContext';
import { StockProvider } from '../../context/StockContext';
import { authService } from '../../services/domains/authService';
import { categorieService } from '../../services/domains/categorieService';
import { familleService } from '../../services/domains/familleService';
import type { Categorie } from '../../types/categorie';
import { tokenStorage } from '../../utils/security';
import { ToastViewport } from '../common/Toast';
import { validerCategorie } from './CategorieFormModal';
import { CategoriesPage } from './CategoriesPage';

const FAMILLES = [
  { id: 1, libelle: 'Boissons' },
  { id: 2, libelle: 'Épicerie' },
];
const CATEGORIES: Categorie[] = [
  { id: 5, nom: 'Sodas', familleId: 1, familleNom: 'Boissons', nbProduits: 12 },
  { id: 6, nom: 'Eaux', familleId: 1, familleNom: 'Boissons', nbProduits: 0 },
];
const page = (content: Categorie[]) => ({ content, page: 0, size: 20, totalElements: content.length, totalPages: 1 });

function connecter(roleCode = 'GESTIONNAIRE') {
  tokenStorage.set('jwt', new Date(Date.now() + 3_600_000).toISOString());
  vi.spyOn(authService, 'me').mockResolvedValue({ id: 1, username: 'u', nom: 'N', roleCode, roleLibelle: roleCode, doitChangerMotDePasse: false });
}

function AfficheUrl() {
  const l = useLocation();
  return <p data-testid="url">{l.pathname + l.search}</p>;
}

function rendre(url = '/catalogue/categories') {
  render(
    <StockProvider>
      <AuthProvider>
        <MemoryRouter initialEntries={[url]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Routes>
            <Route path="/catalogue/categories" element={<><CategoriesPage /><AfficheUrl /></>} />
            <Route path="/catalogue/familles" element={<p>Page familles</p>} />
          </Routes>
        </MemoryRouter>
        <ToastViewport />
      </AuthProvider>
    </StockProvider>,
  );
}

describe('CategoriesPage', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(familleService, 'options').mockResolvedValue(FAMILLES);
  });

  it('applique le filtre famille présent dans l’URL (lien depuis la page Familles)', async () => {
    connecter();
    const getPage = vi.spyOn(categorieService, 'getPage').mockResolvedValue(page(CATEGORIES));
    rendre('/catalogue/categories?familleId=1');

    await screen.findByRole('cell', { name: 'Sodas' });
    expect(getPage).toHaveBeenLastCalledWith(expect.objectContaining({ familleId: 1 }));
    await waitFor(() => expect(screen.getByLabelText('Famille')).toHaveValue('1'));
  });

  it('changer de famille met à jour l’URL et la requête', async () => {
    connecter();
    const getPage = vi.spyOn(categorieService, 'getPage').mockResolvedValue(page(CATEGORIES));
    rendre();
    await screen.findByRole('cell', { name: 'Sodas' });
    await waitFor(() => expect(screen.getByRole('option', { name: 'Épicerie' })).toBeInTheDocument());

    await userEvent.selectOptions(screen.getByLabelText('Famille'), '2');

    expect(screen.getByTestId('url')).toHaveTextContent('/catalogue/categories?familleId=2');
    await waitFor(() => expect(getPage).toHaveBeenLastCalledWith(expect.objectContaining({ familleId: 2, page: 0 })));
  });

  it('suppression bloquée pour une catégorie qui contient des produits', async () => {
    connecter();
    vi.spyOn(categorieService, 'getPage').mockResolvedValue(page(CATEGORIES));
    rendre();
    const sodas = (await screen.findByRole('cell', { name: 'Sodas' })).closest('tr')!;
    expect(within(sodas).getByRole('button', { name: 'Supprimer Sodas' })).toBeDisabled();
    const eaux = screen.getByRole('cell', { name: 'Eaux' }).closest('tr')!;
    expect(within(eaux).getByRole('button', { name: 'Supprimer Eaux' })).toBeEnabled();
  });

  it('création : la famille filtrée est présélectionnée', async () => {
    connecter();
    vi.spyOn(categorieService, 'getPage').mockResolvedValue(page(CATEGORIES));
    const create = vi.spyOn(categorieService, 'create').mockResolvedValue({ ...CATEGORIES[0], id: 7, nom: 'Jus de fruits' });
    rendre('/catalogue/categories?familleId=1');
    await screen.findByRole('cell', { name: 'Sodas' });

    await userEvent.click(screen.getByRole('button', { name: /Nouvelle catégorie/ }));
    const dialogue = screen.getByRole('dialog');
    expect(within(dialogue).getByLabelText(/Famille/)).toHaveValue('1');
    await userEvent.type(within(dialogue).getByLabelText(/Nom de la catégorie/), ' Jus  de fruits ');
    await userEvent.click(within(dialogue).getByRole('button', { name: 'Créer la catégorie' }));

    await waitFor(() => expect(create).toHaveBeenCalledWith({ nom: 'Jus de fruits', familleId: 1 }));
    expect(await screen.findByText('Catégorie « Jus de fruits » créée')).toBeInTheDocument();
  });

  it('sans famille : explique qu’il faut d’abord en créer une', async () => {
    connecter();
    vi.spyOn(familleService, 'options').mockResolvedValue([]);
    vi.spyOn(categorieService, 'getPage').mockResolvedValue(page([]));
    rendre();

    expect(await screen.findByRole('heading', { name: 'Aucune famille pour l’instant' })).toBeInTheDocument();
    await userEvent.click(await screen.findByRole('link', { name: 'Créer une famille' }));
    expect(screen.getByText('Page familles')).toBeInTheDocument();
  });
});

describe('validerCategorie', () => {
  it('nom et famille obligatoires', () => {
    expect(validerCategorie('  ', '')).toEqual({ nom: 'Le nom est obligatoire', familleId: 'Choisissez une famille' });
    expect(validerCategorie('Sodas', '1')).toEqual({});
  });
});
