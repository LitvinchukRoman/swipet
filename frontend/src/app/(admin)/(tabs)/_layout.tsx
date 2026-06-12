import { Tabs } from 'expo-router';
import { LayoutDashboard, Shield, Store, Users } from 'lucide-react-native';

import { FloatingTabBar, type TabConfig } from '@/components/navigation/FloatingTabBar';

const TABS: TabConfig[] = [
  { name: 'index', label: 'Огляд', Icon: LayoutDashboard },
  { name: 'shelters', label: 'Притулки', Icon: Store },
  { name: 'users', label: 'Юзери', Icon: Users },
  { name: 'profile', label: 'Профіль', Icon: Shield },
];

export default function AdminTabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} tabs={TABS} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" options={{ title: 'Огляд' }} />
      <Tabs.Screen name="shelters" options={{ title: 'Притулки' }} />
      <Tabs.Screen name="users" options={{ title: 'Юзери' }} />
      <Tabs.Screen name="profile" options={{ title: 'Профіль' }} />
    </Tabs>
  );
}
