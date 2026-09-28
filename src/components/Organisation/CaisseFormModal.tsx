import { useState } from 'react';
import { ApiClientError } from '../../services/axiosConfig';
import { caisseService } from '../../services/domains/caisseService';
import type { Caisse } from '../../types/caisse';
import type { Option } from '../../types/common';
import { avecOptionActuelle } from '../../utils/options';
import { sanitizeText } from '../../utils/security';
import { Champ } from '../common/Champ';
import { ErreurGlobale } from '../common/ErreurGlobale';
import { Modal } from '../common/Modal';

interface Props {
  caisse?: Caisse;
  magasins: Option[];
  magasinParDefaut?: number;
  onClose: () => void;
  onSaved: (c: Caisse) => void;
}

export function CaisseFormModal({ caisse, magasins, magasinParDefaut, onClose, onSaved }: Props) {
  const [nom, setNom] = useState(caisse?.nom ?? '');
  const [magasinId, setMagasinId] = useState(String(caisse?.magasinId ?? magasinParDefaut ?? (magasins.length === 1 ? magasins[0].id : '')));
  const [erreurs, setErreurs] = useState<Record<string, string>>({});
  const [erreurGlobale, setErreurGlobale] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);
  const choix = avecOptionActuelle(magasins, caisse?.magasinId, caisse?.magasinNom);

  const enregistrer = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const err: Record<string, string> = {};
    if (!sanitizeText(nom)) err.nom = 'Le nom est obligatoire';
    if (!magasinId) err.magasinId = 'Choisissez un magasin';
    setErreurs(err);
    if (Object.keys(err).length) return;
    const payload = { nom: sanitizeText(nom), magasinId: Number(magasinId) };
    setEnCours(true);
    setErreurGlobale(null);
    try {
      onSaved(caisse ? await caisseService.update(caisse.id, payload) : await caisseService.create(payload));
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
      titre={caisse ? 'Modifier la caisse' : 'Nouvelle caisse'}
      onClose={onClose}
      largeur="sm"
      pied={
        <>
          <button className="btn-secondaire" onClick={onClose}>Annuler</button>
          <button className="btn-primaire" onClick={() => enregistrer()} disabled={enCours}>
            {enCours ? 'Enregistrement…' : caisse ? 'Enregistrer' : 'Créer la caisse'}
          </button>
        </>
      }
    >
      <ErreurGlobale message={erreurGlobale} />
      <form onSubmit={enregistrer} noValidate className="space-y-4">
        <Champ label="Magasin" requis erreur={erreurs.magasinId}>
          {(p) => (
            <select {...p} value={magasinId} onChange={(e) => setMagasinId(e.target.value)}>
              <option value="">Choisir…</option>
              {choix.map((m) => (
                <option key={m.id} value={m.id}>{m.libelle}</option>
              ))}
            </select>
          )}
        </Champ>
        <Champ label="Nom de la caisse" requis erreur={erreurs.nom} aide="Ex : Caisse 1, Caisse rapide">
          {(p) => <input {...p} value={nom} maxLength={50} onChange={(e) => setNom(e.target.value)} />}
        </Champ>
      </form>
    </Modal>
  );
}
