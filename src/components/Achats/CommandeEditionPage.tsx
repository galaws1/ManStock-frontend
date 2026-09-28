import { ArrowLeft, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useStock } from '../../context/StockContext';
import { useMagasins } from '../../hooks/useMagasins';
import { ApiClientError } from '../../services/axiosConfig';
import { commandeService } from '../../services/domains/commandeService';
import { fournisseurService } from '../../services/domains/partenaireService';
import type { Option } from '../../types/common';
import { formatMontant, parseNombre, versSaisie } from '../../utils/formatters';
import { ErreurGlobale } from '../common/ErreurGlobale';
import { ProduitPicker } from '../common/ProduitPicker';

interface Ligne {
  produitId: number;
  produitNom: string;
  uniteSymbole: string;
  quantite: string;
  prix: string;
}

/** Lignes valides → requête ; sinon message d'erreur. */
export function validerLignesCommande(lignes: Ligne[]): { erreur?: string; lignes?: { produitId: number; quantite: number; prixUnitaire: number }[] } {
  if (lignes.length === 0) return { erreur: 'Ajoutez au moins un produit' };
  const res = [];
  for (const l of lignes) {
    const q = parseNombre(l.quantite);
    const p = parseNombre(l.prix);
    if (Number.isNaN(q) || q <= 0) return { erreur: `Quantité invalide pour « ${l.produitNom} »` };
    if (Number.isNaN(p) || p < 0) return { erreur: `Prix invalide pour « ${l.produitNom} »` };
    res.push({ produitId: l.produitId, quantite: q, prixUnitaire: p });
  }
  return { lignes: res };
}

export function CommandeEditionPage() {
  const params = useParams();
  const id = params.id ? Number(params.id) : undefined;
  const navigate = useNavigate();
  const { showToast } = useStock();
  const { magasins, magasinId, setMagasinId, verrouille } = useMagasins();
  const [fournisseurs, setFournisseurs] = useState<Option[]>([]);
  const [fournisseurId, setFournisseurId] = useState('');
  const [lignes, setLignes] = useState<Ligne[]>([]);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    fournisseurService.options().then(setFournisseurs).catch(() => setFournisseurs([]));
    if (!id) return;
    commandeService.getById(id).then((c) => {
      setFournisseurId(String(c.fournisseurId));
      setMagasinId(c.magasinId);
      setLignes((c.lignes ?? []).map((l) => ({ produitId: l.produitId, produitNom: l.produitNom, uniteSymbole: l.uniteSymbole, quantite: versSaisie(l.quantite), prix: versSaisie(l.prixUnitaire) })));
    });
  }, [id, setMagasinId]);

  const total = lignes.reduce((s, l) => s + (parseNombre(l.quantite) || 0) * (parseNombre(l.prix) || 0), 0);
  const maj = (i: number, patch: Partial<Ligne>) => setLignes(lignes.map((l, j) => (j === i ? { ...l, ...patch } : l)));

  const enregistrer = async () => {
    if (!fournisseurId) return setErreur('Choisissez un fournisseur');
    const v = validerLignesCommande(lignes);
    if (v.erreur) return setErreur(v.erreur);
    try {
      const payload = { fournisseurId: Number(fournisseurId), magasinId: magasinId!, lignes: v.lignes! };
      const c = id ? await commandeService.update(id, payload) : await commandeService.create(payload);
      showToast(`Commande ${c.reference} enregistrée`);
      navigate(`/achats/commandes/${c.id}`);
    } catch (e) {
      setErreur(e instanceof ApiClientError ? e.message : 'Enregistrement impossible');
    }
  };

  return (
    <div>
      <Link to="/achats/commandes" className="mb-3 inline-flex items-center gap-1 text-sm text-encre-douce hover:text-encre"><ArrowLeft size={14} aria-hidden /> Commandes</Link>
      <h1 className="mb-6">{id ? 'Modifier la commande' : 'Nouvelle commande fournisseur'}</h1>
      <ErreurGlobale message={erreur} />
      <div className="mb-4 grid gap-4 sm:grid-cols-2">
        <label>
          <span className="etiquette">Fournisseur</span>
          <select className="champ" value={fournisseurId} onChange={(e) => setFournisseurId(e.target.value)}>
            <option value="">Choisir…</option>
            {fournisseurs.map((f) => <option key={f.id} value={f.id}>{f.libelle}</option>)}
          </select>
        </label>
        <label>
          <span className="etiquette">Magasin livré</span>
          <select className="champ" value={magasinId ?? ''} disabled={verrouille} onChange={(e) => setMagasinId(Number(e.target.value))}>
            {magasins.map((m) => <option key={m.id} value={m.id}>{m.libelle}</option>)}
          </select>
        </label>
      </div>
      <div className="mb-3">
        <ProduitPicker scan={false} placeholder="Ajouter un produit"
          onChoix={(c) => !lignes.some((l) => l.produitId === c.produitId) &&
            setLignes([...lignes, { produitId: c.produitId, produitNom: c.produitNom, uniteSymbole: c.uniteSymbole, quantite: '1', prix: versSaisie(c.prixAchat ?? 0) }])} />
      </div>
      <div className="overflow-x-auto rounded border border-ligne bg-white">
        <table className="w-full min-w-[34rem] text-sm">
          <thead className="border-b border-ligne bg-papier text-left text-encre-douce">
            <tr><th className="px-3 py-2 font-semibold">Produit</th><th className="px-3 py-2 text-right font-semibold">Quantité (unité de base)</th><th className="px-3 py-2 text-right font-semibold">Prix d’achat unitaire</th><th className="px-3 py-2 text-right font-semibold">Montant</th><th className="w-10" /></tr>
          </thead>
          <tbody>
            {lignes.length === 0 && <tr><td colSpan={5} className="px-3 py-8 text-center text-encre-douce">Aucun produit.</td></tr>}
            {lignes.map((l, i) => (
              <tr key={l.produitId} className="border-b border-ligne last:border-0">
                <td className="px-3 py-2 font-medium">{l.produitNom}</td>
                <td className="px-3 py-2"><div className="flex items-center justify-end gap-1.5"><input aria-label={`Quantité de ${l.produitNom}`} className="champ w-24 py-1 text-right" inputMode="decimal" value={l.quantite} onChange={(e) => maj(i, { quantite: e.target.value })} /><span className="w-8 text-encre-douce">{l.uniteSymbole}</span></div></td>
                <td className="px-3 py-2 text-right"><input aria-label={`Prix de ${l.produitNom}`} className="champ w-28 py-1 text-right" inputMode="decimal" value={l.prix} onChange={(e) => maj(i, { prix: e.target.value })} /></td>
                <td className="px-3 py-2 text-right tabular-nums">{formatMontant((parseNombre(l.quantite) || 0) * (parseNombre(l.prix) || 0))}</td>
                <td className="px-2"><button className="btn-discret px-1.5 hover:!text-alerte" aria-label={`Retirer ${l.produitNom}`} onClick={() => setLignes(lignes.filter((_, j) => j !== i))}><Trash2 size={15} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-4 flex items-center justify-end gap-4">
        <p className="text-lg font-bold">Total : <span className="tabular-nums">{formatMontant(total)}</span></p>
        <Link to="/achats/commandes" className="btn-secondaire">Annuler</Link>
        <button className="btn-primaire" onClick={enregistrer} disabled={!magasinId}>Enregistrer le brouillon</button>
      </div>
    </div>
  );
}
