import type { ReactNode } from 'react';

export function PageEntete({ titre, description, actions }: { titre: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1>{titre}</h1>
        {description && <p className="mt-1 max-w-prose text-sm text-encre-douce">{description}</p>}
      </div>
      {actions && <div className="flex gap-2">{actions}</div>}
    </div>
  );
}
