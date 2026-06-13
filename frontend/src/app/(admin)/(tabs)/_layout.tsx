import { Tabs } from 'expo-router';
import { LayoutDashboard, Shield, Store, Users } from 'lucide-react-native';

import { FloatingTabBar, type TabConfig } from '@/components/navigation/FloatingTabBar';

const TABS: TabConfig[] = [
  { name: 'index', label: 'Overview', Icon: LayoutDashboard },
  { name: 'shelters', label: 'Shelters', Icon: Store },
  { name: 'users', label: 'Users', Icon: Users },
  { name: 'profile', label: 'Profile', Icon: Shield },
];

export default function AdminTabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} tabs={TABS} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" options={{ title: 'Overview' }} />
      <Tabs.Screen name="shelters" options={{ title: 'Shelters' }} />
      <Tabs.Screen name="users" options={{ title: 'Users' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}
