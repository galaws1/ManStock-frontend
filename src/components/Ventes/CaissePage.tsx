import { LockKeyhole, Printer, Receipt } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useStock } from '../../context/StockContext';
import { ApiClientError } from '../../services/axiosConfig';
import { caisseService } from '../../services/domains/caisseService';
import { venteService } from '../../services/domains/venteService';
import type { Caisse } from '../../types/caisse';
import type { PaiementRequest } from '../../types/facture';
import { LIBELLES_MODE } from '../../types/facture';
import type { SessionCaisse, TicketResponse } from '../../types/vente';
import { formatDateHeure, formatMontant, parseNombre } from '../../utils/formatters';
import { totalLignes } from '../../utils/ventes';
import { Champ } from '../common/Champ';
import { ErreurGlobale } from '../common/ErreurGlobale';
import { Modal } from '../common/Modal';
import { ProduitPicker } from '../common/ProduitPicker';
import { ajouterArticle, LignesVenteEditeur, type LigneEdition } from './LignesVenteEditeur';
import { PaiementModal } from './PaiementModal';
import { TicketImprimable } from './TicketImprimable';

function OuvertureSession({ onOuverte }: { onOuverte: (s: SessionCaisse) => void }) {
  const { user } = useAuth();
  const [caisses, setCaisses] = useState<Caisse[]>([]);
  const [caisseId, setCaisseId] = useState('');
  const [fond, setFond] = useState('0');
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  useEffect(() => {
    caisseService
      .getPage({ page: 0, size: 100, tri: 'magasin', sens: 'asc', actif: true, magasinId: user?.magasinId })
      .then((p) => {
        setCaisses(p.content);
        if (p.content.length === 1) setCaisseId(String(p.content[0].id));
      })
      .catch(() => setErreur('Impossible de charger les caisses'));
  }, [user?.magasinId]);

  const ouvrir = async () => {
    const montant = parseNombre(fond);
    if (!caisseId) return setErreur('Choisissez une caisse');
    if (Number.isNaN(montant) || montant < 0) return setErreur('Fond de caisse invalide');
    setEnCours(true);
    setErreur(null);
    try {
      onOuverte(await venteService.ouvrir(Number(caisseId), montant));
    } catch (e) {
      setErreur(e instanceof ApiClientError ? e.message : 'Ouverture impossible');
    } finally {
      setEnCours(false);
    }
  };

  return (
    <div className="mx-auto max-w-md rounded border border-ligne bg-white p-6">
      <h1>Ouvrir la caisse</h1>
      <p className="mb-5 mt-1 text-sm text-encre-douce">Comptez le fond de caisse (espèces présentes dans le tiroir) avant de commencer.</p>
      <ErreurGlobale message={erreur} />
      <div className="space-y-4">
        <Champ label="Caisse" requis>
          {(p) => (
            <select {...p} value={caisseId} onChange={(e) => setCaisseId(e.target.value)}>
              <option value="">Choisir…</option>
              {caisses.map((c) => (
                <option key={c.id} value={c.id}>{c.nom} · {c.magasinNom}</option>
              ))}
            </select>
          )}
        </Champ>
        <Champ label="Fond de caisse" requis>
          {(p) => <input {...p} inputMode="decimal" value={fond} onChange={(e) => setFond(e.target.value)} />}
        </Champ>
      </div>
      <button className="btn-primaire mt-6 w-full py-2.5" onClick={ouvrir} disabled={enCours}>
        {enCours ? 'Ouverture…' : 'Ouvrir la session'}
      </button>
    </div>
  );
}

function ClotureModal({ session, onClose, onCloturee }: { session: SessionCaisse; onClose: () => void; onCloturee: (s: SessionCaisse) => void }) {
  const [compte, setCompte] = useState('');
  const [erreur, setErreur] = useState<string | null>(null);
  const [resultat, setResultat] = useState<SessionCaisse | null>(null);
  const [aJour, setAJour] = useState<SessionCaisse>(session);

  // Encaissements à jour (ventes faites depuis l'ouverture de la session).
  useEffect(() => {
    venteService.resume(session.id).then(setAJour).catch(() => undefined);
  }, [session.id]);

  const cloturer = async () => {
    const m = parseNombre(compte);
    if (Number.isNaN(m) || m < 0) return setErreur('Saisissez les espèces comptées');
    try {
      setResultat(await venteService.cloturer(session.id, m));
    } catch (e) {
      setErreur(e instanceof ApiClientError ? e.message : 'Clôture impossible');
    }
  };

  const s = resultat ?? aJour;
  return (
    <Modal
      titre={resultat ? 'Session clôturée' : 'Clôturer la caisse'}
      onClose={resultat ? () => onCloturee(resultat) : onClose}
      largeur="sm"
      pied={
        resultat ? (
          <button className="btn-primaire" onClick={() => onCloturee(resultat)}>Terminer</button>
        ) : (
          <>
            <button className="btn-secondaire" onClick={onClose}>Annuler</button>
            <button className="btn-primaire" onClick={cloturer}>Clôturer</button>
          </>
        )
      }
    >
      <ErreurGlobale message={erreur} />
      <dl className="space-y-1 text-sm">
        <div className="flex justify-between"><dt>Fond de caisse</dt><dd className="tabular-nums">{formatMontant(s.soldeOuverture)}</dd></div>
        {s.encaissements.map((e) => (
          <div key={e.mode} className="flex justify-between">
            <dt>{LIBELLES_MODE[e.mode]} ({e.nbTickets} ticket{e.nbTickets > 1 ? 's' : ''})</dt>
            <dd className="tabular-nums">{formatMontant(e.montant)}</dd>
          </div>
        ))}
        <div className="flex justify-between border-t border-ligne pt-1 font-semibold"><dt>Espèces attendues</dt><dd className="tabular-nums">{formatMontant(s.especesAttendues)}</dd></div>
      </dl>
      {resultat ? (
        <p className={`mt-4 rounded px-3 py-2 text-sm font-semibold ${resultat.ecart === 0 ? 'bg-succes-pale text-succes' : 'bg-alerte-pale text-alerte'}`}>
          {resultat.ecart === 0 ? 'Caisse juste.' : `Écart de caisse : ${formatMontant(resultat.ecart ?? 0)}`}
        </p>
      ) : (
        <div className="mt-4">
          <Champ label="Espèces comptées dans le tiroir" requis>
            {(p) => <input {...p} inputMode="decimal" value={compte} autoFocus onChange={(e) => setCompte(e.target.value)} />}
          </Champ>
        </div>
      )}
    </Modal>
  );
}

export function CaissePage() {
  const { showToast } = useStock();
  const [session, setSession] = useState<SessionCaisse | null | undefined>(undefined);
  const [lignes, setLignes] = useState<LigneEdition[]>([]);
  const [remise, setRemise] = useState('0');
  const [paiement, setPaiement] = useState(false);
  const [enCours, setEnCours] = useState(false);
  const [erreurVente, setErreurVente] = useState<string | null>(null);
  const [dernierTicket, setDernierTicket] = useState<TicketResponse | null>(null);
  const [cloture, setCloture] = useState(false);

  const charger = useCallback(() => {
    venteService.sessionCourante().then(setSession).catch(() => setSession(null));
  }, []);
  useEffect(charger, [charger]);

  const remiseNum = Math.min(100, Math.max(0, parseNombre(remise) || 0));
  const { brut, remise: montantRemise, total } = totalLignes(lignes, remiseNum);

  const vendre = async (paiements: PaiementRequest[]) => {
    if (!session) return;
    setEnCours(true);
    setErreurVente(null);
    try {
      const r = await venteService.vendre({
        sessionId: session.id,
        remisePourcent: remiseNum,
        lignes: lignes.map((l) => ({ produitId: l.produitId, paquetageId: l.paquetageId, quantite: l.quantite })),
        paiements,
      });
      setDernierTicket(r);
      setLignes([]);
      setRemise('0');
      setPaiement(false);
      showToast(`Ticket ${r.ticket.numero} enregistré${r.rendu > 0 ? ` · rendu ${formatMontant(r.rendu)}` : ''}`);
    } catch (e) {
      setErreurVente(e instanceof ApiClientError ? e.message : 'Vente impossible');
    } finally {
      setEnCours(false);
    }
  };

  if (session === undefined) return <p className="text-encre-douce">Chargement de la caisse…</p>;
  if (session === null) return <OuvertureSession onOuverte={setSession} />;

  return (
    <div>
      <div className="no-print mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1>{session.caisseNom}</h1>
          <p className="mt-0.5 text-sm text-encre-douce">
            {session.magasinNom} · ouverte le {formatDateHeure(session.dateOuverture)} par {session.caissier}
          </p>
        </div>
        <button className="btn-secondaire" onClick={() => setCloture(true)} disabled={lignes.length > 0} title={lignes.length ? 'Terminez ou videz le panier d’abord' : undefined}>
          <LockKeyhole size={16} aria-hidden /> Clôturer la caisse
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="no-print space-y-3">
          <ProduitPicker onChoix={(c) => setLignes((l) => ajouterArticle(l, c))} autoFocus />
          <LignesVenteEditeur lignes={lignes} onChange={setLignes} />
        </div>

        <aside className="space-y-4">
          <div className="no-print rounded border border-ligne bg-white p-4">
            <dl className="space-y-1.5 text-sm">
              <div className="flex justify-between"><dt>Sous-total</dt><dd className="tabular-nums">{formatMontant(brut)}</dd></div>
              <div className="flex items-center justify-between gap-2">
                <dt><label htmlFor="remise">Remise (%)</label></dt>
                <dd><input id="remise" className="champ w-20 py-1 text-right" inputMode="decimal" value={remise} onChange={(e) => setRemise(e.target.value)} /></dd>
              </div>
              {montantRemise > 0 && <div className="flex justify-between text-encre-douce"><dt>Remise</dt><dd className="tabular-nums">−{formatMontant(montantRemise)}</dd></div>}
              <div className="flex justify-between border-t border-ligne pt-2 text-2xl font-bold" style={{ fontStretch: '85%' }}>
                <dt>Total</dt>
                <dd className="tabular-nums">{formatMontant(total)}</dd>
              </div>
            </dl>
            <button className="btn-primaire mt-4 w-full py-3 text-base" disabled={lignes.length === 0} onClick={() => { setErreurVente(null); setPaiement(true); }}>
              <Receipt size={18} aria-hidden /> Encaisser
            </button>
            {lignes.length > 0 && (
              <button className="btn-discret mt-1 w-full" onClick={() => setLignes([])}>Vider le panier</button>
            )}
          </div>

          {dernierTicket && (
            <div>
              <div className="no-print mb-2 flex items-center justify-between">
                <p className="text-sm font-semibold">Dernier ticket</p>
                <button className="btn-discret" onClick={() => window.print()}>
                  <Printer size={15} aria-hidden /> Imprimer
                </button>
              </div>
              <TicketImprimable ticket={dernierTicket.ticket} rendu={dernierTicket.rendu} />
            </div>
          )}
        </aside>
      </div>

      {paiement && <PaiementModal total={total} enCours={enCours} erreur={erreurVente} onValider={vendre} onClose={() => setPaiement(false)} />}
      {cloture && (
        <ClotureModal
          session={session}
          onClose={() => setCloture(false)}
          onCloturee={() => {
            setCloture(false);
            setDernierTicket(null);
            setSession(null);
            showToast('Session de caisse clôturée');
          }}
        />
      )}
    </div>
  );
}
