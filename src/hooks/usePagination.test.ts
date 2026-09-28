import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { Page, PageParams } from '../types/pagination';
import { usePagination } from './usePagination';

/** Faux backend : 45 éléments, filtrables par "q". */
function fauxBackend(total = 45) {
  return vi.fn(async (p: PageParams & { q?: string }): Promise<Page<number>> => {
    const n = p.q ? Math.min(total, 5) : total;
    const totalPages = Math.ceil(n / p.size);
    const debut = p.page * p.size;
    const content = Array.from({ length: Math.max(0, Math.min(p.size, n - debut)) }, (_, i) => debut + i);
    return { content, page: p.page, size: p.size, totalElements: n, totalPages, tri: p.tri, sens: p.sens };
  });
}

const opts = { triInitial: 'nom', delai: 0 };

describe('usePagination', () => {
  it('charge la première page avec les paramètres par défaut', async () => {
    const charger = fauxBackend();
    const { result } = renderHook(() => usePagination(charger, { q: '' }, opts));
    await waitFor(() => expect(result.current.chargement).toBe(false));

    expect(charger).toHaveBeenLastCalledWith({ q: '', page: 0, size: 20, tri: 'nom', sens: 'asc' });
    expect(result.current.lignes).toHaveLength(20);
    expect(result.current.resultat?.totalPages).toBe(3);
  });

  it('un changement de filtre ramène à la première page', async () => {
    const charger = fauxBackend();
    const { result, rerender } = renderHook(({ q }) => usePagination(charger, { q }, opts), { initialProps: { q: '' } });
    await waitFor(() => expect(result.current.chargement).toBe(false));
    act(() => result.current.setPage(2));
    await waitFor(() => expect(result.current.lignes[0]).toBe(40));

    rerender({ q: 'luc' });
    await waitFor(() => expect(charger).toHaveBeenLastCalledWith(expect.objectContaining({ q: 'luc', page: 0 })));
    await waitFor(() => expect(result.current.page).toBe(0));
  });

  it('trier : même colonne inverse le sens, autre colonne repart en asc et en page 1', async () => {
    const charger = fauxBackend();
    const { result } = renderHook(() => usePagination(charger, {}, opts));
    await waitFor(() => expect(result.current.chargement).toBe(false));
    act(() => result.current.setPage(1));

    act(() => result.current.trier('nom'));
    await waitFor(() => expect(charger).toHaveBeenLastCalledWith(expect.objectContaining({ tri: 'nom', sens: 'desc', page: 0 })));

    act(() => result.current.trier('role'));
    await waitFor(() => expect(charger).toHaveBeenLastCalledWith(expect.objectContaining({ tri: 'role', sens: 'asc', page: 0 })));
  });

  it('recule sur la dernière page existante si la page courante a disparu', async () => {
    let total = 45;
    const charger = vi.fn((p: PageParams) => fauxBackend(total)(p));
    const { result } = renderHook(() => usePagination(charger, {}, opts));
    await waitFor(() => expect(result.current.chargement).toBe(false));
    act(() => result.current.setPage(2));
    await waitFor(() => expect(result.current.lignes[0]).toBe(40));

    total = 40; // le 41e élément a été désactivé : il n'y a plus que 2 pages
    act(() => result.current.recharger());
    await waitFor(() => expect(result.current.page).toBe(1));
    await waitFor(() => expect(result.current.lignes[0]).toBe(20));
  });

  it('changer la taille ramène à la première page', async () => {
    const charger = fauxBackend();
    const { result } = renderHook(() => usePagination(charger, {}, opts));
    await waitFor(() => expect(result.current.chargement).toBe(false));
    act(() => result.current.setPage(2));
    act(() => result.current.setTaille(50));
    await waitFor(() => expect(charger).toHaveBeenLastCalledWith(expect.objectContaining({ page: 0, size: 50 })));
  });

  it('signale les erreurs', async () => {
    const onErreur = vi.fn();
    const { result } = renderHook(() =>
      usePagination(() => Promise.reject(new Error('réseau')), {}, { ...opts, onErreur }),
    );
    await waitFor(() => expect(result.current.chargement).toBe(false));
    expect(onErreur).toHaveBeenCalledOnce();
  });
});
