import { screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { uniteService } from '../../services/domains/uniteService';
import { connecter, rendreEcran } from '../../test/rendu';
import { UnitesPage } from './UnitesPage';

describe('UnitesPage', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('une unité utilisée par des produits ne peut pas être supprimée', async () => {
    connecter('GESTIONNAIRE');
    vi.spyOn(uniteService, 'getAll').mockResolvedValue([
      { id: 1, nom: 'Unité', symbole: 'u', nbProduits: 42 },
      { id: 2, nom: 'Mètre', symbole: 'm', nbProduits: 0 },
    ]);
    rendreEcran(<UnitesPage />);

    const unite = (await screen.findByRole('cell', { name: 'Unité' })).closest('tr')!;
    expect(within(unite).getByRole('button', { name: 'Supprimer Unité' })).toBeDisabled();
    const metre = screen.getByRole('cell', { name: 'Mètre' }).closest('tr')!;
    expect(within(metre).getByRole('button', { name: 'Supprimer Mètre' })).toBeEnabled();
  });
});
