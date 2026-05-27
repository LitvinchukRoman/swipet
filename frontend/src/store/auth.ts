import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';

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
      SecureStore.setItemAsync(KEYS.ACCESS, accessToken),
      SecureStore.setItemAsync(KEYS.REFRESH, refreshToken),
      SecureStore.setItemAsync(KEYS.USER, JSON.stringify(user)),
    ]);
    set({ user, accessToken, refreshToken });
  },

  clearAuth: async () => {
    await Promise.all([
      SecureStore.deleteItemAsync(KEYS.ACCESS),
      SecureStore.deleteItemAsync(KEYS.REFRESH),
      SecureStore.deleteItemAsync(KEYS.USER),
    ]);
    set({ user: null, accessToken: null, refreshToken: null });
  },

  setAccessToken: async (token) => {
    await SecureStore.setItemAsync(KEYS.ACCESS, token);
    set({ accessToken: token });
  },

  loadFromStorage: async () => {
    try {
      const [access, refresh, userJson] = await Promise.all([
        SecureStore.getItemAsync(KEYS.ACCESS),
        SecureStore.getItemAsync(KEYS.REFRESH),
        SecureStore.getItemAsync(KEYS.USER),
      ]);
      const user = userJson ? (JSON.parse(userJson) as User) : null;
      set({ accessToken: access, refreshToken: refresh, user, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },
}));
