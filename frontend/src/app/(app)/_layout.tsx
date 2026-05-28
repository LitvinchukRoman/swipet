import { Stack } from 'expo-router';

export default function AppLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, headerBackTitle: 'Назад', headerTintColor: '#FF6B6B' }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="animal/[id]" options={{ headerShown: true, headerTransparent: true, title: '' }} />
      <Stack.Screen name="shelter/[id]" options={{ headerShown: true, title: 'Притулок' }} />
      <Stack.Screen name="shelter/dashboard" options={{ headerShown: true, title: 'Дашборд' }} />
      <Stack.Screen name="chat/[id]" options={{ headerShown: true, title: 'Розмова' }} />
      <Stack.Screen name="profile/edit" options={{ headerShown: true, title: 'Редагування' }} />
      <Stack.Screen name="guardianship" options={{ headerShown: true, title: 'Мої підопічні' }} />
    </Stack>
  );
}
