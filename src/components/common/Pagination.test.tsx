import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Pagination, pagesVisibles } from './Pagination';

describe('pagesVisibles', () => {
  it('peu de pages : toutes affichées', () => expect(pagesVisibles(0, 3)).toEqual([0, 1, 2]));
  it('début de liste', () => expect(pagesVisibles(0, 10)).toEqual([0, 1, '…', 9]));
  it('milieu de liste', () => expect(pagesVisibles(5, 10)).toEqual([0, '…', 4, 5, 6, '…', 9]));
  it('fin de liste', () => expect(pagesVisibles(9, 10)).toEqual([0, '…', 8, 9]));
  it('un seul numéro manquant est affiché plutôt que « … »', () => expect(pagesVisibles(3, 10)).toEqual([0, 1, 2, 3, 4, '…', 9]));
  it('aucune page', () => expect(pagesVisibles(0, 0)).toEqual([]));
});

describe('<Pagination />', () => {
  const resultat = { content: [], page: 1, size: 20, totalElements: 134, totalPages: 7 };

  it('affiche la plage et navigue', async () => {
    const onPage = vi.fn();
    render(<Pagination resultat={resultat} page={1} onPage={onPage} taille={20} onTaille={vi.fn()} />);

    expect(screen.getByText('21–40 sur 134')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Page 2' })).toHaveAttribute('aria-current', 'page');

    await userEvent.click(screen.getByRole('button', { name: 'Page suivante' }));
    await userEvent.click(screen.getByRole('button', { name: 'Page 7' }));
    expect(onPage.mock.calls).toEqual([[2], [6]]);
  });

  it('désactive « précédent » sur la première page et « suivant » sur la dernière', () => {
    const { rerender } = render(<Pagination resultat={resultat} page={0} onPage={vi.fn()} taille={20} onTaille={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Page précédente' })).toBeDisabled();
    rerender(<Pagination resultat={resultat} page={6} onPage={vi.fn()} taille={20} onTaille={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Page suivante' })).toBeDisabled();
    expect(screen.getByText('121–134 sur 134')).toBeInTheDocument();
  });

  it('change la taille de page', async () => {
    const onTaille = vi.fn();
    render(<Pagination resultat={resultat} page={0} onPage={vi.fn()} taille={20} onTaille={onTaille} />);
    await userEvent.selectOptions(screen.getByLabelText('Lignes par page'), '50');
    expect(onTaille).toHaveBeenCalledWith(50);
  });

  it('ne s’affiche pas pour une liste vide', () => {
    const { container } = render(
      <Pagination resultat={{ ...resultat, totalElements: 0, totalPages: 0 }} page={0} onPage={vi.fn()} taille={20} onTaille={vi.fn()} />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
