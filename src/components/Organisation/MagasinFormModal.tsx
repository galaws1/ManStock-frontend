import { useState } from 'react';
import { ApiClientError } from '../../services/axiosConfig';
import { magasinService } from '../../services/domains/magasinService';
import type { Magasin } from '../../types/magasin';
import { sanitizeText, TELEPHONE_PATTERN } from '../../utils/security';
import { Champ } from '../common/Champ';
import { Modal } from '../common/Modal';

interface Formulaire {
  nom: string;
  adresse: string;
  telephone: string;
}

export function validerMagasin(f: Formulaire): Record<string, string> {
  const e: Record<string, string> = {};
  if (!sanitizeText(f.nom)) e.nom = 'Le nom est obligatoire';
  const tel = f.telephone.trim();
  if (tel && !TELEPHONE_PATTERN.test(tel)) e.telephone = 'Chiffres, espaces et + ( ) . - uniquement (6 à 30 caractères)';
  return e;
}

interface Props {
  magasin?: Magasin;
  onClose: () => void;
  onSaved: (m: Magasin) => void;
}

export function MagasinFormModal({ magasin, onClose, onSaved }: Props) {
  const [f, setF] = useState<Formulaire>({
    nom: magasin?.nom ?? '',
    adresse: magasin?.adresse ?? '',
    telephone: magasin?.telephone ?? '',
  });
  const [erreurs, setErreurs] = useState<Record<string, string>>({});
  const [erreurGlobale, setErreurGlobale] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);
  const maj = (champ: keyof Formulaire) => (e: { target: { value: string } }) => setF((p) => ({ ...p, [champ]: e.target.value }));

  const enregistrer = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const err = validerMagasin(f);
    setErreurs(err);
    if (Object.keys(err).length) return;

    const payload = {
      nom: sanitizeText(f.nom),
      adresse: sanitizeText(f.adresse) || undefined,
      telephone: f.telephone.trim() || undefined,
    };
    setEnCours(true);
    setErreurGlobale(null);
    try {
      onSaved(magasin ? await magasinService.update(magasin.id, payload) : await magasinService.create(payload));
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
      titre={magasin ? 'Modifier le magasin' : 'Nouveau magasin'}
      onClose={onClose}
      pied={
        <>
          <button className="btn-secondaire" onClick={onClose}>Annuler</button>
          <button className="btn-primaire" onClick={() => enregistrer()} disabled={enCours}>
            {enCours ? 'Enregistrement…' : magasin ? 'Enregistrer' : 'Créer le magasin'}
          </button>
        </>
      }
    >
      {erreurGlobale && <p role="alert" className="mb-4 rounded border-l-4 border-alerte bg-alerte-pale px-3 py-2 text-sm">{erreurGlobale}</p>}
      <form onSubmit={enregistrer} noValidate className="space-y-4">
        <Champ label="Nom du magasin" requis erreur={erreurs.nom} aide="Ex : Magasin principal, Dépôt Nord">
          {(p) => <input {...p} value={f.nom} maxLength={150} onChange={maj('nom')} />}
        </Champ>
        <Champ label="Adresse" erreur={erreurs.adresse}>
          {(p) => <input {...p} value={f.adresse} maxLength={255} autoComplete="street-address" onChange={maj('adresse')} />}
        </Champ>
        <Champ label="Téléphone" erreur={erreurs.telephone}>
          {(p) => <input {...p} type="tel" value={f.telephone} maxLength={30} autoComplete="tel" onChange={maj('telephone')} />}
        </Champ>
      </form>
    </Modal>
  );
}
