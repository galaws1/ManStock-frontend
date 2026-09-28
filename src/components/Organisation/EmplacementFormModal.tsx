import { useState } from 'react';
import { ApiClientError } from '../../services/axiosConfig';
import { emplacementService, entrepotService } from '../../services/domains/entrepotService';
import type { Emplacement } from '../../types/entrepot';
import { sanitizeText } from '../../utils/security';
import { Champ } from '../common/Champ';
import { ErreurGlobale } from '../common/ErreurGlobale';
import { Modal } from '../common/Modal';

export const CODE_EMPLACEMENT_PATTERN = /^[A-Za-z0-9._/-]{1,30}$/;

interface Props {
  entrepotId: number;
  emplacement?: Emplacement;
  onClose: () => void;
  onSaved: (e: Emplacement) => void;
}

export function EmplacementFormModal({ entrepotId, emplacement, onClose, onSaved }: Props) {
  const [code, setCode] = useState(emplacement?.code ?? '');
  const [description, setDescription] = useState(emplacement?.description ?? '');
  const [erreurs, setErreurs] = useState<Record<string, string>>({});
  const [erreurGlobale, setErreurGlobale] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  const enregistrer = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const c = code.trim().toUpperCase();
    if (!CODE_EMPLACEMENT_PATTERN.test(c)) {
      setErreurs({ code: 'Lettres, chiffres et . _ / - uniquement, sans espace (30 max)' });
      return;
    }
    setErreurs({});
    const payload = { code: c, description: sanitizeText(description) || undefined };
    setEnCours(true);
    setErreurGlobale(null);
    try {
      onSaved(emplacement ? await emplacementService.update(emplacement.id, payload) : await entrepotService.creerEmplacement(entrepotId, payload));
    } catch (ex) {
      if (ex instanceof ApiClientError) {
        if (Object.keys(ex.fieldErrors).length) setErreurs(ex.fieldErrors);
        else setErreurGlobale(ex.message);
      }
    } finally {
      setEnCours(false);
    }
  };

  return (
    <Modal
      titre={emplacement ? `Modifier l’emplacement ${emplacement.code}` : 'Nouvel emplacement'}
      onClose={onClose}
      largeur="sm"
      pied={
        <>
          <button className="btn-secondaire" onClick={onClose}>Annuler</button>
          <button className="btn-primaire" onClick={() => enregistrer()} disabled={enCours}>
            {enCours ? 'Enregistrement…' : emplacement ? 'Enregistrer' : 'Créer l’emplacement'}
          </button>
        </>
      }
    >
      <ErreurGlobale message={erreurGlobale} />
      <form onSubmit={enregistrer} noValidate className="space-y-4">
        <Champ label="Code" requis erreur={erreurs.code} aide="Ex : A-03-02 (allée A, rayon 3, niveau 2). Enregistré en majuscules.">
          {(p) => <input {...p} value={code} maxLength={30} autoCapitalize="characters" className={`${p.className} font-mono uppercase`} onChange={(e) => setCode(e.target.value)} />}
        </Champ>
        <Champ label="Description" erreur={erreurs.description}>
          {(p) => <input {...p} value={description} maxLength={150} onChange={(e) => setDescription(e.target.value)} />}
        </Champ>
      </form>
    </Modal>
  );
}
