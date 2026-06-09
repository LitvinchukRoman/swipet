import { Stack } from 'expo-router';
import { Colors, FontSize, FontWeight } from '@/lib/theme';
 
export default function AppLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        headerStyle: {
          backgroundColor: Colors.neutral[0],
        },
        headerShadowVisible: false,
        headerTintColor: Colors.primary[500],
        headerTitleStyle: {
          fontSize: FontSize.md,
          fontWeight: FontWeight.bold,
          color: Colors.neutral[900],
        },
        contentStyle: {
          backgroundColor: Colors.neutral[50],
        },
      }}
    >
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="shelter/dashboard"
        options={{ headerShown: true, title: 'Dashboard' }}
      />
      <Stack.Screen
        name="chat/[id]"
        options={{ headerShown: true, title: 'Conversation' }}
      />
      <Stack.Screen
        name="profile/edit"
        options={{ headerShown: true, title: 'Edit Profile' }}
      />
      <Stack.Screen
        name="guardianship"
        options={{ headerShown: true, title: 'My Wards' }}
      />
      <Stack.Screen
        name="shelter/register"
        options={{ headerShown: true, title: 'Реєстрація притулку' }}
      />
      <Stack.Screen
        name="shelter/analytics"
        options={{ headerShown: true, title: 'Аналітика' }}
      />
      <Stack.Screen
        name="shelter/animal/new"
        options={{ headerShown: true, title: 'Тварина' }}
      />
      <Stack.Screen
        name="shelter/booking/slots"
        options={{ headerShown: true, title: 'Слоти візитів' }}
      />
    </Stack>
  );
}