import { beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from './axiosConfig';
import { ApiService } from './ApiService';

describe('ApiService<T>', () => {
  const service = new ApiService<{ id: number }>('roles');
  beforeEach(() => vi.restoreAllMocks());

  it('getAll retire les paramètres vides', async () => {
    const spy = vi.spyOn(api, 'get').mockResolvedValue({ data: [{ id: 1 }] });
    await service.getAll({ recherche: '', actif: true, x: undefined });
    expect(spy).toHaveBeenCalledWith('/roles', { params: { actif: true } });
  });

  it('getPage envoie filtres et pagination, sans les filtres vides', async () => {
    const page = { content: [{ id: 1 }], page: 0, size: 20, totalElements: 1, totalPages: 1 };
    const spy = vi.spyOn(api, 'get').mockResolvedValue({ data: page });
    const r = await service.getPage({ page: 0, size: 20, tri: 'nom', sens: 'asc', recherche: '', actif: undefined });
    expect(spy).toHaveBeenCalledWith('/roles', { params: { page: 0, size: 20, tri: 'nom', sens: 'asc' } });
    expect(r.totalElements).toBe(1);
  });

  it('update et delete ciblent /ressource/id', async () => {
    const put = vi.spyOn(api, 'put').mockResolvedValue({ data: { id: 4 } });
    const del = vi.spyOn(api, 'delete').mockResolvedValue({ data: undefined });
    await service.update(4, { id: 4 });
    await service.delete(4);
    expect(put).toHaveBeenCalledWith('/roles/4', { id: 4 });
    expect(del).toHaveBeenCalledWith('/roles/4');
  });
});
