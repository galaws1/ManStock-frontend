import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider } from '../../context/AuthContext';
import { StockProvider } from '../../context/StockContext';
import { ApiClientError } from '../../services/axiosConfig';
import { authService } from '../../services/domains/authService';
import { PermissionGate } from '../common/PermissionGate';
import { ChangerMotDePassePage } from './ChangerMotDePassePage';
import { LoginPage } from './LoginPage';
import { ProtectedRoute } from './ProtectedRoute';

function rendre() {
  render(
    <StockProvider>
      <AuthProvider>
        <MemoryRouter initialEntries={['/connexion']} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Routes>
            <Route path="/connexion" element={<LoginPage />} />
            <Route path="/changer-mot-de-passe" element={<ChangerMotDePassePage />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                <div>
                  <p>Accueil</p>
                  <PermissionGate roles={['ADMIN']}>
                    <p>Zone admin</p>
                  </PermissionGate>
                </div>
                </ProtectedRoute>
              }
            />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    </StockProvider>,
  );
}

describe('LoginPage', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('connecte, stocke le jeton et redirige', async () => {
    vi.spyOn(authService, 'login').mockResolvedValue({
      token: 'jwt-123',
      expiresAt: new Date(Date.now() + 3_600_000).toISOString(),
      utilisateur: { id: 3, username: 'lucie', nom: 'Bernard', prenom: 'Lucie', roleCode: 'CAISSIER', roleLibelle: 'Caissier', doitChangerMotDePasse: false },
    });
    rendre();
    await userEvent.type(screen.getByLabelText('Identifiant'), ' lucie ');
    await userEvent.type(screen.getByLabelText('Mot de passe'), 'Secret123');
    await userEvent.click(screen.getByRole('button', { name: 'Se connecter' }));

    await waitFor(() => expect(screen.getByText('Accueil')).toBeInTheDocument());
    expect(authService.login).toHaveBeenCalledWith({ username: 'lucie', motDePasse: 'Secret123' });
    expect(sessionStorage.getItem('manstock.token')).toBe('jwt-123');
    // PermissionGate : un caissier ne voit pas la zone admin
    expect(screen.queryByText('Zone admin')).not.toBeInTheDocument();
  });

  it('affiche le message du serveur en cas d’échec et vide le mot de passe', async () => {
    vi.spyOn(authService, 'login').mockRejectedValue(new ApiClientError('Identifiant ou mot de passe incorrect', 401));
    rendre();
    await userEvent.type(screen.getByLabelText('Identifiant'), 'lucie');
    await userEvent.type(screen.getByLabelText('Mot de passe'), 'mauvais1');
    await userEvent.click(screen.getByRole('button', { name: 'Se connecter' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Identifiant ou mot de passe incorrect');
    expect(screen.getByLabelText('Mot de passe')).toHaveValue('');
  });

  it('refuse un formulaire vide sans appeler le serveur', async () => {
    const spy = vi.spyOn(authService, 'login');
    rendre();
    await userEvent.click(screen.getByRole('button', { name: 'Se connecter' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Saisissez votre identifiant');
    expect(spy).not.toHaveBeenCalled();
  });

  it('mot de passe à changer : redirige vers la page dédiée puis rétablit l’accès', async () => {
    vi.spyOn(authService, 'login').mockResolvedValue({
      token: 'jwt-456',
      expiresAt: new Date(Date.now() + 3_600_000).toISOString(),
      utilisateur: { id: 4, username: 'paul', nom: 'Martin', prenom: 'Paul', roleCode: 'GESTIONNAIRE', roleLibelle: 'Gestionnaire', doitChangerMotDePasse: true },
    });
    const changer = vi.spyOn(authService, 'changerMotDePasse').mockResolvedValue();
    rendre();
    await userEvent.type(screen.getByLabelText('Identifiant'), 'paul');
    await userEvent.type(screen.getByLabelText('Mot de passe'), 'paul');
    await userEvent.click(screen.getByRole('button', { name: 'Se connecter' }));

    expect(await screen.findByRole('heading', { name: 'Choisissez votre mot de passe' })).toBeInTheDocument();
    expect(screen.queryByText('Accueil')).not.toBeInTheDocument();

    // L'identifiant est refusé comme nouveau mot de passe
    await userEvent.type(screen.getByLabelText(/Mot de passe actuel/), 'paul');
    await userEvent.type(screen.getByLabelText(/^Nouveau mot de passe/), 'Paul');
    await userEvent.click(screen.getByRole('button', { name: 'Enregistrer et continuer' }));
    expect(changer).not.toHaveBeenCalled();

    const nouveau = screen.getByLabelText(/^Nouveau mot de passe/);
    await userEvent.clear(nouveau);
    await userEvent.type(nouveau, 'Entrepot2026');
    await userEvent.type(screen.getByLabelText(/Confirmer/), 'Entrepot2026');
    await userEvent.click(screen.getByRole('button', { name: 'Enregistrer et continuer' }));

    await waitFor(() => expect(screen.getByText('Accueil')).toBeInTheDocument());
    expect(changer).toHaveBeenCalledWith({ ancienMotDePasse: 'paul', nouveauMotDePasse: 'Entrepot2026' });
  });
});
