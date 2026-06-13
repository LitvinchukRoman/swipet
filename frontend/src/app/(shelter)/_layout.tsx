import { Stack } from 'expo-router';

import { Colors, FontSize, FontWeight } from '@/lib/theme';

// Shelter-admin shell (SHELTER_ADMIN). Access is gated by the root _layout by role.
export default function ShelterLayout() {
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
