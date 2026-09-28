import { ArrowLeft, Ban, CheckCircle2, Pencil, Printer, Trash2, Wallet } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useStock } from '../../context/StockContext';
import { ApiClientError } from '../../services/axiosConfig';
import { factureService } from '../../services/domains/factureService';
import type { Facture, ModePaiement } from '../../types/facture';
import { LIBELLES_MODE } from '../../types/facture';
import { ROLES_ANNULATION, ROLES_ENCAISSEMENT, ROLES_FACTURATION } from '../../types/role';
import { formatDateHeure, formatMontant, formatNombre, parseNombre, versSaisie } from '../../utils/formatters';
import { MODES } from '../../utils/ventes';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { ErreurGlobale } from '../common/ErreurGlobale';
import { Modal } from '../common/Modal';
import { PermissionGate } from '../common/PermissionGate';
import { BadgeFacture } from './badges';

function PaiementFactureModal({ facture, onClose, onPaye }: { facture: Facture; onClose: () => void; onPaye: (f: Facture) => void }) {
  const [mode, setMode] = useState<ModePaiement>('ESPECES');
  const [montant, setMontant] = useState(versSaisie(facture.resteAPayer));
  const [erreur, setErreur] = useState<string | null>(null);
  const valider = async () => {
    const m = parseNombre(montant);
    if (Number.isNaN(m) || m <= 0) return setErreur('Montant positif attendu');
    if (m > facture.resteAPayer) return setErreur(`Le reste à payer est de ${formatMontant(facture.resteAPayer)}`);
    try {
      onPaye(await factureService.payer(facture.id, { mode, montant: m }));
    } catch (e) {
      setErreur(e instanceof ApiClientError ? e.message : 'Paiement impossible');
    }
  };
  return (
    <Modal titre="Enregistrer un paiement" onClose={onClose} largeur="sm" pied={<><button className="btn-secondaire" onClick={onClose}>Annuler</button><button className="btn-primaire" onClick={valider}>Enregistrer</button></>}>
      <ErreurGlobale message={erreur} />
      <p className="mb-3 text-sm text-encre-douce">Reste à payer : <strong className="text-encre">{formatMontant(facture.resteAPayer)}</strong></p>
      <div className="flex gap-2">
        <select aria-label="Mode de paiement" className="champ w-40" value={mode} onChange={(e) => setMode(e.target.value as ModePaiement)}>
          {MODES.map((m) => <option key={m} value={m}>{LIBELLES_MODE[m]}</option>)}
        </select>
        <input aria-label="Montant" className="champ flex-1 text-right" inputMode="decimal" value={montant} onChange={(e) => setMontant(e.target.value)} />
      </div>
    </Modal>
  );
}

export function FactureDetailPage() {
  const id = Number(useParams().id);
  const navigate = useNavigate();
  const { showToast } = useStock();
  const [f, setF] = useState<Facture | null>(null);
  const [action, setAction] = useState<'valider' | 'supprimer' | 'annuler' | 'payer' | null>(null);
  const [motif, setMotif] = useState('');

  const charger = useCallback(() => {
    factureService.getById(id).then(setF).catch(() => showToast('Pièce introuvable', 'erreur'));
  }, [id, showToast]);
  useEffect(charger, [charger]);

  const executer = async (fn: () => Promise<unknown>, succes: string) => {
    try {
      await fn();
      showToast(succes);
    } catch (e) {
      showToast(e instanceof ApiClientError ? e.message : 'Opération impossible', 'erreur');
    }
  };

  if (!f) return <p className="text-encre-douce">Chargement…</p>;
  const brut = (f.lignes ?? []).reduce((s, l) => s + l.montant, 0);

  return (
    <div>
      <div className="no-print mb-4 flex flex-wrap items-center justify-between gap-3">
        <Link to="/ventes/factures" className="inline-flex items-center gap-1 text-sm text-encre-douce hover:text-encre">
          <ArrowLeft size={14} aria-hidden /> Factures et tickets
        </Link>
        <div className="flex flex-wrap gap-2">
          {f.statut === 'BROUILLON' && (
            <PermissionGate roles={ROLES_FACTURATION}>
              <button className="btn-discret hover:!text-alerte" onClick={() => setAction('supprimer')}><Trash2 size={15} aria-hidden /> Supprimer</button>
              <Link to={`/ventes/factures/${f.id}/modifier`} className="btn-secondaire"><Pencil size={15} aria-hidden /> Modifier</Link>
              <button className="btn-primaire" onClick={() => setAction('valider')}><CheckCircle2 size={15} aria-hidden /> Valider la facture</button>
            </PermissionGate>
          )}
          {f.statut === 'VALIDEE' && (
            <>
              <PermissionGate roles={ROLES_ANNULATION}>
                <button className="btn-discret hover:!text-alerte" onClick={() => setAction('annuler')}><Ban size={15} aria-hidden /> Annuler</button>
              </PermissionGate>
              {f.resteAPayer > 0 && (
                <PermissionGate roles={ROLES_ENCAISSEMENT}>
                  <button className="btn-secondaire" onClick={() => setAction('payer')}><Wallet size={15} aria-hidden /> Enregistrer un paiement</button>
                </PermissionGate>
              )}
              <button className="btn-primaire" onClick={() => window.print()}><Printer size={15} aria-hidden /> Imprimer</button>
            </>
          )}
        </div>
      </div>

      <article className="imprimable rounded border border-ligne bg-white p-6 sm:p-8">
        <header className="mb-6 flex flex-wrap justify-between gap-4 border-b border-ligne pb-4">
          <div>
            <p className="text-xl font-extrabold" style={{ fontStretch: '75%' }}>{f.magasinNom}</p>
            <p className="text-sm text-encre-douce">{f.type === 'TICKET' ? `Ticket de caisse · ${f.caisseNom ?? ''}` : 'Facture'}</p>
          </div>
          <div className="text-right">
            <h1>{f.numero ?? 'Brouillon'}</h1>
            <p className="text-sm text-encre-douce">{formatDateHeure(f.dateFacture)} · {f.vendeur}</p>
            <div className="mt-1"><BadgeFacture statut={f.statut} paiement={f.statutPaiement} /></div>
          </div>
        </header>
        <p className="mb-4 text-sm"><span className="text-encre-douce">Client : </span>{f.clientNom ?? 'Client comptoir'}</p>
        <table className="w-full text-sm">
          <thead className="border-b border-ligne text-left text-encre-douce">
            <tr><th className="py-2 font-semibold">Article</th><th className="py-2 text-right font-semibold">Quantité</th><th className="py-2 text-right font-semibold">Prix unitaire</th><th className="py-2 text-right font-semibold">Montant</th></tr>
          </thead>
          <tbody>
            {f.lignes?.map((l) => (
              <tr key={l.id} className="border-b border-ligne">
                <td className="py-2">{l.produitNom}</td>
                <td className="py-2 text-right tabular-nums">{formatNombre(l.quantite)} {l.conditionnement}</td>
                <td className="py-2 text-right tabular-nums">{formatMontant(l.prixUnitaire)}</td>
                <td className="py-2 text-right tabular-nums">{formatMontant(l.montant)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <dl className="ml-auto mt-4 w-72 space-y-1 text-sm">
          {f.remisePourcent > 0 && (
            <>
              <div className="flex justify-between"><dt>Sous-total</dt><dd className="tabular-nums">{formatMontant(brut)}</dd></div>
              <div className="flex justify-between"><dt>Remise {formatNombre(f.remisePourcent)} %</dt><dd className="tabular-nums">−{formatMontant(brut - f.montantTotal)}</dd></div>
            </>
          )}
          <div className="flex justify-between border-t border-ligne pt-1 text-lg font-bold"><dt>Total</dt><dd className="tabular-nums">{formatMontant(f.montantTotal)}</dd></div>
          {f.paiements?.map((p) => (
            <div key={p.id} className="flex justify-between text-encre-douce"><dt>{LIBELLES_MODE[p.mode]} · {formatDateHeure(p.date)}</dt><dd className="tabular-nums">{formatMontant(p.montant)}</dd></div>
          ))}
          {f.statut === 'VALIDEE' && f.resteAPayer > 0 && (
            <div className="flex justify-between font-semibold text-ambre-fonce"><dt>Reste à payer</dt><dd className="tabular-nums">{formatMontant(f.resteAPayer)}</dd></div>
          )}
        </dl>
      </article>

      {action === 'valider' && (
        <ConfirmDialog titre="Valider cette facture ?" message="Elle sera numérotée, ne pourra plus être modifiée, et la marchandise sortira du stock." libelleConfirmer="Valider la facture"
          onConfirm={() => executer(async () => setF(await factureService.valider(f.id)), 'Facture validée')} onClose={() => setAction(null)} />
      )}
      {action === 'supprimer' && (
        <ConfirmDialog titre="Supprimer ce brouillon ?" message="Le brouillon sera définitivement supprimé." libelleConfirmer="Supprimer" danger
          onConfirm={() => executer(async () => { await factureService.delete(f.id); navigate('/ventes/factures'); }, 'Brouillon supprimé')} onClose={() => setAction(null)} />
      )}
      {action === 'payer' && <PaiementFactureModal facture={f} onClose={() => setAction(null)} onPaye={(nf) => { setF(nf); setAction(null); showToast('Paiement enregistré'); }} />}
      {action === 'annuler' && (
        <Modal titre={`Annuler ${f.numero}`} onClose={() => setAction(null)} largeur="sm"
          pied={<><button className="btn-secondaire" onClick={() => setAction(null)}>Retour</button>
            <button className="btn-danger" disabled={!motif.trim()} onClick={() => executer(async () => { setF(await factureService.annuler(f.id, motif.trim())); setAction(null); }, 'Pièce annulée, stock réintégré')}>Annuler la pièce</button></>}>
          <p className="mb-3 text-sm text-encre-douce">Les articles reviennent en stock, dans leurs lots d’origine. Les paiements déjà encaissés devront être remboursés.</p>
          <label className="etiquette" htmlFor="motif-annulation">Motif (obligatoire)</label>
          <input id="motif-annulation" className="champ" value={motif} maxLength={150} onChange={(e) => setMotif(e.target.value)} />
        </Modal>
      )}
    </div>
  );
}
