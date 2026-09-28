import { KeyRound, Pencil, Plus, Search, UserCheck, UserX } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useStock } from '../../context/StockContext';
import { ApiClientError } from '../../services/axiosConfig';
import { magasinService } from '../../services/domains/magasinService';
import { roleService } from '../../services/domains/roleService';
import { utilisateurService } from '../../services/domains/utilisateurService';
import type { Option } from '../../types/common';
import type { Role } from '../../types/role';
import type { Utilisateur } from '../../types/utilisateur';
import { formatDateHeure, nomComplet } from '../../utils/formatters';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { DataTable, type Colonne } from '../common/DataTable';
import { PageEntete } from '../common/PageEntete';
import { Pagination } from '../common/Pagination';
import { usePagination } from '../../hooks/usePagination';
import { UtilisateurFormModal } from './UtilisateurFormModal';

type FiltreStatut = 'tous' | 'actifs' | 'inactifs';

export function UtilisateursPage() {
  const { user: moi } = useAuth();
  const { showToast, refreshKey } = useStock();
  const [roles, setRoles] = useState<Role[]>([]);
  const [magasins, setMagasins] = useState<Option[]>([]);
  const [recherche, setRecherche] = useState('');
  const [statut, setStatut] = useState<FiltreStatut>('actifs');
  const [edition, setEdition] = useState<Utilisateur | 'nouveau' | null>(null);
  const [aBasculer, setABasculer] = useState<Utilisateur | null>(null);
  const [aReinitialiser, setAReinitialiser] = useState<Utilisateur | null>(null);

  // Filtres envoyés au backend ; tout changement ramène à la première page.
  const filtres = useMemo(
    () => ({ recherche: recherche.trim(), actif: statut === 'tous' ? undefined : statut === 'actifs' }),
    [recherche, statut],
  );
  const liste = usePagination((p) => utilisateurService.getPage(p), filtres, {
    triInitial: 'nom',
    onErreur: (e) => showToast(e instanceof ApiClientError ? e.message : 'Chargement impossible', 'erreur'),
  });
  const { recharger } = liste;
  const charger = recharger;

  // Rafraîchissement global demandé par un autre écran (StockContext.triggerRefresh).
  useEffect(() => {
    if (refreshKey > 0) recharger();
  }, [refreshKey, recharger]);

  useEffect(() => {
    Promise.all([roleService.getAll(), magasinService.options()])
      .then(([r, m]) => {
        setRoles(r);
        setMagasins(m);
      })
      .catch(() => showToast('Impossible de charger les rôles et magasins', 'erreur'));
  }, [showToast]);

  const basculer = async () => {
    if (!aBasculer) return;
    try {
      const u = await utilisateurService.changerStatut(aBasculer.id, !aBasculer.actif);
      showToast(u.actif ? `Compte de ${nomComplet(u)} réactivé` : `Compte de ${nomComplet(u)} désactivé`);
      charger();
    } catch (e) {
      showToast(e instanceof ApiClientError ? e.message : 'Opération impossible', 'erreur');
    }
  };

  const reinitialiser = async () => {
    if (!aReinitialiser) return;
    try {
      await utilisateurService.reinitialiserMotDePasse(aReinitialiser.id);
      showToast(`Mot de passe de ${nomComplet(aReinitialiser)} réinitialisé`);
      charger();
    } catch (e) {
      showToast(e instanceof ApiClientError ? e.message : 'Réinitialisation impossible', 'erreur');
    }
  };

  const colonnes: Colonne<Utilisateur>[] = [
    {
      cle: 'nom',
      titre: 'Nom',
      tri: 'nom',
      rendu: (u) => (
        <div>
          <p className="font-medium">
            {nomComplet(u)}
            {u.id === moi?.id && <span className="ml-2 text-xs font-normal text-encre-douce">(vous)</span>}
          </p>
          <p className="text-xs text-encre-douce">{u.username}</p>
        </div>
      ),
    },
    { cle: 'role', titre: 'Rôle', tri: 'role', rendu: (u) => u.roleLibelle },
    { cle: 'magasin', titre: 'Magasin', tri: 'magasin', rendu: (u) => u.magasinNom ?? <span className="text-encre-douce">Tous</span> },
    {
      cle: 'statut',
      titre: 'Statut',
      tri: 'actif',
      rendu: (u) => (
        <div className="flex flex-wrap gap-1">
          {u.actif ? (
            <span className="rounded-sm bg-succes-pale px-2 py-0.5 text-xs font-medium text-succes">Actif</span>
          ) : (
            <span className="rounded-sm bg-ligne px-2 py-0.5 text-xs font-medium text-encre-douce">Désactivé</span>
          )}
          {u.doitChangerMotDePasse && (
            <span className="rounded-sm bg-ambre-pale px-2 py-0.5 text-xs font-medium text-ambre-fonce">Mot de passe à changer</span>
          )}
        </div>
      ),
    },
    { cle: 'maj', titre: 'Dernière modification', rendu: (u) => <span className="text-encre-douce">{formatDateHeure(u.updatedAt ?? u.createdAt)}</span> },
    {
      cle: 'actions',
      titre: 'Actions',
      className: 'w-56 text-right',
      rendu: (u) => (
        <div className="flex justify-end gap-1">
          <button className="btn-discret" onClick={() => setEdition(u)} aria-label={`Modifier ${u.username}`} title="Modifier">
            <Pencil size={16} />
          </button>
          <button
            className="btn-discret"
            onClick={() => setAReinitialiser(u)}
            aria-label={`Réinitialiser le mot de passe de ${u.username}`}
            title="Le mot de passe redevient l'identifiant, à changer à la prochaine connexion"
          >
            <KeyRound size={16} aria-hidden /> Réinitialiser
          </button>
          {u.id !== moi?.id && (
            <button
              className="btn-discret"
              onClick={() => setABasculer(u)}
              aria-label={u.actif ? `Désactiver ${u.username}` : `Réactiver ${u.username}`}
              title={u.actif ? 'Désactiver' : 'Réactiver'}
            >
              {u.actif ? <UserX size={16} /> : <UserCheck size={16} />}
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageEntete
        titre="Utilisateurs"
        description="Les comptes ne sont jamais supprimés : un compte désactivé ne peut plus se connecter mais reste visible dans l’historique."
        actions={
          <button className="btn-primaire" onClick={() => setEdition('nouveau')}>
            <Plus size={16} aria-hidden /> Nouvel utilisateur
          </button>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <label className="relative min-w-[16rem] flex-1 sm:max-w-sm">
          <span className="sr-only">Rechercher un utilisateur</span>
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-encre-douce" aria-hidden />
          <input className="champ pl-9" placeholder="Nom, prénom ou identifiant" value={recherche} onChange={(e) => setRecherche(e.target.value)} />
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
        cleLigne={(u) => u.id}
        chargement={liste.chargement}
        classeLigne={(u) => (u.actif ? '' : 'text-encre-douce')}
        triCourant={{ tri: liste.tri, sens: liste.sens }}
        onTrier={liste.trier}
        vide={recherche ? `Aucun utilisateur ne correspond à « ${recherche} ».` : 'Aucun utilisateur dans cette liste.'}
        pied={
          <Pagination
            resultat={liste.resultat}
            page={liste.page}
            onPage={liste.setPage}
            taille={liste.taille}
            onTaille={liste.setTaille}
          />
        }
      />

      {edition && (
        <UtilisateurFormModal
          utilisateur={edition === 'nouveau' ? undefined : edition}
          roles={roles}
          magasins={magasins}
          onClose={() => setEdition(null)}
          onSaved={(u) => {
            showToast(edition === 'nouveau' ? `Compte de ${nomComplet(u)} créé` : `Compte de ${nomComplet(u)} enregistré`);
            setEdition(null);
            charger();
          }}
        />
      )}
      {aBasculer && (
        <ConfirmDialog
          titre={aBasculer.actif ? 'Désactiver ce compte ?' : 'Réactiver ce compte ?'}
          message={
            aBasculer.actif
              ? `${nomComplet(aBasculer)} ne pourra plus se connecter. Son historique est conservé.`
              : `${nomComplet(aBasculer)} pourra de nouveau se connecter avec son mot de passe actuel.`
          }
          libelleConfirmer={aBasculer.actif ? 'Désactiver le compte' : 'Réactiver le compte'}
          danger={aBasculer.actif}
          onConfirm={basculer}
          onClose={() => setABasculer(null)}
        />
      )}
      {aReinitialiser && (
        <ConfirmDialog
          titre="Réinitialiser le mot de passe ?"
          message={`Le mot de passe de ${nomComplet(aReinitialiser)} deviendra son identifiant (« ${aReinitialiser.username} »). À sa prochaine connexion, il devra obligatoirement en choisir un nouveau.`}
          libelleConfirmer="Réinitialiser le mot de passe"
          onConfirm={reinitialiser}
          onClose={() => setAReinitialiser(null)}
        />
      )}
    </div>
  );
}
