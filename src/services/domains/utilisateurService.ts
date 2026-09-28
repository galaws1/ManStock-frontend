import { ApiService } from '../ApiService';
import { api } from '../axiosConfig';
import type { Utilisateur, UtilisateurCreateRequest, UtilisateurUpdateRequest } from '../../types/utilisateur';

class UtilisateurService extends ApiService<Utilisateur, UtilisateurCreateRequest, UtilisateurUpdateRequest> {
  constructor() {
    super('utilisateurs');
  }

  /** La liste des utilisateurs est paginée côté serveur : utiliser getPage(). */
  override async getAll(): Promise<Utilisateur[]> {
    throw new Error('Liste paginée : utilisez utilisateurService.getPage()');
  }

  /** Pas de suppression : on active / désactive (traçabilité des ventes et mouvements). */
  async changerStatut(id: number, actif: boolean): Promise<Utilisateur> {
    const { data } = await api.patch<Utilisateur>(this.url(`${id}/statut`), { actif });
    return data;
  }

  /** Le mot de passe redevient l'identifiant ; changement obligatoire à la prochaine connexion. */
  async reinitialiserMotDePasse(id: number): Promise<void> {
    await api.post(this.url(`${id}/reinitialisation-mot-de-passe`));
  }

  override async delete(): Promise<void> {
    throw new Error('Les utilisateurs ne se suppriment pas : désactivez le compte.');
  }
}

export const utilisateurService = new UtilisateurService();
