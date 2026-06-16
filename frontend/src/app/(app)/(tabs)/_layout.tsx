import { Tabs } from 'expo-router';
import { Heart, MessageCircle, PawPrint, User } from 'lucide-react-native';

import { FloatingTabBar, type TabConfig } from '@/components/navigation/FloatingTabBar';

/**
 * Bottom tab navigation layout for the primary user flow (Feed, Liked, Chat, Profile).
 */
const TABS: TabConfig[] = [
  { name: 'index', label: 'Discover', Icon: PawPrint },
  { name: 'liked', label: 'Liked', Icon: Heart },
  { name: 'chat', label: 'Messages', Icon: MessageCircle },
  { name: 'profile', label: 'Profile', Icon: User },
];

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} tabs={TABS} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" options={{ title: 'Discover' }} />
      <Tabs.Screen name="liked" options={{ title: 'Liked' }} />
      <Tabs.Screen name="chat" options={{ title: 'Messages' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}
