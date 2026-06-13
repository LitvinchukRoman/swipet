import axios from 'axios';

import { useAuthStore } from '@/store/auth';

// Дефолт — HTTPS: веб-білд віддається nginx-ом по https://localhost, тож HTTP-дефолт
// блокувався б браузером як mixed content. EXPO_PUBLIC_API_URL (якщо заданий) перекриває.
const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://localhost/api/v1';

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// Attach Bearer token to every request
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Single-flight refresh: the app fires several authed requests in parallel on
// boot. The backend ROTATES the refresh token on each /auth/refresh, so if every
// 401'd request refreshed independently, the first would invalidate the shared
// token and the rest would get "revoked" -> spurious logout. We dedupe so only
// one refresh runs; everyone else awaits its result.
let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(refreshToken: string, epoch: number): Promise<string> {
  const { data } = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });

  // If the user logged out / logged in while this refresh was in flight, the
  // session epoch changed — drop the result instead of resurrecting a dead session.
  if (useAuthStore.getState().sessionEpoch !== epoch) {
    throw new Error('SESSION_CHANGED');
  }

  // Persist BOTH the new access AND the rotated refresh token.
  await useAuthStore.getState().setTokens(data.accessToken, data.refreshToken ?? refreshToken);
  // Backend returns the fresh user (TokenResponse.user) — keep role/profile in sync
  // so the root role-guard never acts on a stale role.
  if (data.user) {
    await useAuthStore.getState().updateUser(data.user);
  }
  return data.accessToken;
}

// On 401 — try to refresh the access token, then retry the original request
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;

      const { refreshToken, clearAuth, sessionEpoch } = useAuthStore.getState();
      if (!refreshToken) {
        await clearAuth();
        return Promise.reject(error);
      }

      const epochAtStart = sessionEpoch;
      try {
        if (!refreshPromise) {
          refreshPromise = refreshAccessToken(refreshToken, epochAtStart).finally(() => {
            refreshPromise = null;
          });
        }
        const newAccessToken = await refreshPromise;
        // Session changed during refresh (logout/login) — don't retry on a dead session.
        if (useAuthStore.getState().sessionEpoch !== epochAtStart) {
          return Promise.reject(error);
        }
        original.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(original);
      } catch {
        // Only force-logout if this is still the same session that 401'd.
        if (useAuthStore.getState().sessionEpoch === epochAtStart) {
          await clearAuth();
        }
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);
