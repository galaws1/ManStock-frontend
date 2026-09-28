import axios, { AxiosError } from 'axios';
import type { ApiErrorBody } from '../types/api';
import { tokenStorage } from '../utils/security';

/** Événement émis sur toute réponse 401 : AuthContext l'écoute pour déconnecter. */
export const UNAUTHORIZED_EVENT = 'manstock:unauthorized';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

/** Erreur normalisée exposée aux écrans (message lisible + erreurs par champ). */
export class ApiClientError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly fieldErrors: Record<string, string> = {},
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

api.interceptors.request.use((config) => {
  const token = tokenStorage.get();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorBody>) => Promise.reject(toApiClientError(error)),
);

export function toApiClientError(error: AxiosError<ApiErrorBody>): ApiClientError {
  if (!error.response) {
    return new ApiClientError(
      'Serveur injoignable. Vérifiez que le poste est bien connecté au réseau du magasin.',
      0,
    );
  }
  const { status, data, config } = error.response;
  const isLogin = config?.url?.includes('/auth/login');
  if (status === 401 && !isLogin) {
    tokenStorage.clear();
    window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
  }
  const message = data?.message ?? messageParDefaut(status);
  return new ApiClientError(message, status, data?.fieldErrors ?? {});
}

function messageParDefaut(status: number): string {
  if (status === 403) return 'Votre rôle ne permet pas cette action';
  if (status === 404) return 'Élément introuvable';
  if (status >= 500) return 'Erreur interne du serveur';
  return 'La requête a échoué';
}
