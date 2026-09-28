import { useState } from 'react';
import { ApiClientError } from '../../services/axiosConfig';
import { paquetageService, produitService } from '../../services/domains/produitService';
import type { Paquetage, PaquetageRequest, Produit } from '../../types/produit';
import { formatMontant, nbDecimales, parseNombre, versSaisie } from '../../utils/formatters';
import { sanitizeText } from '../../utils/security';
import { Champ } from '../common/Champ';
import { ErreurGlobale } from '../common/ErreurGlobale';
import { Modal } from '../common/Modal';
import { CODE_BARRE_PATTERN } from './ProduitFormModal';

export interface FormulairePaquetage {
  nom: string;
  codeBarre: string;
  quantite: string;
  prixVente: string;
  seuilAlerte: string;
}

export function validerPaquetage(f: FormulairePaquetage): { erreurs: Record<string, string>; payload?: PaquetageRequest } {
  const e: Record<string, string> = {};
  const nom = sanitizeText(f.nom);
  if (!nom) e.nom = 'Le nom est obligatoire';
  const code = f.codeBarre.replace(/\s+/g, '');
  if (code && !CODE_BARRE_PATTERN.test(code)) e.codeBarre = '4 à 50 caractères : chiffres, lettres et tiret';
  const quantite = parseNombre(f.quantite);
  if (!f.quantite.trim() || Number.isNaN(quantite) || quantite <= 0) e.quantite = 'Quantité positive obligatoire';
  else if (nbDecimales(f.quantite) > 3) e.quantite = '3 décimales maximum';
  const optionnel = (saisie: string, champ: string) => {
    if (!saisie.trim()) return undefined;
    const n = parseNombre(saisie);
    if (Number.isNaN(n) || n < 0) e[champ] = 'Nombre positif attendu';
    else if (nbDecimales(saisie) > 2) e[champ] = '2 décimales maximum';
    return n;
  };
  const prixVente = optionnel(f.prixVente, 'prixVente');
  const seuilAlerte = optionnel(f.seuilAlerte, 'seuilAlerte');
  if (Object.keys(e).length) return { erreurs: e };
  return { erreurs: {}, payload: { nom, codeBarre: code || undefined, quantiteUniteBase: quantite, prixVente, seuilAlerte } };
}

interface Props {
  produit: Produit;
  paquetage?: Paquetage;
  onClose: () => void;
  onSaved: (p: Paquetage) => void;
}

export function PaquetageFormModal({ produit, paquetage, onClose, onSaved }: Props) {
  const [f, setF] = useState<FormulairePaquetage>({
    nom: paquetage?.nom ?? '',
    codeBarre: paquetage?.codeBarre ?? '',
    quantite: versSaisie(paquetage?.quantiteUniteBase),
    prixVente: versSaisie(paquetage?.prixVente),
    seuilAlerte: versSaisie(paquetage?.seuilAlerte),
  });
  const [erreurs, setErreurs] = useState<Record<string, string>>({});
  const [erreurGlobale, setErreurGlobale] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);
  const maj = (champ: keyof FormulairePaquetage) => (e: { target: { value: string } }) => setF((p) => ({ ...p, [champ]: e.target.value }));

  const q = parseNombre(f.quantite);
  const prixCalcule = !Number.isNaN(q) && q > 0 ? produit.prixVente * q : null;

  const enregistrer = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const { erreurs: err, payload } = validerPaquetage(f);
    setErreurs(err);
    if (!payload) return;
    setEnCours(true);
    setErreurGlobale(null);
    try {
      onSaved(paquetage ? await paquetageService.update(paquetage.id, payload) : await produitService.creerPaquetage(produit.id, payload));
    } catch (ex) {
      if (ex instanceof ApiClientError) {
        if (Object.keys(ex.fieldErrors).length) setErreurs({ ...ex.fieldErrors, quantite: ex.fieldErrors.quantiteUniteBase ?? '' });
        else setErreurGlobale(ex.message);
      }
    } finally {
      setEnCours(false);
    }
  };

  return (
    <Modal
      titre={paquetage ? `Modifier « ${paquetage.nom} »` : 'Nouveau conditionnement'}
      onClose={onClose}
      pied={
        <>
          <button className="btn-secondaire" onClick={onClose}>Annuler</button>
          <button className="btn-primaire" onClick={() => enregistrer()} disabled={enCours}>
            {enCours ? 'Enregistrement…' : paquetage ? 'Enregistrer' : 'Ajouter le conditionnement'}
          </button>
        </>
      }
    >
      <ErreurGlobale message={erreurGlobale} />
      <form onSubmit={enregistrer} noValidate className="grid gap-4 sm:grid-cols-2">
        <Champ label="Nom" requis erreur={erreurs.nom} aide="Ex : Carton de 12, Palette, Sac de 50 kg">
          {(p) => <input {...p} value={f.nom} maxLength={100} onChange={maj('nom')} />}
        </Champ>
        <Champ label={`Contenu (en ${produit.uniteBaseSymbole})`} requis erreur={erreurs.quantite} aide={`Combien de ${produit.uniteBaseNom.toLowerCase()} dans ce conditionnement`}>
          {(p) => <input {...p} value={f.quantite} inputMode="decimal" onChange={maj('quantite')} />}
        </Champ>
        <Champ label="Code-barre" erreur={erreurs.codeBarre} aide="Facultatif, différent de celui du produit">
          {(p) => <input {...p} value={f.codeBarre} maxLength={60} inputMode="numeric" className={`${p.className} font-mono`} onChange={maj('codeBarre')} />}
        </Champ>
        <Champ
          label="Prix de vente"
          erreur={erreurs.prixVente}
          aide={prixCalcule !== null ? `Vide = prix calculé : ${formatMontant(prixCalcule)}` : 'Vide = prix unitaire × contenu'}
        >
          {(p) => <input {...p} value={f.prixVente} inputMode="decimal" onChange={maj('prixVente')} />}
        </Champ>
        <Champ label="Seuil d’alerte (conditionnement)" erreur={erreurs.seuilAlerte} aide="Facultatif">
          {(p) => <input {...p} value={f.seuilAlerte} inputMode="decimal" onChange={maj('seuilAlerte')} />}
        </Champ>
      </form>
    </Modal>
  );
}
