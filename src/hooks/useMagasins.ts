import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { magasinService } from '../services/domains/magasinService';
import type { Option } from '../types/common';

/**
 * Magasins actifs et magasin de travail : celui de l'utilisateur s'il y est rattaché
 * (non modifiable), sinon le premier de la liste (modifiable).
 */
export function useMagasins() {
  const { user } = useAuth();
  const [magasins, setMagasins] = useState<Option[]>([]);
  const [magasinId, setMagasinId] = useState<number | undefined>(user?.magasinId);

  useEffect(() => {
    magasinService
      .options()
      .then((m) => {
        setMagasins(m);
        setMagasinId((actuel) => actuel ?? user?.magasinId ?? m[0]?.id);
      })
      .catch(() => setMagasins([]));
  }, [user?.magasinId]);

  return { magasins, magasinId, setMagasinId, verrouille: !!user?.magasinId };
}
