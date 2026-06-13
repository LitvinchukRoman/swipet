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

// Бекенд повертає пару токенів уже на реєстрації (RegisterResponse.tokens),
// тож окремий login після register не потрібен.
export interface RegisterResponse {
  userId: number;
  message: string;
  tokens: AuthResponse;
}

export const authService = {
  login: (payload: LoginPayload) =>
    api.post<AuthResponse>('/auth/login', payload).then((r) => r.data),

  register: (payload: RegisterPayload) =>
    api.post<RegisterResponse>('/auth/register', payload).then((r) => r.data),

  logout: (refreshToken: string) =>
    api.post('/auth/logout', { refreshToken }),

  getMe: () =>
    api.get<AuthResponse['user']>('/auth/me').then((r) => r.data),
};
