import type { Page, PageParams } from '../types/pagination';
import { api } from './axiosConfig';

/**
 * Service CRUD générique : un service de domaine = une instance (ou une sous-classe
 * pour les actions métier spécifiques). Les routes suivent la convention /api/<ressource>.
 *
 * Listes : getAll() pour les petits référentiels chargés en entier (rôles, unités...),
 * getPage() pour toute liste qui peut grandir (utilisateurs, produits, mouvements, factures...).
 */
export class ApiService<T, TCreate = Partial<T>, TUpdate = TCreate> {
  constructor(protected readonly resource: string) {}

  protected url(suffix: string | number = ''): string {
    return suffix === '' ? `/${this.resource}` : `/${this.resource}/${suffix}`;
  }

  async getAll(params?: Record<string, unknown>): Promise<T[]> {
    const { data } = await api.get<T[]>(this.url(), { params: nettoyer(params) });
    return data;
  }

  /** Liste paginée : filtres métier + page/size/tri/sens. */
  async getPage<F extends object>(params: PageParams & F): Promise<Page<T>> {
    const { data } = await api.get<Page<T>>(this.url(), { params: nettoyer(params as Record<string, unknown>) });
    return data;
  }

  async getById(id: number): Promise<T> {
    const { data } = await api.get<T>(this.url(id));
    return data;
  }

  async create(payload: TCreate): Promise<T> {
    const { data } = await api.post<T>(this.url(), payload);
    return data;
  }

  async update(id: number, payload: TUpdate): Promise<T> {
    const { data } = await api.put<T>(this.url(id), payload);
    return data;
  }

  async delete(id: number): Promise<void> {
    await api.delete(this.url(id));
  }
}

/** Retire les paramètres vides pour ne pas envoyer "?recherche=&actif=". */
function nettoyer(params?: Record<string, unknown>): Record<string, unknown> | undefined {
  if (!params) return undefined;
  return Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== ''));
}
