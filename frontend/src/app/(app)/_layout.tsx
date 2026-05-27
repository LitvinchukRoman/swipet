import { Stack } from 'expo-router';

export default function AppLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="animal/[id]" options={{ headerShown: true, title: '' }} />
      <Stack.Screen name="shelter/[id]" options={{ headerShown: true, title: '' }} />
      <Stack.Screen name="chat/[id]" options={{ headerShown: true }} />
    </Stack>
  );
}
