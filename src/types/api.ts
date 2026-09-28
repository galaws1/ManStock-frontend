/** Format d'erreur renvoyé par le backend (GlobalExceptionHandler / ApiError.java). */
export interface ApiErrorBody {
  timestamp?: string;
  status: number;
  error?: string;
  message: string;
  path?: string;
  fieldErrors?: Record<string, string>;
}

/** Colonnes d'audit présentes sur toutes les entités. */
export interface Auditable {
  createdBy?: string;
  createdAt?: string;
  updatedBy?: string;
  updatedAt?: string;
}
