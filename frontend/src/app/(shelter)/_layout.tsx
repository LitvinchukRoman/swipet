import { Stack } from 'expo-router';

import { Colors, FontSize, FontWeight } from '@/lib/theme';

// Оболонка притулку (SHELTER_ADMIN). Доступ контролює root _layout за роллю.
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
      <Stack.Screen name="animal/[id]" options={{ headerShown: true, title: 'Тварина' }} />
      <Stack.Screen name="analytics" options={{ headerShown: true, title: 'Аналітика' }} />
      <Stack.Screen name="slots" options={{ headerShown: true, title: 'Слоти візитів' }} />
      <Stack.Screen name="shelter-edit" options={{ headerShown: true, title: 'Профіль притулку' }} />
      <Stack.Screen name="chat/[id]" options={{ headerShown: true, title: 'Розмова' }} />
    </Stack>
  );
}
