import { X } from 'lucide-react';
import { useEffect, useId, useRef, type ReactNode } from 'react';

interface Props {
  titre: string;
  onClose: () => void;
  children: ReactNode;
  pied?: ReactNode;
  largeur?: 'sm' | 'md';
}

/** Fenêtre modale accessible (Échap pour fermer, focus initial, aria-modal). */
export function Modal({ titre, onClose, children, pied, largeur = 'md' }: Props) {
  const titreId = useId();
  const panneau = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const premier = panneau.current?.querySelector<HTMLElement>('input, select, textarea, button');
    premier?.focus();
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-encre/40 p-0 sm:items-center sm:p-4">
      <div
        ref={panneau}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titreId}
        className={`flex max-h-[92vh] w-full flex-col rounded-t-lg bg-white shadow-xl sm:rounded-lg ${largeur === 'sm' ? 'sm:max-w-md' : 'sm:max-w-xl'}`}
      >
        <header className="flex items-center justify-between border-b border-ligne px-5 py-4">
          <h2 id={titreId}>{titre}</h2>
          <button onClick={onClose} className="btn-discret" aria-label="Fermer">
            <X size={18} />
          </button>
        </header>
        <div className="overflow-y-auto px-5 py-4">{children}</div>
        {pied && <footer className="flex justify-end gap-2 border-t border-ligne px-5 py-3">{pied}</footer>}
      </div>
    </div>
  );
}
