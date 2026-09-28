import { Mail, Pencil, Phone, Plus, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useStock } from '../../context/StockContext';
import { usePagination } from '../../hooks/usePagination';
import { ApiClientError } from '../../services/axiosConfig';
import { clientService, fournisseurService } from '../../services/domains/partenaireService';
import type { Fournisseur } from '../../types/partenaire';
import { ROLES_APPROVISIONNEMENT, ROLES_CLIENTS } from '../../types/role';
import { sanitizeText, TELEPHONE_PATTERN } from '../../utils/security';
import { Champ } from '../common/Champ';
import { ChampRecherche } from '../common/ChampRecherche';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { DataTable, type Colonne } from '../common/DataTable';
import { ErreurGlobale } from '../common/ErreurGlobale';
import { Modal } from '../common/Modal';
import { PageEntete } from '../common/PageEntete';
import { Pagination } from '../common/Pagination';
import { PermissionGate } from '../common/PermissionGate';

/** Fournisseur ou client : même forme (l'adresse n'existe que pour les fournisseurs). */
type Partenaire = Fournisseur;
type Genre = 'fournisseurs' | 'clients';

const CONFIG = {
  fournisseurs: { titre: 'Fournisseurs', un: 'fournisseur', service: fournisseurService, roles: ROLES_APPROVISIONNEMENT, adresse: true,
    description: 'Les fournisseurs de vos commandes d’approvisionnement.' },
  clients: { titre: 'Clients', un: 'client', service: clientService, roles: ROLES_CLIENTS, adresse: false,
    description: 'Clients identifiés sur les factures. Les ventes au comptoir n’exigent pas de client.' },
};

export function validerPartenaire(f: { nom: string; telephone: string; email: string }): Record<string, string> {
  const e: Record<string, string> = {};
  if (!sanitizeText(f.nom)) e.nom = 'Le nom est obligatoire';
  if (f.telephone.trim() && !TELEPHONE_PATTERN.test(f.telephone.trim())) e.telephone = 'Téléphone invalide';
  if (f.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim())) e.email = 'Adresse e-mail invalide';
  return e;
}

function PartenaireModal({ genre, partenaire, onClose, onSaved }: { genre: Genre; partenaire?: Partenaire; onClose: () => void; onSaved: (p: Partenaire) => void }) {
  const cfg = CONFIG[genre];
  const [f, setF] = useState({ nom: partenaire?.nom ?? '', contact: partenaire?.contact ?? '', telephone: partenaire?.telephone ?? '', email: partenaire?.email ?? '', adresse: partenaire?.adresse ?? '' });
  const [erreurs, setErreurs] = useState<Record<string, string>>({});
  const [erreurGlobale, setErreurGlobale] = useState<string | null>(null);
  const maj = (k: keyof typeof f) => (e: { target: { value: string } }) => setF((p) => ({ ...p, [k]: e.target.value }));
  const enregistrer = async () => {
    const err = validerPartenaire(f);
    setErreurs(err);
    if (Object.keys(err).length) return;
    const payload = { nom: sanitizeText(f.nom), contact: sanitizeText(f.contact) || undefined, telephone: f.telephone.trim() || undefined,
      email: f.email.trim() || undefined, ...(cfg.adresse ? { adresse: sanitizeText(f.adresse) || undefined } : {}) };
    try {
      const svc = cfg.service as typeof fournisseurService;
      onSaved(partenaire ? await svc.update(partenaire.id, payload) : await svc.create(payload));
    } catch (e) {
      if (e instanceof ApiClientError) {
        if (Object.keys(e.fieldErrors).length) setErreurs(e.fieldErrors);
        else setErreurGlobale(e.message);
      }
    }
  };
  return (
    <Modal titre={partenaire ? `Modifier ${partenaire.nom}` : `Nouveau ${cfg.un}`} onClose={onClose}
      pied={<><button className="btn-secondaire" onClick={onClose}>Annuler</button><button className="btn-primaire" onClick={enregistrer}>Enregistrer</button></>}>
      <ErreurGlobale message={erreurGlobale} />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2"><Champ label="Nom" requis erreur={erreurs.nom}>{(p) => <input {...p} value={f.nom} maxLength={150} onChange={maj('nom')} />}</Champ></div>
        <Champ label="Personne à contacter" erreur={erreurs.contact}>{(p) => <input {...p} value={f.contact} maxLength={100} onChange={maj('contact')} />}</Champ>
        <Champ label="Téléphone" erreur={erreurs.telephone}>{(p) => <input {...p} type="tel" value={f.telephone} maxLength={30} onChange={maj('telephone')} />}</Champ>
        <div className={cfg.adresse ? '' : 'sm:col-span-2'}><Champ label="E-mail" erreur={erreurs.email}>{(p) => <input {...p} type="email" value={f.email} maxLength={120} onChange={maj('email')} />}</Champ></div>
        {cfg.adresse && <Champ label="Adresse" erreur={erreurs.adresse}>{(p) => <input {...p} value={f.adresse} maxLength={255} onChange={maj('adresse')} />}</Champ>}
      </div>
    </Modal>
  );
}

export function PartenairesPage({ genre }: { genre: Genre }) {
  const cfg = CONFIG[genre];
  const { showToast } = useStock();
  const [recherche, setRecherche] = useState('');
  const [edition, setEdition] = useState<Partenaire | 'nouveau' | null>(null);
  const [aSupprimer, setASupprimer] = useState<Partenaire | null>(null);
  const filtres = useMemo(() => ({ recherche: recherche.trim(), genre }), [recherche, genre]);
  const liste = usePagination((p) => (cfg.service as typeof fournisseurService).getPage({ ...p, genre: undefined }), filtres, {
    triInitial: 'nom',
    onErreur: (e) => showToast(e instanceof ApiClientError ? e.message : 'Chargement impossible', 'erreur'),
  });

  const colonnes: Colonne<Partenaire>[] = [
    { cle: 'nom', titre: 'Nom', tri: 'nom', rendu: (p) => <span className="font-medium">{p.nom}{p.contact && <span className="block text-xs font-normal text-encre-douce">{p.contact}</span>}</span> },
    {
      cle: 'coord', titre: 'Coordonnées',
      rendu: (p) => (
        <div className="space-y-0.5 text-encre-douce">
          {p.telephone && <p className="flex items-center gap-1.5"><Phone size={13} aria-hidden /> {p.telephone}</p>}
          {p.email && <p className="flex items-center gap-1.5"><Mail size={13} aria-hidden /> {p.email}</p>}
          {!p.telephone && !p.email && '—'}
        </div>
      ),
    },
    ...(cfg.adresse ? [{ cle: 'adresse', titre: 'Adresse', rendu: (p: Partenaire) => p.adresse ?? <span className="text-encre-douce">—</span> }] : []),
    {
      cle: 'actions', titre: 'Actions', className: 'w-24 text-right',
      rendu: (p) => (
        <PermissionGate roles={cfg.roles}>
          <div className="flex justify-end gap-1">
            <button className="btn-discret" aria-label={`Modifier ${p.nom}`} onClick={() => setEdition(p)}><Pencil size={16} /></button>
            <button className="btn-discret hover:!bg-alerte-pale hover:!text-alerte" aria-label={`Supprimer ${p.nom}`} onClick={() => setASupprimer(p)}><Trash2 size={16} /></button>
          </div>
        </PermissionGate>
      ),
    },
  ];

  return (
    <div>
      <PageEntete titre={cfg.titre} description={cfg.description}
        actions={<PermissionGate roles={cfg.roles}><button className="btn-primaire" onClick={() => setEdition('nouveau')}><Plus size={16} aria-hidden /> Nouveau {cfg.un}</button></PermissionGate>} />
      <div className="mb-4"><ChampRecherche valeur={recherche} onChange={setRecherche} placeholder="Nom, contact, téléphone ou e-mail" label={`Rechercher un ${cfg.un}`} /></div>
      <DataTable colonnes={colonnes} lignes={liste.lignes} cleLigne={(p) => p.id} chargement={liste.chargement}
        triCourant={{ tri: liste.tri, sens: liste.sens }} onTrier={liste.trier} vide={`Aucun ${cfg.un}.`}
        pied={<Pagination resultat={liste.resultat} page={liste.page} onPage={liste.setPage} taille={liste.taille} onTaille={liste.setTaille} />} />
      {edition && (
        <PartenaireModal genre={genre} partenaire={edition === 'nouveau' ? undefined : edition} onClose={() => setEdition(null)}
          onSaved={(p) => { showToast(`« ${p.nom} » enregistré`); setEdition(null); liste.recharger(); }} />
      )}
      {aSupprimer && (
        <ConfirmDialog titre={`Supprimer ce ${cfg.un} ?`} message={`« ${aSupprimer.nom} » sera supprimé. C’est impossible s’il figure déjà sur une commande ou une facture.`}
          libelleConfirmer="Supprimer" danger onClose={() => setASupprimer(null)}
          onConfirm={async () => {
            try { await cfg.service.delete(aSupprimer.id); showToast(`« ${aSupprimer.nom} » supprimé`); liste.recharger(); }
            catch (e) { showToast(e instanceof ApiClientError ? e.message : 'Suppression impossible', 'erreur'); }
          }} />
      )}
    </div>
  );
}
