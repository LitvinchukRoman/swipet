import { Stack } from 'expo-router';

import { Colors, FontSize, FontWeight } from '@/lib/theme';

// Оболонка адміністратора (ADMIN). Доступ контролює root _layout за роллю.
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
      <Stack.Screen name="shelter-new" options={{ headerShown: true, title: 'Новий притулок' }} />
    </Stack>
  );
}
