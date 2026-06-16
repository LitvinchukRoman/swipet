import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/**
 * Платформо-незалежне сховище токенів.
 * - Native (iOS/Android): expo-secure-store (зашифроване — Keychain / Keystore).
 * - Web: localStorage (expo-secure-store не має web-реалізації).
 *
 * Інтерфейс async на обох платформах, тож код стора не залежить від платформи.
 */
const isWeb = Platform.OS === 'web';

/**
 * Secure key-value storage wrapper for persisting tokens and app state using Expo SecureStore.
 */
export const storage = {
  getItem: async (key: string): Promise<string | null> => {
    if (isWeb) {
      try {
        return globalThis.localStorage?.getItem(key) ?? null;
      } catch {
        return null;
      }
    }
    return SecureStore.getItemAsync(key);
  },

  setItem: async (key: string, value: string): Promise<void> => {
    if (isWeb) {
      try {
        globalThis.localStorage?.setItem(key, value);
      } catch {
        /* приватний режим браузера тощо */
      }
      return;
    }
    await SecureStore.setItemAsync(key, value);
  },

  removeItem: async (key: string): Promise<void> => {
    if (isWeb) {
      try {
        globalThis.localStorage?.removeItem(key);
      } catch {
        /* ignore */
      }
      return;
    }
    await SecureStore.deleteItemAsync(key);
  },
};
