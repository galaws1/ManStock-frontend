import { useState } from 'react';
import { ApiClientError } from '../../services/axiosConfig';
import { roleService } from '../../services/domains/roleService';
import type { Role } from '../../types/role';
import { ROLE_CODE_PATTERN, sanitizeText } from '../../utils/security';
import { Champ } from '../common/Champ';
import { Modal } from '../common/Modal';

interface Props {
  role?: Role;
  onClose: () => void;
  onSaved: (role: Role) => void;
}

export function RoleFormModal({ role, onClose, onSaved }: Props) {
  const [code, setCode] = useState(role?.code ?? '');
  const [libelle, setLibelle] = useState(role?.libelle ?? '');
  const [erreurs, setErreurs] = useState<Record<string, string>>({});
  const [erreurGlobale, setErreurGlobale] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);
  const estAdmin = role?.code === 'ADMIN';

  const enregistrer = async () => {
    const payload = { code: code.trim().toUpperCase(), libelle: sanitizeText(libelle) };
    const e: Record<string, string> = {};
    if (!ROLE_CODE_PATTERN.test(payload.code)) e.code = 'Lettres, chiffres et _ uniquement, en commençant par une lettre (30 max)';
    if (!payload.libelle) e.libelle = 'Le libellé est obligatoire';
    setErreurs(e);
    if (Object.keys(e).length) return;

    setEnCours(true);
    setErreurGlobale(null);
    try {
      const saved = role ? await roleService.update(role.id, payload) : await roleService.create(payload);
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
      titre={role ? 'Modifier le rôle' : 'Nouveau rôle'}
      onClose={onClose}
      largeur="sm"
      pied={
        <>
          <button className="btn-secondaire" onClick={onClose}>Annuler</button>
          <button className="btn-primaire" onClick={enregistrer} disabled={enCours}>
            {enCours ? 'Enregistrement…' : role ? 'Enregistrer' : 'Créer le rôle'}
          </button>
        </>
      }
    >
      {erreurGlobale && <p role="alert" className="mb-4 rounded border-l-4 border-alerte bg-alerte-pale px-3 py-2 text-sm">{erreurGlobale}</p>}
      <div className="space-y-4">
        <Champ label="Code" requis erreur={erreurs.code} aide={estAdmin ? 'Le code du rôle administrateur est fixe.' : 'Identifiant technique, ex : MAGASINIER'}>
          {(p) => <input {...p} value={code} disabled={estAdmin} maxLength={30} onChange={(e) => setCode(e.target.value.toUpperCase())} />}
        </Champ>
        <Champ label="Libellé" requis erreur={erreurs.libelle} aide="Nom affiché aux utilisateurs">
          {(p) => <input {...p} value={libelle} maxLength={100} onChange={(e) => setLibelle(e.target.value)} />}
        </Champ>
      </div>
    </Modal>
  );
}
