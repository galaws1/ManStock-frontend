import type { StatutFacture, StatutPaiement } from '../../types/facture';
import type { StatutCommande } from '../../types/commande';
import { LIBELLES_STATUT_COMMANDE } from '../../types/commande';

const classes = {
  vert: 'bg-succes-pale text-succes',
  ambre: 'bg-ambre-pale text-ambre-fonce',
  rouge: 'bg-alerte-pale text-alerte',
  gris: 'bg-ligne text-encre-douce',
  acier: 'bg-acier-pale text-acier',
};

function Badge({ couleur, children }: { couleur: keyof typeof classes; children: React.ReactNode }) {
  return <span className={`rounded-sm px-2 py-0.5 text-xs font-medium ${classes[couleur]}`}>{children}</span>;
}

export function BadgeFacture({ statut, paiement }: { statut: StatutFacture; paiement?: StatutPaiement }) {
  if (statut === 'BROUILLON') return <Badge couleur="gris">Brouillon</Badge>;
  if (statut === 'ANNULEE') return <Badge couleur="rouge">Annulée</Badge>;
  if (paiement === 'PAYEE') return <Badge couleur="vert">Payée</Badge>;
  if (paiement === 'PARTIELLE') return <Badge couleur="ambre">Paiement partiel</Badge>;
  return <Badge couleur="ambre">À encaisser</Badge>;
}

export function BadgeCommande({ statut }: { statut: StatutCommande }) {
  const couleur = ({ BROUILLON: 'gris', EN_ATTENTE_VALIDATION: 'ambre', VALIDEE: 'acier', RECUE: 'vert', ANNULEE: 'rouge' } as const)[statut];
  return <Badge couleur={couleur}>{LIBELLES_STATUT_COMMANDE[statut]}</Badge>;
}
