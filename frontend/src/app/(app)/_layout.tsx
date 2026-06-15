import { Colors, FontSize, FontWeight } from '@/lib/theme';
import { Stack } from 'expo-router';

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
        name="visits"
        options={{ headerShown: true, title: 'My Visits' }}
      />
    </Stack>
  );
}
