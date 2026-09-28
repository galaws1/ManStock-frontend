import { useState, type FormEvent, type ReactNode } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ApiClientError } from '../../services/axiosConfig';
import { authService } from '../../services/domains/authService';
import { nouveauMotDePasseProblem } from '../../utils/security';
import { Champ } from '../common/Champ';

interface Props {
  /** Appelé après un changement réussi (le flag doitChangerMotDePasse est déjà remis à false). */
  onSucces: () => void;
  libelleValider?: string;
  /** Boutons additionnels affichés à gauche du bouton de validation (ex : Annuler). */
  actionsSecondaires?: ReactNode;
}

/** Formulaire de changement de son propre mot de passe (fenêtre « Mon mot de passe » et page obligatoire). */
export function MotDePasseForm({ onSucces, libelleValider = 'Modifier le mot de passe', actionsSecondaires }: Props) {
  const { user, marquerMotDePasseChange } = useAuth();
  const [ancien, setAncien] = useState('');
  const [nouveau, setNouveau] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [erreurs, setErreurs] = useState<Record<string, string>>({});
  const [enCours, setEnCours] = useState(false);

  const enregistrer = async (e: FormEvent) => {
    e.preventDefault();
    const err: Record<string, string> = {};
    if (!ancien) err.ancienMotDePasse = 'Obligatoire';
    const pb = nouveauMotDePasseProblem(nouveau, ancien, user?.username);
    if (pb) err.nouveauMotDePasse = pb;
    if (nouveau !== confirmation) err.confirmation = 'Les deux saisies ne correspondent pas';
    setErreurs(err);
    if (Object.keys(err).length) return;

    setEnCours(true);
    try {
      await authService.changerMotDePasse({ ancienMotDePasse: ancien, nouveauMotDePasse: nouveau });
      marquerMotDePasseChange();
      onSucces();
    } catch (ex) {
      if (ex instanceof ApiClientError) {
        setErreurs(Object.keys(ex.fieldErrors).length ? ex.fieldErrors : { ancienMotDePasse: ex.message });
      }
    } finally {
      setEnCours(false);
    }
  };

  return (
    <form onSubmit={enregistrer} noValidate>
      <div className="space-y-4">
        <Champ label="Mot de passe actuel" requis erreur={erreurs.ancienMotDePasse}>
          {(p) => <input {...p} type="password" autoComplete="current-password" value={ancien} onChange={(e) => setAncien(e.target.value)} />}
        </Champ>
        <Champ
          label="Nouveau mot de passe"
          requis
          erreur={erreurs.nouveauMotDePasse}
          aide="8 caractères minimum, avec au moins une lettre et un chiffre. Différent de votre identifiant."
        >
          {(p) => <input {...p} type="password" autoComplete="new-password" value={nouveau} onChange={(e) => setNouveau(e.target.value)} />}
        </Champ>
        <Champ label="Confirmer le nouveau mot de passe" requis erreur={erreurs.confirmation}>
          {(p) => <input {...p} type="password" autoComplete="new-password" value={confirmation} onChange={(e) => setConfirmation(e.target.value)} />}
        </Champ>
      </div>
      <div className="mt-6 flex justify-end gap-2">
        {actionsSecondaires}
        <button type="submit" className="btn-primaire" disabled={enCours}>
          {enCours ? 'Enregistrement…' : libelleValider}
        </button>
      </div>
    </form>
  );
}
