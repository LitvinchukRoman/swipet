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

// On 401 — try to refresh the access token, then retry the original request
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;

      const { refreshToken, setAccessToken, clearAuth } = useAuthStore.getState();
      if (!refreshToken) {
        await clearAuth();
        return Promise.reject(error);
      }

      try {
        const { data } = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });
        await setAccessToken(data.accessToken);
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(original);
      } catch {
        await clearAuth();
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);
