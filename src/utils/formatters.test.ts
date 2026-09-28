import { describe, expect, it } from 'vitest';
import { formatNombre, nbDecimales, parseNombre, versSaisie } from './formatters';
import { avecOptionActuelle } from './options';

describe('saisie des nombres à la française', () => {
  it('parseNombre', () => {
    expect(parseNombre('1 500,5')).toBe(1500.5);
    expect(parseNombre('1\u202F500')).toBe(1500);
    expect(parseNombre('12')).toBe(12);
    expect(parseNombre('12,3,4')).toBeNaN();
    expect(parseNombre('abc')).toBeNaN();
    expect(parseNombre('')).toBeNaN();
  });
  it('nbDecimales', () => {
    expect(nbDecimales('10,555')).toBe(3);
    expect(nbDecimales('10')).toBe(0);
  });
  it('formatNombre et versSaisie', () => {
    expect(formatNombre(2.5)).toBe('2,5');
    expect(versSaisie(1500.5)).toBe('1500,5');
    expect(versSaisie(undefined)).toBe('');
  });
});

describe('avecOptionActuelle', () => {
  const options = [{ id: 1, libelle: 'Magasin principal' }];
  it('ajoute le magasin actuel désactivé pour qu’il reste sélectionné', () => {
    expect(avecOptionActuelle(options, 2, 'Dépôt fermé')).toEqual([...options, { id: 2, libelle: 'Dépôt fermé (désactivé)' }]);
  });
  it('ne duplique pas un élément déjà présent', () => {
    expect(avecOptionActuelle(options, 1, 'Magasin principal')).toBe(options);
  });
});
