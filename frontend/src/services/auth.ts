import { api } from './api';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  fullName: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: number;
    email: string;
    fullName: string;
    phone?: string;
    avatarUrl?: string;
    role: 'USER' | 'SHELTER_ADMIN' | 'ADMIN';
    isEmailVerified: boolean;
  };
}

export const authService = {
  login: (payload: LoginPayload) =>
    api.post<AuthResponse>('/auth/login', payload).then((r) => r.data),

  register: (payload: RegisterPayload) =>
    api.post<{ userId: number; message: string }>('/auth/register', payload).then((r) => r.data),

  logout: (refreshToken: string) =>
    api.post('/auth/logout', { refreshToken }),

  getMe: () =>
    api.get<AuthResponse['user']>('/auth/me').then((r) => r.data),
};
