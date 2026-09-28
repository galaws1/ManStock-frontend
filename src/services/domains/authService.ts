import { api } from '../axiosConfig';
import type { ChangePasswordRequest, CurrentUser, LoginRequest, LoginResponse } from '../../types/auth';

export const authService = {
  async login(payload: LoginRequest): Promise<LoginResponse> {
    const { data } = await api.post<LoginResponse>('/auth/login', payload);
    return data;
  },
  async me(): Promise<CurrentUser> {
    const { data } = await api.get<CurrentUser>('/auth/me');
    return data;
  },
  async changerMotDePasse(payload: ChangePasswordRequest): Promise<void> {
    await api.put('/auth/mot-de-passe', payload);
  },
};
