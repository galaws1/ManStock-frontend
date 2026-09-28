import { useEffect, useMemo, useState } from 'react';
import { ApiClientError } from '../../services/axiosConfig';
import { categorieService } from '../../services/domains/categorieService';
import { produitService } from '../../services/domains/produitService';
import { uniteService } from '../../services/domains/uniteService';
import type { CategorieOption } from '../../types/categorie';
import type { Produit, ProduitRequest } from '../../types/produit';
import type { Unite } from '../../types/unite';
import { formatMontant, nbDecimales, parseNombre, versSaisie } from '../../utils/formatters';
import { sanitizeText } from '../../utils/security';
import { Champ } from '../common/Champ';
import { ErreurGlobale } from '../common/ErreurGlobale';
import { Modal } from '../common/Modal';

export interface FormulaireProduit {
  nom: string;
  codeBarre: string;
  categorieId: string;
  uniteBaseId: string;
  prixAchat: string;
  prixVente: string;
  seuilAlerte: string;
  perissable: boolean;
  delai: string;
}

export const CODE_BARRE_PATTERN = /^[0-9A-Za-z-]{4,50}$/;

function montant(saisie: string, champ: string, e: Record<string, string>, obligatoire = true): number | undefined {
  if (!saisie.trim()) {
    if (obligatoire) e[champ] = 'Obligatoire';
    return undefined;
  }
  const n = parseNombre(saisie);
  if (Number.isNaN(n)) e[champ] = 'Nombre invalide';
  else if (n < 0) e[champ] = 'Ne peut pas être négatif';
  else if (nbDecimales(saisie) > 2) e[champ] = '2 décimales maximum';
  return n;
}

/** Valide la saisie et construit la requête (mêmes règles que ProduitRequest.java). */
export function validerProduit(f: FormulaireProduit): { erreurs: Record<string, string>; payload?: ProduitRequest } {
  const e: Record<string, string> = {};
  const nom = sanitizeText(f.nom);
  if (!nom) e.nom = 'Le nom est obligatoire';
  const code = f.codeBarre.replace(/\s+/g, '');
  if (code && !CODE_BARRE_PATTERN.test(code)) e.codeBarre = '4 à 50 caractères : chiffres, lettres et tiret';
  if (!f.categorieId) e.categorieId = 'Choisissez une catégorie';
  if (!f.uniteBaseId) e.uniteBaseId = 'Choisissez une unité';
  const prixAchat = montant(f.prixAchat, 'prixAchat', e);
  const prixVente = montant(f.prixVente, 'prixVente', e);
  const seuilAlerte = montant(f.seuilAlerte, 'seuilAlerte', e);
  let delai: number | undefined;
  if (f.perissable) {
    delai = Number(f.delai);
    if (!f.delai.trim() || !Number.isInteger(delai) || delai < 1 || delai > 3650) e.delai = 'Entre 1 et 3650 jours';
  }
  if (Object.keys(e).length) return { erreurs: e };
  return {
    erreurs: {},
    payload: {
      nom,
      codeBarre: code || undefined,
      categorieId: Number(f.categorieId),
      uniteBaseId: Number(f.uniteBaseId),
      prixAchat: prixAchat!,
      prixVente: prixVente!,
      seuilAlerte: seuilAlerte!,
      perissable: f.perissable,
      delaiAlertePeremptionJours: f.perissable ? delai : undefined,
    },
  };
}

interface Props {
  produit?: Produit;
  onClose: () => void;
  onSaved: (p: Produit) => void;
}

export function ProduitFormModal({ produit, onClose, onSaved }: Props) {
  const [categories, setCategories] = useState<CategorieOption[]>([]);
  const [unites, setUnites] = useState<Unite[]>([]);
  const [f, setF] = useState<FormulaireProduit>({
    nom: produit?.nom ?? '',
    codeBarre: produit?.codeBarre ?? '',
    categorieId: produit ? String(produit.categorieId) : '',
    uniteBaseId: produit ? String(produit.uniteBaseId) : '',
    prixAchat: versSaisie(produit?.prixAchat),
    prixVente: versSaisie(produit?.prixVente),
    seuilAlerte: versSaisie(produit?.seuilAlerte ?? 0),
    perissable: produit?.perissable ?? false,
    delai: produit?.delaiAlertePeremptionJours ? String(produit.delaiAlertePeremptionJours) : '',
  });
  const [erreurs, setErreurs] = useState<Record<string, string>>({});
  const [erreurGlobale, setErreurGlobale] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  useEffect(() => {
    Promise.all([categorieService.options(), uniteService.getAll()])
      .then(([c, u]) => {
        setCategories(c);
        setUnites(u);
        // Unité par défaut à la création : "u" si elle existe
        if (!produit) setF((prev) => (prev.uniteBaseId ? prev : { ...prev, uniteBaseId: String(u.find((x) => x.symbole === 'u')?.id ?? '') }));
      })
      .catch(() => setErreurGlobale('Impossible de charger les catégories et unités'));
  }, [produit]);

  const parFamille = useMemo(() => {
    const groupes = new Map<string, CategorieOption[]>();
    categories.forEach((c) => groupes.set(c.familleNom, [...(groupes.get(c.familleNom) ?? []), c]));
    return [...groupes.entries()];
  }, [categories]);

  const maj = (champ: keyof FormulaireProduit) => (e: { target: { value: string } }) => setF((p) => ({ ...p, [champ]: e.target.value }));

  const pa = parseNombre(f.prixAchat);
  const pv = parseNombre(f.prixVente);
  const marge = !Number.isNaN(pa) && !Number.isNaN(pv) ? pv - pa : null;
  const symbole = unites.find((u) => String(u.id) === f.uniteBaseId)?.symbole ?? '';
  const changementUnite = produit && produit.nbPaquetages > 0 && String(produit.uniteBaseId) !== f.uniteBaseId;

  const enregistrer = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const { erreurs: err, payload } = validerProduit(f);
    setErreurs(err);
    if (!payload) return;
    setEnCours(true);
    setErreurGlobale(null);
    try {
      onSaved(produit ? await produitService.update(produit.id, payload) : await produitService.create(payload));
    } catch (ex) {
      if (ex instanceof ApiClientError) {
        if (Object.keys(ex.fieldErrors).length) setErreurs({ ...ex.fieldErrors, delai: ex.fieldErrors.delaiAlertePeremptionJours ?? '' });
        else setErreurGlobale(ex.message);
      }
    } finally {
      setEnCours(false);
    }
  };

  return (
    <Modal
      titre={produit ? `Modifier « ${produit.nom} »` : 'Nouveau produit'}
      onClose={onClose}
      pied={
        <>
          <button className="btn-secondaire" onClick={onClose}>Annuler</button>
          <button className="btn-primaire" onClick={() => enregistrer()} disabled={enCours}>
            {enCours ? 'Enregistrement…' : produit ? 'Enregistrer' : 'Créer le produit'}
          </button>
        </>
      }
    >
      <ErreurGlobale message={erreurGlobale} />
      <form onSubmit={enregistrer} noValidate className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Champ label="Nom du produit" requis erreur={erreurs.nom}>
            {(p) => <input {...p} value={f.nom} maxLength={150} onChange={maj('nom')} />}
          </Champ>
        </div>
        <Champ label="Catégorie" requis erreur={erreurs.categorieId}>
          {(p) => (
            <select {...p} value={f.categorieId} onChange={maj('categorieId')}>
              <option value="">Choisir…</option>
              {parFamille.map(([famille, cats]) => (
                <optgroup key={famille} label={famille}>
                  {cats.map((c) => (
                    <option key={c.id} value={c.id}>{c.nom}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          )}
        </Champ>
        <Champ label="Code-barre" erreur={erreurs.codeBarre} aide="Facultatif. Scannez-le ou saisissez-le.">
          {(p) => <input {...p} value={f.codeBarre} maxLength={60} inputMode="numeric" className={`${p.className} font-mono`} onChange={maj('codeBarre')} />}
        </Champ>
        <Champ label="Unité de base" requis erreur={erreurs.uniteBaseId} aide="Unité dans laquelle le stock est compté">
          {(p) => (
            <select {...p} value={f.uniteBaseId} onChange={maj('uniteBaseId')}>
              <option value="">Choisir…</option>
              {unites.map((u) => (
                <option key={u.id} value={u.id}>{u.nom} ({u.symbole})</option>
              ))}
            </select>
          )}
        </Champ>
        <Champ label={`Seuil d’alerte${symbole ? ` (en ${symbole})` : ''}`} requis erreur={erreurs.seuilAlerte} aide="Alerte stock critique en dessous de ce niveau">
          {(p) => <input {...p} value={f.seuilAlerte} inputMode="decimal" onChange={maj('seuilAlerte')} />}
        </Champ>
        {changementUnite && (
          <p className="rounded border-l-4 border-ambre bg-ambre-pale px-3 py-2 text-sm sm:col-span-2">
            Ce produit a {produit.nbPaquetages} conditionnement(s) exprimés en {produit.uniteBaseSymbole} : le changement d’unité sera refusé.
          </p>
        )}
        <Champ label="Prix d’achat" requis erreur={erreurs.prixAchat}>
          {(p) => <input {...p} value={f.prixAchat} inputMode="decimal" onChange={maj('prixAchat')} />}
        </Champ>
        <Champ label={`Prix de vente${symbole ? ` (par ${symbole})` : ''}`} requis erreur={erreurs.prixVente}>
          {(p) => <input {...p} value={f.prixVente} inputMode="decimal" onChange={maj('prixVente')} />}
        </Champ>
        {marge !== null && (
          <p className={`text-sm sm:col-span-2 ${marge < 0 ? 'font-medium text-alerte' : 'text-encre-douce'}`} aria-live="polite">
            {marge < 0
              ? `Attention : vente à perte (${formatMontant(marge)} par ${symbole || 'unité'}).`
              : `Marge : ${formatMontant(marge)}${pa > 0 ? ` (${Math.round((marge / pa) * 100)} % du prix d’achat)` : ''}.`}
          </p>
        )}
        <div className="flex flex-wrap items-end gap-4 sm:col-span-2">
          <label className="flex items-center gap-2 py-2 text-sm font-medium">
            <input type="checkbox" className="h-4 w-4 accent-acier" checked={f.perissable} onChange={(e) => setF((p) => ({ ...p, perissable: e.target.checked }))} />
            Produit périssable (suivi des dates de péremption)
          </label>
          {f.perissable && (
            <div className="w-56">
              <Champ label="Alerte avant péremption (jours)" requis erreur={erreurs.delai}>
                {(p) => <input {...p} value={f.delai} inputMode="numeric" onChange={maj('delai')} />}
              </Champ>
            </div>
          )}
        </div>
      </form>
    </Modal>
  );
}
