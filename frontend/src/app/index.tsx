import { Redirect } from 'expo-router';

export default function Index() {
  // This file simply prevents a "Missing route" error on the root URL `/`.
  // _layout.tsx will automatically redirect the user to the correct route group.
  return <Redirect href="/(auth)/login" />;
}
