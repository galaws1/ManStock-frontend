import type { ModePaiement, PaiementRequest } from '../types/facture';

const arrondi = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

/** Même calcul que LignesVente.total côté serveur : somme des lignes, remise %, arrondi au centime. */
export function totalLignes(lignes: { quantite: number; prixUnitaire: number }[], remisePourcent = 0): { brut: number; remise: number; total: number } {
  const brut = lignes.reduce((s, l) => s + l.quantite * l.prixUnitaire, 0);
  const total = arrondi((brut * (100 - remisePourcent)) / 100);
  return { brut: arrondi(brut), remise: arrondi(brut - total), total };
}

/**
 * Rendu de monnaie : seules les espèces peuvent dépasser le total (mêmes règles que le serveur).
 * `manque` > 0 : paiement insuffisant ; `erreur` : trop-perçu hors espèces.
 */
export function calculerRendu(total: number, paiements: PaiementRequest[]): { recu: number; rendu: number; manque: number; erreur?: string } {
  const recu = arrondi(paiements.reduce((s, p) => s + (p.montant || 0), 0));
  const especes = paiements.filter((p) => p.mode === 'ESPECES').reduce((s, p) => s + (p.montant || 0), 0);
  const rendu = arrondi(Math.max(0, recu - total));
  const manque = arrondi(Math.max(0, total - recu));
  const erreur = rendu > especes + 0.001 ? 'Seules les espèces peuvent donner lieu à un rendu de monnaie' : undefined;
  return { recu, rendu, manque, erreur };
}

export const MODES: ModePaiement[] = ['ESPECES', 'CARTE', 'MOBILE'];
