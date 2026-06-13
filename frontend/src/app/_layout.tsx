import "@/global.css";

import { Slot, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { useAuthStore } from '@/store/auth';
import { homePathForRole } from '@/lib/roles';
import { roleFromToken } from '@/lib/jwt';

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

    // Кеш user може ще не підвантажитись — тоді беремо роль із валідного JWT,
    // щоб не кинути SHELTER_ADMIN/ADMIN помилково в USER-оболонку.
    const role = user?.role ?? roleFromToken(accessToken) ?? 'USER';
    const homePath = homePathForRole(role);

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
