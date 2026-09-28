import { render } from '@testing-library/react';
import type { ReactElement } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { vi } from 'vitest';
import { ToastViewport } from '../components/common/Toast';
import { AuthProvider } from '../context/AuthContext';
import { StockProvider } from '../context/StockContext';
import { authService } from '../services/domains/authService';
import { tokenStorage } from '../utils/security';

/** Simule un utilisateur connecté avec le rôle donné. */
export function connecter(roleCode: string) {
  tokenStorage.set('jwt', new Date(Date.now() + 3_600_000).toISOString());
  vi.spyOn(authService, 'me').mockResolvedValue({ id: 1, username: 'u', nom: 'N', roleCode, roleLibelle: roleCode, doitChangerMotDePasse: false });
}

/** Rend un écran dans les providers de l'application, sur la route donnée. */
export function rendreEcran(element: ReactElement, { chemin = '/', url = '/' }: { chemin?: string; url?: string } = {}) {
  return render(
    <StockProvider>
      <AuthProvider>
        <MemoryRouter initialEntries={[url]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Routes>
            <Route path={chemin} element={element} />
            <Route path="*" element={<p>Autre page</p>} />
          </Routes>
        </MemoryRouter>
        <ToastViewport />
      </AuthProvider>
    </StockProvider>,
  );
}
