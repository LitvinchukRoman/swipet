import "@/global.css";

import { Slot, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { GlobalDialog } from '@/components/common/GlobalDialog';
import { roleFromToken } from '@/lib/jwt';
import { homePathForRole } from '@/lib/roles';
import { useAuthStore } from '@/store/auth';

export default function RootLayout() {
  const { accessToken, user, isLoading, loadFromStorage } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    loadFromStorage();
  }, []);

  // Role-based routing: keep the user in their respective route group.
  useEffect(() => {
    if (isLoading) return;
    if (!segments.length) return;

    const group = segments[0];
    const inAuthGroup = group === '(auth)';

    if (!accessToken) {
      if (!inAuthGroup) router.replace('/(auth)/login');
      return;
    }

    // The user cache might not be loaded yet — so we take the role from the valid JWT.
    // This prevents a SHELTER_ADMIN/ADMIN from being mistakenly redirected to the USER shell.
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
      <GlobalDialog />
    </GestureHandlerRootView>
  );
}
