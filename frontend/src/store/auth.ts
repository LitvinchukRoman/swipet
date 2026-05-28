import { create } from 'zustand';

import { storage } from '@/lib/storage';

export interface User {
  id: number;
  email: string;
  fullName: string;
  phone?: string;
  avatarUrl?: string;
  role: 'USER' | 'SHELTER_ADMIN' | 'ADMIN';
  isEmailVerified: boolean;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;

  setAuth: (user: User, accessToken: string, refreshToken: string) => Promise<void>;
  clearAuth: () => Promise<void>;
  setAccessToken: (token: string) => Promise<void>;
  updateUser: (patch: Partial<User>) => Promise<void>;
  loadFromStorage: () => Promise<void>;
}

const KEYS = {
  ACCESS: 'swipet_access_token',
  REFRESH: 'swipet_refresh_token',
  USER: 'swipet_user',
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isLoading: true,

  setAuth: async (user, accessToken, refreshToken) => {
    await Promise.all([
      storage.setItem(KEYS.ACCESS, accessToken),
      storage.setItem(KEYS.REFRESH, refreshToken),
      storage.setItem(KEYS.USER, JSON.stringify(user)),
    ]);
    set({ user, accessToken, refreshToken });
  },

  clearAuth: async () => {
    await Promise.all([
      storage.removeItem(KEYS.ACCESS),
      storage.removeItem(KEYS.REFRESH),
      storage.removeItem(KEYS.USER),
    ]);
    set({ user: null, accessToken: null, refreshToken: null });
  },

  setAccessToken: async (token) => {
    await storage.setItem(KEYS.ACCESS, token);
    set({ accessToken: token });
  },

  updateUser: async (patch) => {
    const current = useAuthStore.getState().user;
    if (!current) return;
    const updated = { ...current, ...patch };
    await storage.setItem(KEYS.USER, JSON.stringify(updated));
    set({ user: updated });
  },

  loadFromStorage: async () => {
    try {
      const [access, refresh, userJson] = await Promise.all([
        storage.getItem(KEYS.ACCESS),
        storage.getItem(KEYS.REFRESH),
        storage.getItem(KEYS.USER),
      ]);
      const user = userJson ? (JSON.parse(userJson) as User) : null;
      set({ accessToken: access, refreshToken: refresh, user, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },
}));
