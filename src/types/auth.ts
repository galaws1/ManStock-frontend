export interface CurrentUser {
  id: number;
  username: string;
  nom: string;
  prenom?: string;
  roleCode: string;
  roleLibelle: string;
  magasinId?: number;
  magasinNom?: string;
  /** TRUE : l'utilisateur doit changer son mot de passe avant d'accéder à l'application. */
  doitChangerMotDePasse: boolean;
}

export interface LoginRequest {
  username: string;
  motDePasse: string;
}

export interface LoginResponse {
  token: string;
  expiresAt: string;
  utilisateur: CurrentUser;
}

export interface ChangePasswordRequest {
  ancienMotDePasse: string;
  nouveauMotDePasse: string;
}
