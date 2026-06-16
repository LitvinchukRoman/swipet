import { Stack } from 'expo-router';

import { Colors, FontSize, FontWeight } from '@/lib/theme';

// Admin shell (ADMIN). Access is gated by the root _layout by role.
/**
 * Root layout for the authenticated system administrator role.
 */
export default function AdminLayout() {
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
      <Stack.Screen name="shelter-new" options={{ headerShown: true, title: 'New Shelter' }} />
    </Stack>
  );
}
