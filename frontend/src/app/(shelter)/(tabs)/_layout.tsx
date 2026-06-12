import { Tabs } from 'expo-router';
import { LayoutDashboard, MessageCircle, PawPrint, Store } from 'lucide-react-native';

import { FloatingTabBar, type TabConfig } from '@/components/navigation/FloatingTabBar';

const TABS: TabConfig[] = [
  { name: 'index', label: 'Дашборд', Icon: LayoutDashboard },
  { name: 'animals', label: 'Тварини', Icon: PawPrint },
  { name: 'chat', label: 'Чат', Icon: MessageCircle },
  { name: 'profile', label: 'Профіль', Icon: Store },
];

export default function ShelterTabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} tabs={TABS} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" options={{ title: 'Дашборд' }} />
      <Tabs.Screen name="animals" options={{ title: 'Тварини' }} />
      <Tabs.Screen name="chat" options={{ title: 'Чат' }} />
      <Tabs.Screen name="profile" options={{ title: 'Профіль' }} />
    </Tabs>
  );
}
