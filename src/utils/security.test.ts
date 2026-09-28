import { describe, expect, it } from 'vitest';
import { isExpired, nouveauMotDePasseProblem, passwordProblem, ROLE_CODE_PATTERN, sanitizeText, tokenStorage, USERNAME_PATTERN } from './security';

describe('passwordProblem (même règle que le backend)', () => {
  it('accepte 8+ caractères avec lettre et chiffre', () => expect(passwordProblem('Secret123')).toBeNull());
  it('refuse trop court', () => expect(passwordProblem('Ab1')).toMatch(/8 caractères/));
  it('refuse sans chiffre', () => expect(passwordProblem('Motdepasse')).toMatch(/chiffre/));
  it('refuse sans lettre', () => expect(passwordProblem('12345678')).toMatch(/lettre/));
  it('refuse au-delà de 72 (limite bcrypt)', () => expect(passwordProblem('a1'.repeat(37))).toMatch(/72/));
});

describe('sanitizeText', () => {
  it('supprime caractères de contrôle et espaces superflus', () => {
    expect(sanitizeText('  Jean\u0000   Paul \n')).toBe('Jean Paul');
  });
});

describe('patterns', () => {
  it('identifiant', () => {
    expect(USERNAME_PATTERN.test('lucie.b')).toBe(true);
    expect(USERNAME_PATTERN.test('a b')).toBe(false);
    expect(USERNAME_PATTERN.test('ab')).toBe(false);
  });
  it('code de rôle', () => {
    expect(ROLE_CODE_PATTERN.test('MAGASINIER_2')).toBe(true);
    expect(ROLE_CODE_PATTERN.test('2ROLE')).toBe(false);
  });
});

describe('tokenStorage', () => {
  it('rend le jeton tant qu’il n’est pas expiré', () => {
    tokenStorage.set('abc', new Date(Date.now() + 60_000).toISOString());
    expect(tokenStorage.get()).toBe('abc');
  });
  it('purge un jeton expiré', () => {
    tokenStorage.set('abc', new Date(Date.now() - 1000).toISOString());
    expect(tokenStorage.get()).toBeNull();
    expect(sessionStorage.length).toBe(0);
  });
  it('isExpired traite une date invalide comme expirée', () => expect(isExpired('pas une date')).toBe(true));
});

describe('nouveauMotDePasseProblem', () => {
  it('refuse l’identifiant, même en changeant la casse', () =>
    expect(nouveauMotDePasseProblem('Lucie2026', 'x', 'lucie2026')).toMatch(/identifiant/));
  it('refuse un mot de passe identique à l’ancien', () =>
    expect(nouveauMotDePasseProblem('Secret123', 'Secret123', 'lucie')).toMatch(/différent/));
  it('accepte un mot de passe valide', () => expect(nouveauMotDePasseProblem('Secret123', 'lucie', 'lucie')).toBeNull());
});
