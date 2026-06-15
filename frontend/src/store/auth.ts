import { create } from 'zustand';

import { disconnectSocket } from '@/lib/socket';
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
  /** Інкрементується на кожен login/logout. In-flight refresh порівнює епоху,
   *  щоб не відновити стару сесію після виходу (race refresh ↔ logout). */
  sessionEpoch: number;

  setAuth: (user: User, accessToken: string, refreshToken: string) => Promise<void>;
  clearAuth: () => Promise<void>;
  setAccessToken: (token: string) => Promise<void>;
  setTokens: (accessToken: string, refreshToken: string) => Promise<void>;
  updateUser: (patch: Partial<User>) => Promise<void>;
  loadFromStorage: () => Promise<void>;
}

const KEYS = {
  ACCESS: 'swipet_access_token',
  REFRESH: 'swipet_refresh_token',
  USER: 'swipet_user',
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isLoading: true,
  sessionEpoch: 0,

  setAuth: async (user, accessToken, refreshToken) => {
    await Promise.all([
      storage.setItem(KEYS.ACCESS, accessToken),
      storage.setItem(KEYS.REFRESH, refreshToken),
      storage.setItem(KEYS.USER, JSON.stringify(user)),
    ]);
    set({ user, accessToken, refreshToken, sessionEpoch: get().sessionEpoch + 1 });
  },

  clearAuth: async () => {
    // Рвемо глобальний сокет лише тут (на logout), не в кожній кімнаті чату.
    disconnectSocket();
    await Promise.all([
      storage.removeItem(KEYS.ACCESS),
      storage.removeItem(KEYS.REFRESH),
      storage.removeItem(KEYS.USER),
    ]);
    set({ user: null, accessToken: null, refreshToken: null, sessionEpoch: get().sessionEpoch + 1 });
  },

  setAccessToken: async (token) => {
    await storage.setItem(KEYS.ACCESS, token);
    set({ accessToken: token });
  },

  // Persist BOTH tokens after a refresh. The backend rotates the refresh token
  // on every /auth/refresh, so failing to store the new one revokes the session
  // on the next refresh.
  setTokens: async (accessToken, refreshToken) => {
    await Promise.all([
      storage.setItem(KEYS.ACCESS, accessToken),
      storage.setItem(KEYS.REFRESH, refreshToken),
    ]);
    set({ accessToken, refreshToken });
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
