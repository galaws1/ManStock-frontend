import { useState } from 'react';
import { ApiClientError } from '../../services/axiosConfig';
import { categorieService } from '../../services/domains/categorieService';
import type { Categorie } from '../../types/categorie';
import type { Option } from '../../types/common';
import { sanitizeText } from '../../utils/security';
import { Champ } from '../common/Champ';
import { Modal } from '../common/Modal';

interface Props {
  categorie?: Categorie;
  familles: Option[];
  /** Famille présélectionnée à la création (filtre en cours sur la liste). */
  familleParDefaut?: number;
  onClose: () => void;
  onSaved: (c: Categorie) => void;
}

export function validerCategorie(nom: string, familleId: string): Record<string, string> {
  const e: Record<string, string> = {};
  if (!sanitizeText(nom)) e.nom = 'Le nom est obligatoire';
  if (!familleId) e.familleId = 'Choisissez une famille';
  return e;
}

export function CategorieFormModal({ categorie, familles, familleParDefaut, onClose, onSaved }: Props) {
  const [nom, setNom] = useState(categorie?.nom ?? '');
  const [familleId, setFamilleId] = useState(
    String(categorie?.familleId ?? familleParDefaut ?? (familles.length === 1 ? familles[0].id : '')),
  );
  const [erreurs, setErreurs] = useState<Record<string, string>>({});
  const [erreurGlobale, setErreurGlobale] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  const enregistrer = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const err = validerCategorie(nom, familleId);
    setErreurs(err);
    if (Object.keys(err).length) return;

    const payload = { nom: sanitizeText(nom), familleId: Number(familleId) };
    setEnCours(true);
    setErreurGlobale(null);
    try {
      onSaved(categorie ? await categorieService.update(categorie.id, payload) : await categorieService.create(payload));
    } catch (ex) {
      if (ex instanceof ApiClientError) {
        if (Object.keys(ex.fieldErrors).length) setErreurs(ex.fieldErrors);
        else setErreurGlobale(ex.message);
      }
    } finally {
      setEnCours(false);
    }
  };

  const changeFamille = categorie && Number(familleId) !== categorie.familleId;

  return (
    <Modal
      titre={categorie ? 'Modifier la catégorie' : 'Nouvelle catégorie'}
      onClose={onClose}
      largeur="sm"
      pied={
        <>
          <button className="btn-secondaire" onClick={onClose}>Annuler</button>
          <button className="btn-primaire" onClick={() => enregistrer()} disabled={enCours}>
            {enCours ? 'Enregistrement…' : categorie ? 'Enregistrer' : 'Créer la catégorie'}
          </button>
        </>
      }
    >
      {erreurGlobale && <p role="alert" className="mb-4 rounded border-l-4 border-alerte bg-alerte-pale px-3 py-2 text-sm">{erreurGlobale}</p>}
      <form onSubmit={enregistrer} noValidate className="space-y-4">
        <Champ label="Famille" requis erreur={erreurs.familleId}>
          {(p) => (
            <select {...p} value={familleId} onChange={(e) => setFamilleId(e.target.value)}>
              <option value="">Choisir…</option>
              {familles.map((f) => (
                <option key={f.id} value={f.id}>{f.libelle}</option>
              ))}
            </select>
          )}
        </Champ>
        <Champ label="Nom de la catégorie" requis erreur={erreurs.nom} aide="Ex : Sodas, Jus de fruits, Eaux minérales">
          {(p) => <input {...p} value={nom} maxLength={100} onChange={(e) => setNom(e.target.value)} />}
        </Champ>
        {changeFamille && categorie.nbProduits > 0 && (
          <p className="rounded border-l-4 border-ambre bg-ambre-pale px-3 py-2 text-sm">
            Les {categorie.nbProduits} produit(s) de cette catégorie changeront de famille avec elle.
          </p>
        )}
      </form>
    </Modal>
  );
}
