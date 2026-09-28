import type { Auditable } from './api';

export interface Fournisseur extends Auditable {
  id: number;
  nom: string;
  contact?: string;
  telephone?: string;
  email?: string;
  adresse?: string;
}
export type FournisseurRequest = Omit<Fournisseur, 'id' | keyof Auditable>;

export interface Client extends Auditable {
  id: number;
  nom: string;
  contact?: string;
  telephone?: string;
  email?: string;
}
export type ClientRequest = Omit<Client, 'id' | keyof Auditable>;
