import { useState } from 'react';
import { ApiClientError } from '../../services/axiosConfig';
import { utilisateurService } from '../../services/domains/utilisateurService';
import type { Option } from '../../types/common';
import type { Role } from '../../types/role';
import type { Utilisateur } from '../../types/utilisateur';
import { passwordProblem, sanitizeText, USERNAME_PATTERN } from '../../utils/security';
import { Champ } from '../common/Champ';
import { Modal } from '../common/Modal';

interface Props {
  utilisateur?: Utilisateur;
  roles: Role[];
  /** Magasins ACTIFS (GET /api/magasins/options). */
  magasins: Option[];
  onClose: () => void;
  onSaved: (u: Utilisateur) => void;
}

interface Formulaire {
  nom: string;
  prenom: string;
  username: string;
  motDePasse: string;
  roleId: string;
  magasinId: string;
}

export function validerUtilisateur(f: Formulaire, creation: boolean): Record<string, string> {
  const e: Record<string, string> = {};
  if (!sanitizeText(f.nom)) e.nom = 'Le nom est obligatoire';
  if (!USERNAME_PATTERN.test(f.username.trim())) e.username = '3 à 60 caractères : lettres, chiffres, point, tiret ou _';
  if (creation) {
    const pb = passwordProblem(f.motDePasse);
    if (pb) e.motDePasse = pb;
  }
  if (!f.roleId) e.roleId = 'Choisissez un rôle';
  return e;
}

export function UtilisateurFormModal({ utilisateur, roles, magasins, onClose, onSaved }: Props) {
  const creation = !utilisateur;
  const [f, setF] = useState<Formulaire>({
    nom: utilisateur?.nom ?? '',
    prenom: utilisateur?.prenom ?? '',
    username: utilisateur?.username ?? '',
    motDePasse: '',
    roleId: utilisateur ? String(utilisateur.roleId) : '',
    magasinId: utilisateur?.magasinId ? String(utilisateur.magasinId) : magasins.length === 1 ? String(magasins[0].id) : '',
  });
  const [erreurs, setErreurs] = useState<Record<string, string>>({});
  const [erreurGlobale, setErreurGlobale] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  const maj = (champ: keyof Formulaire) => (e: { target: { value: string } }) => setF((prev) => ({ ...prev, [champ]: e.target.value }));

  const enregistrer = async () => {
    const e = validerUtilisateur(f, creation);
    setErreurs(e);
    if (Object.keys(e).length) return;

    const base = {
      nom: sanitizeText(f.nom),
      prenom: sanitizeText(f.prenom) || undefined,
      username: f.username.trim(),
      roleId: Number(f.roleId),
      magasinId: f.magasinId ? Number(f.magasinId) : null,
    };
    setEnCours(true);
    setErreurGlobale(null);
    try {
      const saved = creation
        ? await utilisateurService.create({ ...base, motDePasse: f.motDePasse })
        : await utilisateurService.update(utilisateur.id, base);
      onSaved(saved);
    } catch (err) {
      if (err instanceof ApiClientError) {
        setErreurs(err.fieldErrors);
        if (!Object.keys(err.fieldErrors).length) setErreurGlobale(err.message);
      }
    } finally {
      setEnCours(false);
    }
  };

  return (
    <Modal
      titre={creation ? 'Nouvel utilisateur' : `Modifier ${utilisateur.username}`}
      onClose={onClose}
      pied={
        <>
          <button className="btn-secondaire" onClick={onClose}>Annuler</button>
          <button className="btn-primaire" onClick={enregistrer} disabled={enCours}>
            {enCours ? 'Enregistrement…' : creation ? 'Créer le compte' : 'Enregistrer'}
          </button>
        </>
      }
    >
      {erreurGlobale && <p role="alert" className="mb-4 rounded border-l-4 border-alerte bg-alerte-pale px-3 py-2 text-sm">{erreurGlobale}</p>}
      <div className="grid gap-4 sm:grid-cols-2">
        <Champ label="Nom" requis erreur={erreurs.nom}>
          {(p) => <input {...p} value={f.nom} maxLength={100} onChange={maj('nom')} />}
        </Champ>
        <Champ label="Prénom" erreur={erreurs.prenom}>
          {(p) => <input {...p} value={f.prenom} maxLength={100} onChange={maj('prenom')} />}
        </Champ>
        <Champ label="Identifiant de connexion" requis erreur={erreurs.username} aide="Enregistré en minuscules">
          {(p) => <input {...p} value={f.username} maxLength={60} autoCapitalize="none" autoComplete="off" onChange={maj('username')} />}
        </Champ>
        {creation && (
          <Champ label="Mot de passe provisoire" requis erreur={erreurs.motDePasse} aide="8 caractères min., une lettre et un chiffre">
            {(p) => <input {...p} type="password" autoComplete="new-password" value={f.motDePasse} onChange={maj('motDePasse')} />}
          </Champ>
        )}
        <Champ label="Rôle" requis erreur={erreurs.roleId}>
          {(p) => (
            <select {...p} value={f.roleId} onChange={maj('roleId')}>
              <option value="">Choisir…</option>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>{r.libelle}</option>
              ))}
            </select>
          )}
        </Champ>
        <Champ label="Magasin" erreur={erreurs.magasinId} aide={magasins.length === 0 ? 'Aucun magasin créé pour l’instant' : 'Laisser vide pour un accès tous magasins'}>
          {(p) => (
            <select {...p} value={f.magasinId} onChange={maj('magasinId')} disabled={magasins.length === 0}>
              <option value="">Tous les magasins</option>
              {magasins.map((m) => (
                <option key={m.id} value={m.id}>{m.libelle}</option>
              ))}
            </select>
          )}
        </Champ>
      </div>
    </Modal>
  );
}
