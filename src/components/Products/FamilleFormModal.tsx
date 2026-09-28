import { useState } from 'react';
import { ApiClientError } from '../../services/axiosConfig';
import { familleService } from '../../services/domains/familleService';
import type { Famille } from '../../types/famille';
import { sanitizeText } from '../../utils/security';
import { Champ } from '../common/Champ';
import { Modal } from '../common/Modal';

interface Props {
  famille?: Famille;
  onClose: () => void;
  onSaved: (f: Famille) => void;
}

export function FamilleFormModal({ famille, onClose, onSaved }: Props) {
  const [nom, setNom] = useState(famille?.nom ?? '');
  const [erreur, setErreur] = useState<string | undefined>();
  const [enCours, setEnCours] = useState(false);

  const enregistrer = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const valeur = sanitizeText(nom);
    if (!valeur) {
      setErreur('Le nom est obligatoire');
      return;
    }
    setEnCours(true);
    setErreur(undefined);
    try {
      const saved = famille ? await familleService.update(famille.id, { nom: valeur }) : await familleService.create({ nom: valeur });
      onSaved(saved);
    } catch (err) {
      if (err instanceof ApiClientError) setErreur(err.fieldErrors.nom ?? err.message);
    } finally {
      setEnCours(false);
    }
  };

  return (
    <Modal
      titre={famille ? 'Renommer la famille' : 'Nouvelle famille'}
      onClose={onClose}
      largeur="sm"
      pied={
        <>
          <button className="btn-secondaire" onClick={onClose}>Annuler</button>
          <button className="btn-primaire" onClick={() => enregistrer()} disabled={enCours}>
            {enCours ? 'Enregistrement…' : famille ? 'Enregistrer' : 'Créer la famille'}
          </button>
        </>
      }
    >
      <form onSubmit={enregistrer} noValidate>
        <Champ label="Nom de la famille" requis erreur={erreur} aide="Ex : Boissons, Épicerie, Quincaillerie">
          {(p) => <input {...p} value={nom} maxLength={100} onChange={(e) => setNom(e.target.value)} />}
        </Champ>
      </form>
    </Modal>
  );
}
