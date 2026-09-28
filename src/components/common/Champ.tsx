import { useId, type ReactNode } from 'react';

interface Props {
  label: string;
  erreur?: string;
  aide?: string;
  requis?: boolean;
  children: (props: { id: string; 'aria-invalid': boolean; 'aria-describedby'?: string; className: string }) => ReactNode;
}

/** Champ de formulaire : libellé, message d'erreur et aide reliés par ARIA. */
export function Champ({ label, erreur, aide, requis, children }: Props) {
  const id = useId();
  const descId = erreur || aide ? `${id}-desc` : undefined;
  return (
    <div>
      <label htmlFor={id} className="etiquette">
        {label}
        {requis && <span className="text-alerte"> *</span>}
      </label>
      {children({ id, 'aria-invalid': !!erreur, 'aria-describedby': descId, className: `champ ${erreur ? 'champ-erreur' : ''}` })}
      {erreur ? (
        <p id={descId} className="mt-1 text-xs text-alerte">
          {erreur}
        </p>
      ) : aide ? (
        <p id={descId} className="mt-1 text-xs text-encre-douce">
          {aide}
        </p>
      ) : null}
    </div>
  );
}
