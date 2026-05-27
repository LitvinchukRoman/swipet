import { Tabs } from 'expo-router';
import { Text } from 'react-native';

const TAB_ICON: Record<string, string> = {
  index: '🐾',
  liked: '❤️',
  chat: '💬',
  profile: '👤',
};

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#FF6B6B',
        tabBarInactiveTintColor: '#999',
        tabBarStyle: { paddingBottom: 4 },
        tabBarIcon: ({ focused }) => (
          <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.5 }}>
            {TAB_ICON[route.name] ?? '●'}
          </Text>
        ),
      })}
    >
      <Tabs.Screen name="index" options={{ title: 'Стрічка' }} />
      <Tabs.Screen name="liked" options={{ title: 'Вподобані' }} />
      <Tabs.Screen name="chat" options={{ title: 'Чат' }} />
      <Tabs.Screen name="profile" options={{ title: 'Профіль' }} />
    </Tabs>
  );
}
