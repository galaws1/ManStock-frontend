/**
 * Utilitaires de sécurité côté client.
 * Rappel : ils améliorent l'expérience mais ne remplacent JAMAIS les contrôles
 * du backend (validation Bean Validation + @PreAuthorize).
 */

const TOKEN_KEY = 'manstock.token';
const TOKEN_EXP_KEY = 'manstock.token.exp';

/** sessionStorage : le jeton disparaît à la fermeture du navigateur (poste de caisse partagé). */
export const tokenStorage = {
  get(): string | null {
    const token = sessionStorage.getItem(TOKEN_KEY);
    if (!token) return null;
    const exp = sessionStorage.getItem(TOKEN_EXP_KEY);
    if (exp && isExpired(exp)) {
      this.clear();
      return null;
    }
    return token;
  },
  set(token: string, expiresAt: string): void {
    sessionStorage.setItem(TOKEN_KEY, token);
    sessionStorage.setItem(TOKEN_EXP_KEY, expiresAt);
  },
  clear(): void {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(TOKEN_EXP_KEY);
  },
};

export function isExpired(expiresAtIso: string, now: Date = new Date()): boolean {
  const t = Date.parse(expiresAtIso);
  return Number.isNaN(t) || t <= now.getTime();
}

/** Supprime les caractères de contrôle et les espaces superflus d'une saisie libre. */
export function sanitizeText(value: string): string {
  // eslint-disable-next-line no-control-regex
  return value.replace(/[\u0000-\u001F\u007F]/g, '').replace(/\s+/g, ' ').trim();
}

/** Même règle que le backend : 8 à 72 caractères, au moins une lettre et un chiffre. */
export function passwordProblem(pwd: string): string | null {
  if (pwd.length < 8) return 'Au moins 8 caractères';
  if (pwd.length > 72) return '72 caractères maximum';
  if (!/[A-Za-z]/.test(pwd) || !/\d/.test(pwd)) return 'Au moins une lettre et un chiffre';
  return null;
}

/** Règles du nouveau mot de passe (identiques au backend). */
export function nouveauMotDePasseProblem(nouveau: string, ancien: string, username?: string): string | null {
  const pb = passwordProblem(nouveau);
  if (pb) return pb;
  if (nouveau === ancien) return "Doit être différent de l'ancien mot de passe";
  if (username && nouveau.toLowerCase() === username.toLowerCase()) return 'Ne peut pas être votre identifiant';
  return null;
}

/** Même règle que le backend : vide, ou 6 à 30 caractères parmi chiffres, espaces et + ( ) . - */
export const TELEPHONE_PATTERN = /^[+0-9 ().-]{6,30}$/;

export const USERNAME_PATTERN = /^[A-Za-z0-9._-]{3,60}$/;
export const ROLE_CODE_PATTERN = /^[A-Za-z][A-Za-z0-9_]{0,29}$/;
