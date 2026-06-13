import { Tabs } from 'expo-router';
import { LayoutDashboard, MessageCircle, PawPrint, Store } from 'lucide-react-native';

import { FloatingTabBar, type TabConfig } from '@/components/navigation/FloatingTabBar';

const TABS: TabConfig[] = [
  { name: 'index', label: 'Dashboard', Icon: LayoutDashboard },
  { name: 'animals', label: 'Animals', Icon: PawPrint },
  { name: 'chat', label: 'Messages', Icon: MessageCircle },
  { name: 'profile', label: 'Profile', Icon: Store },
];

export default function ShelterTabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} tabs={TABS} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" options={{ title: 'Dashboard' }} />
      <Tabs.Screen name="animals" options={{ title: 'Animals' }} />
      <Tabs.Screen name="chat" options={{ title: 'Messages' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}
