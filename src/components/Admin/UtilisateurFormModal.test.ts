import { describe, expect, it } from 'vitest';
import { validerUtilisateur } from './UtilisateurFormModal';

const base = { nom: 'Bernard', prenom: '', username: 'lucie', motDePasse: 'Secret123', roleId: '2', magasinId: '' };

describe('validerUtilisateur', () => {
  it('formulaire valide', () => expect(validerUtilisateur(base, true)).toEqual({}));
  it('signale chaque champ fautif', () => {
    const e = validerUtilisateur({ ...base, nom: '  ', username: 'a b', motDePasse: 'court', roleId: '' }, true);
    expect(Object.keys(e).sort()).toEqual(['motDePasse', 'nom', 'roleId', 'username']);
  });
  it('le mot de passe n’est pas exigé en modification', () => {
    expect(validerUtilisateur({ ...base, motDePasse: '' }, false)).toEqual({});
  });
});
