import { useState } from 'react';
import { ApiClientError } from '../../services/axiosConfig';
import { uniteService } from '../../services/domains/uniteService';
import type { Unite } from '../../types/unite';
import { sanitizeText } from '../../utils/security';
import { Champ } from '../common/Champ';
import { ErreurGlobale } from '../common/ErreurGlobale';
import { Modal } from '../common/Modal';

export function UniteFormModal({ unite, onClose, onSaved }: { unite?: Unite; onClose: () => void; onSaved: (u: Unite) => void }) {
  const [nom, setNom] = useState(unite?.nom ?? '');
  const [symbole, setSymbole] = useState(unite?.symbole ?? '');
  const [erreurs, setErreurs] = useState<Record<string, string>>({});
  const [erreurGlobale, setErreurGlobale] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  const enregistrer = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const err: Record<string, string> = {};
    if (!sanitizeText(nom)) err.nom = 'Le nom est obligatoire';
    if (!symbole.trim()) err.symbole = 'Le symbole est obligatoire';
    setErreurs(err);
    if (Object.keys(err).length) return;
    const payload = { nom: sanitizeText(nom), symbole: symbole.trim() };
    setEnCours(true);
    setErreurGlobale(null);
    try {
      onSaved(unite ? await uniteService.update(unite.id, payload) : await uniteService.create(payload));
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
      titre={unite ? 'Modifier l’unité' : 'Nouvelle unité de mesure'}
      onClose={onClose}
      largeur="sm"
      pied={
        <>
          <button className="btn-secondaire" onClick={onClose}>Annuler</button>
          <button className="btn-primaire" onClick={() => enregistrer()} disabled={enCours}>
            {enCours ? 'Enregistrement…' : unite ? 'Enregistrer' : 'Créer l’unité'}
          </button>
        </>
      }
    >
      <ErreurGlobale message={erreurGlobale} />
      <form onSubmit={enregistrer} noValidate className="grid gap-4 sm:grid-cols-[1fr_8rem]">
        <Champ label="Nom" requis erreur={erreurs.nom} aide="Ex : Kilogramme, Sac de 50 kg">
          {(p) => <input {...p} value={nom} maxLength={50} onChange={(e) => setNom(e.target.value)} />}
        </Champ>
        <Champ label="Symbole" requis erreur={erreurs.symbole} aide="Ex : kg">
          {(p) => <input {...p} value={symbole} maxLength={10} onChange={(e) => setSymbole(e.target.value)} />}
        </Champ>
      </form>
    </Modal>
  );
}
