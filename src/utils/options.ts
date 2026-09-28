import type { Option } from '../types/common';

/**
 * Les listes d'options ne contiennent que les éléments ACTIFS. En modification, l'élément
 * actuellement rattaché peut avoir été désactivé : on l'ajoute pour qu'il reste sélectionné.
 */
export function avecOptionActuelle(options: Option[], id?: number, libelle?: string): Option[] {
  if (!id || options.some((o) => o.id === id)) return options;
  return [...options, { id, libelle: `${libelle ?? `#${id}`} (désactivé)` }];
}
