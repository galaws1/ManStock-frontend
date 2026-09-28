import { Search } from 'lucide-react';

export function ChampRecherche({ valeur, onChange, placeholder, label }: { valeur: string; onChange: (v: string) => void; placeholder: string; label: string }) {
  return (
    <label className="relative min-w-[16rem] flex-1 sm:max-w-sm">
      <span className="sr-only">{label}</span>
      <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-encre-douce" aria-hidden />
      <input className="champ pl-9" placeholder={placeholder} value={valeur} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}
