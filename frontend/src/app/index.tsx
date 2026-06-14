import { Redirect } from 'expo-router';

export default function Index() {
  // Цей файл просто запобігає помилці "Missing route" на кореневому URL `/`.
  // _layout.tsx автоматично перенаправить користувача у відповідну оболонку.
  return <Redirect href="/(auth)/login" />;
}
