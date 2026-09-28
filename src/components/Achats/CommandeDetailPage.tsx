import { ArrowLeft, Ban, CheckCircle2, PackageCheck, Pencil, Send } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useStock } from '../../context/StockContext';
import { ApiClientError } from '../../services/axiosConfig';
import { commandeService } from '../../services/domains/commandeService';
import type { Commande, ReceptionRequest } from '../../types/commande';
import { ROLES_APPROVISIONNEMENT, ROLES_RECEPTION, ROLES_VALIDATION_COMMANDE } from '../../types/role';
import { formatDateHeure, formatMontant, formatNombre, parseNombre, versSaisie } from '../../utils/formatters';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { ErreurGlobale } from '../common/ErreurGlobale';
import { Modal } from '../common/Modal';
import { PermissionGate } from '../common/PermissionGate';
import { BadgeCommande } from '../Ventes/badges';

interface SaisieReception {
  ligneId: number;
  produitNom: string;
  perissable: boolean;
  quantite: string;
  numeroLot: string;
  datePeremption: string;
}

/** Contrôles de réception (mêmes règles que le serveur : péremption obligatoire si périssable). */
export function validerReception(saisies: SaisieReception[]): { erreur?: string; payload?: ReceptionRequest } {
  const lignes = [];
  for (const s of saisies) {
    const q = parseNombre(s.quantite);
    if (Number.isNaN(q) || q < 0) return { erreur: `Quantité invalide pour « ${s.produitNom} »` };
    if (q > 0 && s.perissable && !s.datePeremption) return { erreur: `« ${s.produitNom} » est périssable : indiquez la date de péremption` };
    lignes.push({ ligneId: s.ligneId, quantiteRecue: q, numeroLot: s.numeroLot.trim() || undefined, datePeremption: s.datePeremption || undefined });
  }
  if (lignes.every((l) => l.quantiteRecue === 0)) return { erreur: 'Aucune quantité reçue' };
  return { payload: { lignes } };
}

function ReceptionModal({ commande, onClose, onRecue }: { commande: Commande; onClose: () => void; onRecue: (c: Commande) => void }) {
  const [saisies, setSaisies] = useState<SaisieReception[]>(
    (commande.lignes ?? []).map((l) => ({ ligneId: l.id, produitNom: l.produitNom, perissable: l.perissable, quantite: versSaisie(l.quantite), numeroLot: '', datePeremption: '' })),
  );
  const [erreur, setErreur] = useState<string | null>(null);
  const maj = (i: number, patch: Partial<SaisieReception>) => setSaisies(saisies.map((s, j) => (j === i ? { ...s, ...patch } : s)));
  const valider = async () => {
    const v = validerReception(saisies);
    if (v.erreur) return setErreur(v.erreur);
    try {
      onRecue(await commandeService.recevoir(commande.id, v.payload!));
    } catch (e) {
      setErreur(e instanceof ApiClientError ? e.message : 'Réception impossible');
    }
  };
  return (
    <Modal titre={`Réceptionner ${commande.reference}`} onClose={onClose}
      pied={<><button className="btn-secondaire" onClick={onClose}>Annuler</button><button className="btn-primaire" onClick={valider}>Valider la réception</button></>}>
      <ErreurGlobale message={erreur} />
      <p className="mb-3 text-sm text-encre-douce">Saisissez les quantités réellement reçues. Les produits périssables exigent une date de péremption.</p>
      <div className="space-y-3">
        {saisies.map((s, i) => (
          <fieldset key={s.ligneId} className="rounded border border-ligne p-3">
            <legend className="px-1 text-sm font-semibold">{s.produitNom}{s.perissable && <span className="ml-2 text-xs font-medium text-ambre-fonce">périssable</span>}</legend>
            <div className="grid gap-2 sm:grid-cols-3">
              <label className="text-xs">Quantité reçue<input className="champ mt-0.5" inputMode="decimal" value={s.quantite} onChange={(e) => maj(i, { quantite: e.target.value })} /></label>
              <label className="text-xs">N° de lot<input className="champ mt-0.5" value={s.numeroLot} maxLength={60} onChange={(e) => maj(i, { numeroLot: e.target.value })} /></label>
              <label className="text-xs">Péremption<input type="date" className="champ mt-0.5" value={s.datePeremption} onChange={(e) => maj(i, { datePeremption: e.target.value })} /></label>
            </div>
          </fieldset>
        ))}
      </div>
    </Modal>
  );
}

export function CommandeDetailPage() {
  const id = Number(useParams().id);
  const { showToast } = useStock();
  const [c, setC] = useState<Commande | null>(null);
  const [action, setAction] = useState<'soumettre' | 'valider' | 'annuler' | 'recevoir' | null>(null);

  const charger = useCallback(() => {
    commandeService.getById(id).then(setC).catch(() => showToast('Commande introuvable', 'erreur'));
  }, [id, showToast]);
  useEffect(charger, [charger]);

  const executer = async (fn: () => Promise<Commande>, succes: string) => {
    try {
      setC(await fn());
      showToast(succes);
    } catch (e) {
      showToast(e instanceof ApiClientError ? e.message : 'Opération impossible', 'erreur');
    }
  };

  if (!c) return <p className="text-encre-douce">Chargement…</p>;
  const ouverte = c.statut !== 'RECUE' && c.statut !== 'ANNULEE';

  return (
    <div>
      <Link to="/achats/commandes" className="mb-3 inline-flex items-center gap-1 text-sm text-encre-douce hover:text-encre"><ArrowLeft size={14} aria-hidden /> Commandes</Link>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1>{c.reference} · {c.fournisseurNom}</h1>
          <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-encre-douce">
            <BadgeCommande statut={c.statut} /> {c.magasinNom} · créée le {formatDateHeure(c.dateCommande)} par {c.createdBy}
            {c.validePar && <> · validée par {c.validePar}</>}
            {c.dateReception && <> · reçue le {formatDateHeure(c.dateReception)}</>}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {ouverte && <PermissionGate roles={ROLES_APPROVISIONNEMENT}><button className="btn-discret hover:!text-alerte" onClick={() => setAction('annuler')}><Ban size={15} aria-hidden /> Annuler</button></PermissionGate>}
          {c.statut === 'BROUILLON' && (
            <PermissionGate roles={ROLES_APPROVISIONNEMENT}>
              <Link to={`/achats/commandes/${c.id}/modifier`} className="btn-secondaire"><Pencil size={15} aria-hidden /> Modifier</Link>
              <button className="btn-primaire" onClick={() => setAction('soumettre')}><Send size={15} aria-hidden /> Soumettre</button>
            </PermissionGate>
          )}
          {c.statut === 'EN_ATTENTE_VALIDATION' && (
            <PermissionGate roles={ROLES_VALIDATION_COMMANDE}><button className="btn-primaire" onClick={() => setAction('valider')}><CheckCircle2 size={15} aria-hidden /> Valider la commande</button></PermissionGate>
          )}
          {c.statut === 'VALIDEE' && (
            <PermissionGate roles={ROLES_RECEPTION}><button className="btn-primaire" onClick={() => setAction('recevoir')}><PackageCheck size={15} aria-hidden /> Réceptionner</button></PermissionGate>
          )}
        </div>
      </div>
      {c.statut === 'EN_ATTENTE_VALIDATION' && (
        <p className="mb-4 rounded border-l-4 border-ambre bg-ambre-pale px-3 py-2 text-sm">Montant supérieur au seuil : cette commande attend la validation d’un directeur.</p>
      )}
      <div className="overflow-x-auto rounded border border-ligne bg-white">
        <table className="w-full min-w-[34rem] text-sm">
          <thead className="border-b border-ligne bg-papier text-left text-encre-douce">
            <tr><th className="px-3 py-2 font-semibold">Produit</th><th className="px-3 py-2 text-right font-semibold">Commandé</th>{c.statut === 'RECUE' && <th className="px-3 py-2 text-right font-semibold">Reçu</th>}<th className="px-3 py-2 text-right font-semibold">Prix unitaire</th><th className="px-3 py-2 text-right font-semibold">Montant</th></tr>
          </thead>
          <tbody>
            {c.lignes?.map((l) => (
              <tr key={l.id} className="border-b border-ligne last:border-0">
                <td className="px-3 py-2 font-medium">{l.produitNom}</td>
                <td className="px-3 py-2 text-right tabular-nums">{formatNombre(l.quantite)} {l.uniteSymbole}</td>
                {c.statut === 'RECUE' && <td className={`px-3 py-2 text-right tabular-nums ${l.quantiteRecue !== l.quantite ? 'text-ambre-fonce' : ''}`}>{formatNombre(l.quantiteRecue ?? 0)} {l.uniteSymbole}</td>}
                <td className="px-3 py-2 text-right tabular-nums">{formatMontant(l.prixUnitaire)}</td>
                <td className="px-3 py-2 text-right tabular-nums">{formatMontant(l.montant)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot><tr><td colSpan={c.statut === 'RECUE' ? 4 : 3} className="px-3 py-2 text-right font-semibold">Total</td><td className="px-3 py-2 text-right font-bold tabular-nums">{formatMontant(c.montantTotal)}</td></tr></tfoot>
        </table>
      </div>

      {action === 'soumettre' && (
        <ConfirmDialog titre="Soumettre la commande ?" libelleConfirmer="Soumettre"
          message={c.validationRequise ? 'Son montant dépasse le seuil : elle devra être validée par un directeur.' : 'Elle sera validée et prête à être réceptionnée. Elle ne sera plus modifiable.'}
          onConfirm={() => executer(() => commandeService.soumettre(c.id), 'Commande soumise')} onClose={() => setAction(null)} />
      )}
      {action === 'valider' && (
        <ConfirmDialog titre="Valider la commande ?" message={`Montant : ${formatMontant(c.montantTotal)}.`} libelleConfirmer="Valider"
          onConfirm={() => executer(() => commandeService.valider(c.id), 'Commande validée')} onClose={() => setAction(null)} />
      )}
      {action === 'annuler' && (
        <ConfirmDialog titre="Annuler la commande ?" message="Aucun stock n’a encore été reçu : l’annulation n’a pas d’effet sur le stock." libelleConfirmer="Annuler la commande" danger
          onConfirm={() => executer(() => commandeService.annuler(c.id), 'Commande annulée')} onClose={() => setAction(null)} />
      )}
      {action === 'recevoir' && <ReceptionModal commande={c} onClose={() => setAction(null)} onRecue={(nc) => { setC(nc); setAction(null); showToast('Réception enregistrée : stock mis à jour'); }} />}
    </div>
  );
}
