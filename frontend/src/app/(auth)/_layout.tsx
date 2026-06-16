import { Stack } from 'expo-router';

/**
 * Navigation layout for authentication flows (Login and Registration).
 * Redirects authenticated users away from these screens.
 */
export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
    </Stack>
  );
}
