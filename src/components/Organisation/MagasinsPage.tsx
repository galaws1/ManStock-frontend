import { MapPin, Pencil, Phone, Plus, Power, PowerOff, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useStock } from '../../context/StockContext';
import { usePagination } from '../../hooks/usePagination';
import { ApiClientError } from '../../services/axiosConfig';
import { magasinService } from '../../services/domains/magasinService';
import type { Magasin } from '../../types/magasin';
import { ROLES, ROLES_ORGANISATION } from '../../types/role';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { DataTable, type Colonne } from '../common/DataTable';
import { PageEntete } from '../common/PageEntete';
import { Pagination } from '../common/Pagination';
import { PermissionGate } from '../common/PermissionGate';
import { MagasinFormModal } from './MagasinFormModal';

type FiltreStatut = 'actifs' | 'inactifs' | 'tous';

export function MagasinsPage() {
  const { showToast } = useStock();
  const [recherche, setRecherche] = useState('');
  const [statut, setStatut] = useState<FiltreStatut>('actifs');
  const [edition, setEdition] = useState<Magasin | 'nouveau' | null>(null);
  const [aBasculer, setABasculer] = useState<Magasin | null>(null);

  const filtres = useMemo(
    () => ({ recherche: recherche.trim(), actif: statut === 'tous' ? undefined : statut === 'actifs' }),
    [recherche, statut],
  );
  const liste = usePagination((p) => magasinService.getPage(p), filtres, {
    triInitial: 'nom',
    onErreur: (e) => showToast(e instanceof ApiClientError ? e.message : 'Chargement impossible', 'erreur'),
  });

  const basculer = async () => {
    if (!aBasculer) return;
    try {
      const m = await magasinService.changerStatut(aBasculer.id, !aBasculer.actif);
      showToast(m.actif ? `Magasin « ${m.nom} » réactivé` : `Magasin « ${m.nom} » désactivé`);
      liste.recharger();
    } catch (e) {
      showToast(e instanceof ApiClientError ? e.message : 'Opération impossible', 'erreur');
    }
  };

  const colonnes: Colonne<Magasin>[] = [
    { cle: 'nom', titre: 'Magasin', tri: 'nom', rendu: (m) => <span className="font-medium">{m.nom}</span> },
    {
      cle: 'coordonnees',
      titre: 'Coordonnées',
      rendu: (m) =>
        m.adresse || m.telephone ? (
          <div className="space-y-0.5 text-encre-douce">
            {m.adresse && (
              <p className="flex items-center gap-1.5">
                <MapPin size={13} aria-hidden className="shrink-0" /> {m.adresse}
              </p>
            )}
            {m.telephone && (
              <p className="flex items-center gap-1.5 tabular-nums">
                <Phone size={13} aria-hidden className="shrink-0" /> {m.telephone}
              </p>
            )}
          </div>
        ) : (
          <span className="text-encre-douce">—</span>
        ),
    },
    {
      cle: 'utilisateurs',
      titre: 'Utilisateurs actifs',
      className: 'text-right',
      rendu: (m) => (m.nbUtilisateurs > 0 ? m.nbUtilisateurs : <span className="text-encre-douce">Aucun</span>),
    },
    {
      cle: 'statut',
      titre: 'Statut',
      tri: 'actif',
      rendu: (m) =>
        m.actif ? (
          <span className="rounded-sm bg-succes-pale px-2 py-0.5 text-xs font-medium text-succes">Actif</span>
        ) : (
          <span className="rounded-sm bg-ligne px-2 py-0.5 text-xs font-medium text-encre-douce">Désactivé</span>
        ),
    },
    {
      cle: 'actions',
      titre: 'Actions',
      className: 'w-28 text-right',
      rendu: (m) => (
        <PermissionGate roles={ROLES_ORGANISATION}>
          <div className="flex justify-end gap-1">
            <button className="btn-discret" onClick={() => setEdition(m)} aria-label={`Modifier ${m.nom}`} title="Modifier">
              <Pencil size={16} />
            </button>
            <button
              className="btn-discret"
              onClick={() => setABasculer(m)}
              aria-label={m.actif ? `Désactiver ${m.nom}` : `Réactiver ${m.nom}`}
              title={m.actif ? 'Désactiver' : 'Réactiver'}
            >
              {m.actif ? <PowerOff size={16} /> : <Power size={16} />}
            </button>
          </div>
        </PermissionGate>
      ),
    },
  ];

  const bloqueParUtilisateurs = aBasculer?.actif && aBasculer.nbUtilisateurs > 0;

  return (
    <div>
      <PageEntete
        titre="Magasins"
        description="Les points de vente et dépôts de l’entreprise. Un magasin n’est jamais supprimé : désactivé, il conserve son historique de stock et de ventes."
        actions={
          <PermissionGate roles={ROLES_ORGANISATION}>
            <button className="btn-primaire" onClick={() => setEdition('nouveau')}>
              <Plus size={16} aria-hidden /> Nouveau magasin
            </button>
          </PermissionGate>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <label className="relative min-w-[16rem] flex-1 sm:max-w-sm">
          <span className="sr-only">Rechercher un magasin</span>
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-encre-douce" aria-hidden />
          <input className="champ pl-9" placeholder="Nom, adresse ou téléphone" value={recherche} onChange={(e) => setRecherche(e.target.value)} />
        </label>
        <div role="group" aria-label="Filtrer par statut" className="inline-flex rounded border border-ligne bg-white p-0.5">
          {(['actifs', 'inactifs', 'tous'] as FiltreStatut[]).map((s) => (
            <button
              key={s}
              aria-pressed={statut === s}
              onClick={() => setStatut(s)}
              className={`rounded-sm px-3 py-1.5 text-sm ${statut === s ? 'bg-acier font-semibold text-white' : 'text-encre-douce hover:text-encre'}`}
            >
              {s === 'actifs' ? 'Actifs' : s === 'inactifs' ? 'Désactivés' : 'Tous'}
            </button>
          ))}
        </div>
      </div>

      <DataTable
        colonnes={colonnes}
        lignes={liste.lignes}
        cleLigne={(m) => m.id}
        chargement={liste.chargement}
        classeLigne={(m) => (m.actif ? '' : 'text-encre-douce')}
        triCourant={{ tri: liste.tri, sens: liste.sens }}
        onTrier={liste.trier}
        vide={recherche ? `Aucun magasin ne correspond à « ${recherche} ».` : 'Aucun magasin dans cette liste.'}
        pied={<Pagination resultat={liste.resultat} page={liste.page} onPage={liste.setPage} taille={liste.taille} onTaille={liste.setTaille} />}
      />

      {edition && (
        <MagasinFormModal
          magasin={edition === 'nouveau' ? undefined : edition}
          onClose={() => setEdition(null)}
          onSaved={(m) => {
            showToast(edition === 'nouveau' ? `Magasin « ${m.nom} » créé` : `Magasin « ${m.nom} » enregistré`);
            setEdition(null);
            liste.recharger();
          }}
        />
      )}

      {aBasculer &&
        (bloqueParUtilisateurs ? (
          <ConfirmDialog
            titre="Désactivation impossible pour l’instant"
            message={`${aBasculer.nbUtilisateurs} utilisateur(s) actif(s) sont rattachés à « ${aBasculer.nom} ». Un administrateur doit d’abord les réaffecter à un autre magasin (ou désactiver leur compte) depuis la page Utilisateurs.`}
            libelleConfirmer="Compris"
            information
            onConfirm={() => undefined}
            onClose={() => setABasculer(null)}
          />
        ) : (
          <ConfirmDialog
            titre={aBasculer.actif ? 'Désactiver ce magasin ?' : 'Réactiver ce magasin ?'}
            message={
              aBasculer.actif
                ? `« ${aBasculer.nom} » ne sera plus proposé pour les nouveaux utilisateurs, stocks et ventes. Son historique est conservé.`
                : `« ${aBasculer.nom} » redeviendra disponible dans toute l’application.`
            }
            libelleConfirmer={aBasculer.actif ? 'Désactiver le magasin' : 'Réactiver le magasin'}
            danger={aBasculer.actif}
            onConfirm={basculer}
            onClose={() => setABasculer(null)}
          />
        ))}

      <PermissionGate roles={[ROLES.ADMIN]}>
        <p className="mt-4 text-sm text-encre-douce">
          Pour rattacher un employé à un magasin, passez par la page <Link to="/admin/utilisateurs" className="underline">Utilisateurs</Link>.
        </p>
      </PermissionGate>
    </div>
  );
}
