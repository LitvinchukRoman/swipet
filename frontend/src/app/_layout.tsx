import "@/global.css";

import { Slot, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { useAuthStore } from '@/store/auth';

// Кожна роль має «домашню» оболонку (групу маршрутів).
const HOME_BY_ROLE = {
  ADMIN: '/(admin)/(tabs)',
  SHELTER_ADMIN: '/(shelter)/(tabs)',
  USER: '/(app)/(tabs)',
} as const;

export default function RootLayout() {
  const { accessToken, user, isLoading, loadFromStorage } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    loadFromStorage();
  }, []);

  // Маршрутизація за роллю: тримаємо користувача у його оболонці.
  useEffect(() => {
    if (isLoading) return;

    const group = segments[0];
    const inAuthGroup = group === '(auth)';

    if (!accessToken) {
      if (!inAuthGroup) router.replace('/(auth)/login');
      return;
    }

    const role = user?.role ?? 'USER';
    const homePath = HOME_BY_ROLE[role] ?? HOME_BY_ROLE.USER;

    const inHomeGroup =
      (role === 'ADMIN' && group === '(admin)') ||
      (role === 'SHELTER_ADMIN' && group === '(shelter)') ||
      (role === 'USER' && group === '(app)');

    if (inAuthGroup || !inHomeGroup) {
      router.replace(homePath);
    }
  }, [accessToken, user?.role, isLoading, segments]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Slot />
    </GestureHandlerRootView>
  );
}
