import { AxiosError, AxiosHeaders } from 'axios';
import type { ApiErrorBody } from '../types/api';
import { describe, expect, it, vi } from 'vitest';
import { ApiClientError, toApiClientError, UNAUTHORIZED_EVENT } from './axiosConfig';
import { tokenStorage } from '../utils/security';

function erreur(status: number, data: ApiErrorBody, url = '/utilisateurs') {
  const config = { url, headers: new AxiosHeaders() };
  return new AxiosError<ApiErrorBody>('x', 'ERR', config, null, { status, data, statusText: '', headers: {}, config });
}

describe('toApiClientError', () => {
  it('reprend message et erreurs par champ du backend', () => {
    const e = toApiClientError(erreur(400, { status: 400, message: 'Certains champs sont invalides', fieldErrors: { nom: 'obligatoire' } }));
    expect(e).toBeInstanceOf(ApiClientError);
    expect(e.status).toBe(400);
    expect(e.fieldErrors).toEqual({ nom: 'obligatoire' });
  });

  it('un 401 hors login purge le jeton et prévient AuthContext', () => {
    tokenStorage.set('abc', new Date(Date.now() + 60_000).toISOString());
    const listener = vi.fn();
    window.addEventListener(UNAUTHORIZED_EVENT, listener);
    toApiClientError(erreur(401, { status: 401, message: 'Session expirée' }));
    expect(listener).toHaveBeenCalledOnce();
    expect(tokenStorage.get()).toBeNull();
    window.removeEventListener(UNAUTHORIZED_EVENT, listener);
  });

  it('un 401 sur /auth/login ne déclenche pas de déconnexion globale', () => {
    const listener = vi.fn();
    window.addEventListener(UNAUTHORIZED_EVENT, listener);
    const e = toApiClientError(erreur(401, { status: 401, message: 'Identifiant ou mot de passe incorrect' }, '/auth/login'));
    expect(listener).not.toHaveBeenCalled();
    expect(e.message).toBe('Identifiant ou mot de passe incorrect');
    window.removeEventListener(UNAUTHORIZED_EVENT, listener);
  });

  it('sans réponse : message réseau local explicite', () => {
    const e = toApiClientError(new AxiosError<ApiErrorBody>('Network Error', 'ERR_NETWORK'));
    expect(e.status).toBe(0);
    expect(e.message).toMatch(/réseau du magasin/);
  });
});
