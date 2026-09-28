export type FiltreStatutValeur = 'actifs' | 'inactifs' | 'tous';

/** Convertit le filtre en paramètre `actif` de l'API. */
export function actifDepuisFiltre(f: FiltreStatutValeur): boolean | undefined {
  return f === 'tous' ? undefined : f === 'actifs';
}

export function FiltreStatut({ valeur, onChange }: { valeur: FiltreStatutValeur; onChange: (v: FiltreStatutValeur) => void }) {
  return (
    <div role="group" aria-label="Filtrer par statut" className="inline-flex rounded border border-ligne bg-white p-0.5">
      {(['actifs', 'inactifs', 'tous'] as FiltreStatutValeur[]).map((s) => (
        <button
          key={s}
          aria-pressed={valeur === s}
          onClick={() => onChange(s)}
          className={`rounded-sm px-3 py-1.5 text-sm ${valeur === s ? 'bg-acier font-semibold text-white' : 'text-encre-douce hover:text-encre'}`}
        >
          {s === 'actifs' ? 'Actifs' : s === 'inactifs' ? 'Désactivés' : 'Tous'}
        </button>
      ))}
    </div>
  );
}
