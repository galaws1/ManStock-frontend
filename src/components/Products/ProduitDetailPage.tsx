import { ArrowLeft, Pencil, Plus, Power, PowerOff, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useStock } from '../../context/StockContext';
import { ApiClientError } from '../../services/axiosConfig';
import { paquetageService, produitService } from '../../services/domains/produitService';
import type { Paquetage, Produit } from '../../types/produit';
import { ROLES_CATALOGUE } from '../../types/role';
import { formatMontant, formatNombre } from '../../utils/formatters';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { DataTable, type Colonne } from '../common/DataTable';
import { PermissionGate } from '../common/PermissionGate';
import { StatutBadge } from '../common/StatutBadge';
import { ConversionCalculateur } from './ConversionCalculateur';
import { PaquetageFormModal } from './PaquetageFormModal';
import { ProduitFormModal } from './ProduitFormModal';

function Info({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-encre-douce">{label}</dt>
      <dd className="mt-0.5 font-medium">{children}</dd>
    </div>
  );
}

export function ProduitDetailPage() {
  const id = Number(useParams().id);
  const { showToast } = useStock();
  const [produit, setProduit] = useState<Produit | null>(null);
  const [paquetages, setPaquetages] = useState<Paquetage[]>([]);
  const [introuvable, setIntrouvable] = useState(false);
  const [editionProduit, setEditionProduit] = useState(false);
  const [basculer, setBasculer] = useState(false);
  const [editionPaquetage, setEditionPaquetage] = useState<Paquetage | 'nouveau' | null>(null);
  const [aSupprimer, setASupprimer] = useState<Paquetage | null>(null);

  const charger = useCallback(async () => {
    try {
      const [p, pq] = await Promise.all([produitService.getById(id), produitService.paquetages(id)]);
      setProduit(p);
      setPaquetages(pq);
    } catch (e) {
      if (e instanceof ApiClientError && e.status === 404) setIntrouvable(true);
      else showToast('Chargement impossible', 'erreur');
    }
  }, [id, showToast]);

  useEffect(() => {
    charger();
  }, [charger]);

  if (introuvable) {
    return (
      <div className="rounded border border-ligne bg-white p-8">
        <h1>Produit introuvable</h1>
        <Link to="/catalogue/produits" className="btn-secondaire mt-4">Retour aux produits</Link>
      </div>
    );
  }
  if (!produit) return <p className="text-encre-douce">Chargement…</p>;

  const prixEffectif = (p: Paquetage) => p.prixVente ?? produit.prixVente * p.quantiteUniteBase;
  const marge = produit.prixVente - produit.prixAchat;

  const colonnes: Colonne<Paquetage>[] = [
    { cle: 'nom', titre: 'Conditionnement', rendu: (p) => <span className="font-medium">{p.nom}</span> },
    { cle: 'contenu', titre: 'Contenu', className: 'text-right', rendu: (p) => `${formatNombre(p.quantiteUniteBase)} ${produit.uniteBaseSymbole}` },
    { cle: 'code', titre: 'Code-barre', rendu: (p) => (p.codeBarre ? <span className="font-mono text-sm">{p.codeBarre}</span> : <span className="text-encre-douce">—</span>) },
    {
      cle: 'prix',
      titre: 'Prix de vente',
      className: 'text-right',
      rendu: (p) => (
        <span className="tabular-nums">
          {formatMontant(prixEffectif(p))}
          {p.prixVente === undefined || p.prixVente === null ? <span className="block text-xs text-encre-douce">calculé</span> : null}
        </span>
      ),
    },
    {
      cle: 'unitaire',
      titre: `Prix par ${produit.uniteBaseSymbole}`,
      className: 'text-right',
      rendu: (p) => {
        const u = prixEffectif(p) / p.quantiteUniteBase;
        const remise = produit.prixVente > 0 ? Math.round((1 - u / produit.prixVente) * 100) : 0;
        return (
          <span className="tabular-nums">
            {formatMontant(u)}
            {remise > 0 && <span className="block text-xs text-succes">−{remise} %</span>}
          </span>
        );
      },
    },
    {
      cle: 'actions',
      titre: 'Actions',
      className: 'w-24 text-right',
      rendu: (p) => (
        <PermissionGate roles={ROLES_CATALOGUE}>
          <div className="flex justify-end gap-1">
            <button className="btn-discret" onClick={() => setEditionPaquetage(p)} aria-label={`Modifier ${p.nom}`} title="Modifier">
              <Pencil size={16} />
            </button>
            <button className="btn-discret hover:!bg-alerte-pale hover:!text-alerte" onClick={() => setASupprimer(p)} aria-label={`Supprimer ${p.nom}`} title="Supprimer">
              <Trash2 size={16} />
            </button>
          </div>
        </PermissionGate>
      ),
    },
  ];

  return (
    <div>
      <Link to="/catalogue/produits" className="mb-3 inline-flex items-center gap-1 text-sm text-encre-douce hover:text-encre">
        <ArrowLeft size={14} aria-hidden /> Produits
      </Link>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1>{produit.nom}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-encre-douce">
            <StatutBadge actif={produit.actif} />
            {produit.perissable && <span className="rounded-sm bg-ambre-pale px-2 py-0.5 text-xs font-medium text-ambre-fonce">Périssable</span>}
            <span>{produit.familleNom} › {produit.categorieNom}</span>
          </div>
        </div>
        <PermissionGate roles={ROLES_CATALOGUE}>
          <div className="flex gap-2">
            <button className="btn-secondaire" onClick={() => setBasculer(true)}>
              {produit.actif ? <PowerOff size={16} aria-hidden /> : <Power size={16} aria-hidden />}
              {produit.actif ? 'Désactiver' : 'Réactiver'}
            </button>
            <button className="btn-primaire" onClick={() => setEditionProduit(true)}>
              <Pencil size={16} aria-hidden /> Modifier
            </button>
          </div>
        </PermissionGate>
      </div>

      <dl className="mb-8 grid gap-x-6 gap-y-4 rounded border border-ligne bg-white p-5 sm:grid-cols-3 lg:grid-cols-4">
        <Info label="Code-barre">{produit.codeBarre ? <span className="font-mono">{produit.codeBarre}</span> : '—'}</Info>
        <Info label="Unité de base">{produit.uniteBaseNom} ({produit.uniteBaseSymbole})</Info>
        <Info label="Prix d’achat">{formatMontant(produit.prixAchat)}</Info>
        <Info label={`Prix de vente / ${produit.uniteBaseSymbole}`}>{formatMontant(produit.prixVente)}</Info>
        <Info label="Marge unitaire">
          <span className={marge < 0 ? 'text-alerte' : ''}>{formatMontant(marge)}</span>
        </Info>
        <Info label="Seuil d’alerte">{formatNombre(produit.seuilAlerte)} {produit.uniteBaseSymbole}</Info>
        <Info label="Alerte péremption">{produit.perissable ? `${produit.delaiAlertePeremptionJours} jours avant` : 'Non concerné'}</Info>
      </dl>

      <section className="mb-8">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2>Conditionnements</h2>
            <p className="mt-0.5 text-sm text-encre-douce">Formats de vente et d’achat : chacun est converti en {produit.uniteBaseSymbole} pour le stock.</p>
          </div>
          <PermissionGate roles={ROLES_CATALOGUE}>
            <button className="btn-secondaire" onClick={() => setEditionPaquetage('nouveau')}>
              <Plus size={16} aria-hidden /> Ajouter un conditionnement
            </button>
          </PermissionGate>
        </div>
        <DataTable
          colonnes={colonnes}
          lignes={paquetages}
          cleLigne={(p) => p.id}
          vide={`Vendu uniquement à l’unité (${produit.uniteBaseSymbole}). Ajoutez un carton, une palette… si besoin.`}
        />
      </section>

      <section>
        <h2 className="mb-1">Conversions</h2>
        <p className="mb-3 text-sm text-encre-douce">
          Calculez l’équivalence entre formats. Le déconditionnement réel du stock (ouvrir un carton) se fera depuis les mouvements de stock.
        </p>
        <ConversionCalculateur key={paquetages.map((p) => `${p.id}:${p.quantiteUniteBase}`).join(',')} produit={produit} paquetages={paquetages} />
      </section>

      {editionProduit && (
        <ProduitFormModal
          produit={produit}
          onClose={() => setEditionProduit(false)}
          onSaved={(p) => {
            showToast(`« ${p.nom} » enregistré`);
            setEditionProduit(false);
            charger();
          }}
        />
      )}
      {basculer && (
        <ConfirmDialog
          titre={produit.actif ? 'Désactiver ce produit ?' : 'Réactiver ce produit ?'}
          message={produit.actif ? 'Il ne sera plus proposé à la vente ni en commande. Son historique est conservé.' : 'Il redeviendra disponible à la vente.'}
          libelleConfirmer={produit.actif ? 'Désactiver le produit' : 'Réactiver le produit'}
          danger={produit.actif}
          onConfirm={async () => {
            try {
              const p = await produitService.changerStatut(produit.id, !produit.actif);
              setProduit(p);
              showToast(p.actif ? 'Produit réactivé' : 'Produit désactivé');
            } catch (e) {
              showToast(e instanceof ApiClientError ? e.message : 'Opération impossible', 'erreur');
            }
          }}
          onClose={() => setBasculer(false)}
        />
      )}
      {editionPaquetage && (
        <PaquetageFormModal
          produit={produit}
          paquetage={editionPaquetage === 'nouveau' ? undefined : editionPaquetage}
          onClose={() => setEditionPaquetage(null)}
          onSaved={(p) => {
            showToast(editionPaquetage === 'nouveau' ? `« ${p.nom} » ajouté` : `« ${p.nom} » enregistré`);
            setEditionPaquetage(null);
            charger();
          }}
        />
      )}
      {aSupprimer && (
        <ConfirmDialog
          titre="Supprimer ce conditionnement ?"
          message={`« ${aSupprimer.nom} » sera supprimé. C’est impossible s’il figure déjà sur une facture.`}
          libelleConfirmer="Supprimer"
          danger
          onConfirm={async () => {
            try {
              await paquetageService.delete(aSupprimer.id);
              showToast(`« ${aSupprimer.nom} » supprimé`);
              charger();
            } catch (e) {
              showToast(e instanceof ApiClientError ? e.message : 'Suppression impossible', 'erreur');
            }
          }}
          onClose={() => setASupprimer(null)}
        />
      )}
    </div>
  );
}
