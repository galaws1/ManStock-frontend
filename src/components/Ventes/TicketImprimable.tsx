import type { Facture } from '../../types/facture';
import { LIBELLES_MODE } from '../../types/facture';
import { formatDateHeure, formatMontant, formatNombre } from '../../utils/formatters';

/** Ticket de caisse au format étroit (imprimante 80 mm). */
export function TicketImprimable({ ticket, rendu }: { ticket: Facture; rendu?: number }) {
  const brut = (ticket.lignes ?? []).reduce((s, l) => s + l.montant, 0);
  return (
    <div className="imprimable mx-auto w-full max-w-xs rounded border border-ligne bg-white p-4 font-mono text-xs leading-relaxed">
      <p className="text-center text-sm font-bold">{ticket.magasinNom}</p>
      <p className="text-center">{ticket.numero} · {formatDateHeure(ticket.dateFacture)}</p>
      <p className="mb-2 text-center">{ticket.caisseNom} · {ticket.vendeur}</p>
      <div className="border-y border-dashed border-encre/40 py-2">
        {ticket.lignes?.map((l) => (
          <div key={l.id}>
            <p>{l.produitNom}</p>
            <p className="flex justify-between">
              <span>{formatNombre(l.quantite)} {l.conditionnement} × {formatMontant(l.prixUnitaire)}</span>
              <span>{formatMontant(l.montant)}</span>
            </p>
          </div>
        ))}
      </div>
      {ticket.remisePourcent > 0 && (
        <p className="flex justify-between"><span>Remise {formatNombre(ticket.remisePourcent)} %</span><span>−{formatMontant(brut - ticket.montantTotal)}</span></p>
      )}
      <p className="flex justify-between text-sm font-bold"><span>TOTAL</span><span>{formatMontant(ticket.montantTotal)}</span></p>
      {ticket.paiements?.map((p) => (
        <p key={p.id} className="flex justify-between"><span>{LIBELLES_MODE[p.mode]}</span><span>{formatMontant(p.montant)}</span></p>
      ))}
      {rendu !== undefined && rendu > 0 && <p className="flex justify-between font-bold"><span>Rendu</span><span>{formatMontant(rendu)}</span></p>}
      <p className="mt-3 text-center">Merci de votre visite</p>
    </div>
  );
}
