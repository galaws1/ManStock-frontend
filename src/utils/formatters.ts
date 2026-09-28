const DEVISE = 'XOF'; // à ajuster selon le pays d'exploitation

export function formatMontant(value: number, devise: string = DEVISE): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: devise }).format(value);
}

export function formatDateHeure(iso?: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'short', timeStyle: 'short' }).format(d);
}

export function nomComplet(u: { nom: string; prenom?: string | null }): string {
  return [u.prenom, u.nom].filter(Boolean).join(' ');
}

export function initiales(u: { nom: string; prenom?: string | null }): string {
  return ((u.prenom?.[0] ?? '') + (u.nom?.[0] ?? '')).toUpperCase() || '?';
}

/**
 * Lit un nombre saisi à la française : "1 500,5" → 1500.5.
 * Renvoie NaN si la saisie n'est pas un nombre (lettres, deux virgules...).
 */
export function parseNombre(saisie: string): number {
  const s = saisie.replace(/[\s\u00A0\u202F]/g, '').replace(',', '.');
  return /^-?\d+(\.\d+)?$/.test(s) ? Number(s) : NaN;
}

/** Nombre de décimales d'une saisie (après normalisation). */
export function nbDecimales(saisie: string): number {
  const s = saisie.trim().replace(',', '.');
  const i = s.indexOf('.');
  return i < 0 ? 0 : s.length - i - 1;
}

/** 1500.5 → "1 500,5" ; 12 → "12". */
export function formatNombre(n: number, maxDecimales = 3): string {
  return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: maxDecimales }).format(n);
}

/** Valeur numérique → texte à afficher dans un champ de saisie ("1500,5"). */
export function versSaisie(n?: number | null): string {
  return n === undefined || n === null ? '' : String(n).replace('.', ',');
}
