import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { Colors, FontSize, FontWeight } from '@/lib/theme';
import { useShelterStore } from '@/store/shelter';

// Shelter-admin shell (SHELTER_ADMIN). Access is gated by the root _layout by role.
export default function ShelterLayout() {
  const { status, load } = useShelterStore();

  useEffect(() => {
    if (status === 'idle') {
      load();
    }
  }, [status, load]);

  if (status === 'idle' || status === 'loading') {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.neutral[50], alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={Colors.primary[500]} />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        headerShadowVisible: false,
        headerTintColor: Colors.primary[500],
        headerStyle: { backgroundColor: Colors.neutral[0] },
        headerTitleStyle: {
          fontSize: FontSize.md,
          fontWeight: FontWeight.bold,
          color: Colors.neutral[900],
        },
        contentStyle: { backgroundColor: Colors.neutral[50] },
      }}
    >
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="animal/[id]" options={{ headerShown: true, title: 'Animal' }} />
      <Stack.Screen name="analytics" options={{ headerShown: true, title: 'Analytics' }} />
      <Stack.Screen name="slots" options={{ headerShown: true, title: 'Visit Slots' }} />
      <Stack.Screen name="shelter-edit" options={{ headerShown: true, title: 'Shelter Profile' }} />
      <Stack.Screen name="chat/[id]" options={{ headerShown: true, title: 'Conversation' }} />
    </Stack>
  );
}
