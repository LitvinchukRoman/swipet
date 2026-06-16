import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { CalendarDays, ChevronRight, Heart, LogOut, Pencil, RotateCcw, Star } from 'lucide-react-native';
import type { ComponentType } from 'react';
import { useEffect, useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { confirm, notify } from '@/lib/notify';
import { Colors, FontSize, FontWeight, Layout, Radius, Shadow, Spacing } from '@/lib/theme';
import { authService } from '@/services/auth';
import { chatService } from '@/services/chat';
import { donationService } from '@/services/donation';
import { feedService } from '@/services/feed';
import { userService } from '@/services/user';
import { useAuthStore } from '@/store/auth';
import { useFeedStore } from '@/store/feed';

/**
 * User profile tab.
 * Displays user information, settings, and navigation to guardianships or edit profile screens.
 */
const ROLE_LABEL: Record<string, string> = {
  USER: 'Adopter',
  SHELTER_ADMIN: 'Shelter Admin',
  ADMIN: 'Administrator',
};

//  Screen
export default function ProfileScreen() {
  const { user, refreshToken, clearAuth, updateUser } = useAuthStore();
  const liked = useFeedStore((s) => s.liked);
  const loadLiked = useFeedStore((s) => s.loadLiked);
  const [uploading, setUploading] = useState(false);
  const [wardsCount, setWardsCount] = useState(0);
  const [contactedCount, setContactedCount] = useState(0);

  useEffect(() => {
    loadLiked();

    donationService.getMyGuardianships()
      .then(data => {
        if (Array.isArray(data)) setWardsCount(data.filter(g => g.isActive).length);
      })
      .catch(console.error);

    chatService.getRooms()
      .then(rooms => setContactedCount(rooms.length))
      .catch(console.error);
  }, []);

  const handleAvatarPress = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      notify('Permission needed', 'Please allow photo library access in Settings.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    if (result.canceled) return;

    const asset = result.assets[0];
    setUploading(true);
    try {
      const formData = new FormData();
      if (Platform.OS === 'web') {
        const res = await fetch(asset.uri);
        const blob = await res.blob();
        formData.append('file', blob, 'avatar.jpg');
      } else {
        formData.append('file', {
          uri: asset.uri,
          type: asset.mimeType ?? 'image/jpeg',
          name: 'avatar.jpg',
        } as any);
      }

      // POST /users/me/avatar → { avatarUrl }
      // PATCH /users/me       → updated user
      const avatarUrl = await userService.uploadAvatar(formData);
      const updated = await userService.updateMe({ avatarUrl });
      await updateUser(updated);
    } catch {
      notify('Upload failed', 'Could not update your photo. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleLogout = async () => {
    const performLogout = async () => {
      try {
        if (refreshToken) await authService.logout(refreshToken);
      } finally {
        await clearAuth();
        router.replace('/(auth)/login');
      }
    };

    const confirmed = await confirm('Log Out', 'Are you sure you want to log out?', true);
    if (confirmed) {
      performLogout();
    }
  };

  const handleResetSwipes = async () => {
    const confirmed = await confirm(
      'Reset history?',
      'This will allow you to see all animals in the feed again. Your likes will also be reset.',
      true
    );
    if (confirmed) {
      try {
        await feedService.resetSwipes();
        notify('Success', 'History has been reset!');
      } catch (e) {
        notify('Error', 'Could not reset history.');
      }
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-stone-50" edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ── Header card ─────────────────── */}
        <Animated.View
          entering={FadeInDown.delay(0).springify().damping(18)}
          style={styles.headerCard}
        >
          {/* Decorative circles */}
          <View style={styles.decor1} />
          <View style={styles.decor2} />

          <Avatar
            uri={user?.avatarUrl}
            name={user?.fullName}
            size={96}
            onEditPress={handleAvatarPress}
            uploading={uploading}
          />

          <Text style={styles.userName}>{user?.fullName ?? 'User'}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>

          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>
              {ROLE_LABEL[user?.role ?? 'USER'] ?? user?.role}
            </Text>
          </View>
        </Animated.View>

        {/* ── Stats row ───────────────────── */}
        <Animated.View
          entering={FadeInDown.delay(80).springify().damping(18)}
          style={styles.statsCard}
        >
          <StatCell value={liked.length} label="Favorites" />
          <View style={styles.statDivider} />
          <StatCell value={wardsCount} label="Wards" />
          <View style={styles.statDivider} />
          <StatCell value={contactedCount} label="Contacted" />
        </Animated.View>

        {/* ── Account section ─────────────── */}
        <Animated.View entering={FadeInDown.delay(150).springify().damping(18)}>
          <SectionLabel title="Account" />
          <View style={styles.sectionCard}>
            <MenuRow
              icon={Pencil}
              iconColor={Colors.primary[500]}
              iconBg={Colors.primary[50]}
              label="Edit Profile"
              onPress={() => router.push('/(app)/profile/edit')}
            />
            <MenuRow
              icon={Star}
              iconColor={Colors.warning}
              iconBg="rgba(234,179,8,0.10)"
              label="My Wards"
              onPress={() => router.push('/(app)/guardianship')}
            />
            <MenuRow
              icon={Heart}
              iconColor={Colors.error}
              iconBg="rgba(239,68,68,0.08)"
              label="Favorites"
              onPress={() => router.push('/(app)/(tabs)/liked')}
            />
            <MenuRow
              icon={CalendarDays}
              iconColor={Colors.info}
              iconBg="rgba(59,130,246,0.08)"
              label="My Visits"
              onPress={() => router.push('/(app)/visits')}
            />
            <MenuRow
              icon={RotateCcw}
              iconColor={Colors.warning}
              iconBg="rgba(234,179,8,0.10)"
              label="Reset history?"
              onPress={handleResetSwipes}
              isLast
            />
          </View>
        </Animated.View>

        {/* ── Logout — always visible above tab bar ── */}
        <Animated.View
          entering={FadeInDown.delay(240).springify().damping(18)}
          style={styles.logoutWrap}
        >
          <Button
            label="Log Out"
            variant="destructive"
            icon={LogOut}
            onPress={handleLogout}
          />
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

//  Sub-components
function SectionLabel({ title }: { title: string }) {
  return (
    <Text className="mb-2 mt-5 px-1 text-xs font-semibold uppercase tracking-widest text-stone-400">
      {title}
    </Text>
  );
}

function StatCell({ value, label }: { value: number; label: string }) {
  return (
    <View className="flex-1 items-center gap-0.5 py-1">
      <Text className="text-2xl font-extrabold text-orange-500">{value}</Text>
      <Text className="text-xs font-medium text-stone-400">{label}</Text>
    </View>
  );
}

interface MenuRowProps {
  icon: ComponentType<{ size: number; color: string; strokeWidth?: number }>;
  iconColor: string;
  iconBg: string;
  label: string;
  onPress: () => void;
  isLast?: boolean;
}

function MenuRow({ icon: Icon, iconColor, iconBg, label, onPress, isLast }: MenuRowProps) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      onPressIn={() => { scale.value = withSpring(0.97, { damping: 14, stiffness: 320 }); }}
      onPressOut={() => { scale.value = withSpring(1, { damping: 14, stiffness: 320 }); }}
      onPress={onPress}
      style={!isLast && styles.menuRowBorder}
    >
      <Animated.View style={[styles.menuRowInner, animStyle]}>
        <View style={[styles.menuIconCircle, { backgroundColor: iconBg }]}>
          <Icon size={16} color={iconColor} strokeWidth={2} />
        </View>
        <Text style={styles.menuLabel}>{label}</Text>
        <ChevronRight size={16} color={Colors.neutral[300]} strokeWidth={2} />
      </Animated.View>
    </Pressable>
  );
}

//  Styles
const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: Spacing[4],
    paddingTop: Spacing[3],
    // Clears the tab bar + extra breathing room
    paddingBottom: Layout.tabBarHeight + Spacing[8],
  },

  headerCard: {
    backgroundColor: Colors.neutral[0],
    borderRadius: Radius['2xl'],
    alignItems: 'center',
    paddingTop: Spacing[8],
    paddingBottom: Spacing[6],
    paddingHorizontal: Spacing[6],
    overflow: 'hidden',
    ...Shadow.md,
  },
  decor1: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: Colors.primary[100],
    top: -50,
    right: -50,
    opacity: 0.55,
  },
  decor2: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: Colors.primary[50],
    bottom: 10,
    left: -25,
    opacity: 0.7,
  },
  userName: {
    marginTop: Spacing[4],
    color: Colors.neutral[900],
    fontSize: FontSize['2xl'],
    fontWeight: FontWeight.extrabold,
    letterSpacing: -0.4,
    textAlign: 'center',
  },
  userEmail: {
    marginTop: Spacing[1],
    color: Colors.neutral[400],
    fontSize: FontSize.sm,
  },
  roleBadge: {
    marginTop: Spacing[3],
    backgroundColor: Colors.primary[50],
    borderRadius: Radius.full,
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[1],
  },
  roleText: {
    color: Colors.primary[700],
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },

  statsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.neutral[0],
    borderRadius: Radius['2xl'],
    marginTop: Spacing[3],
    paddingVertical: Spacing[4],
    ...Shadow.sm,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: Colors.neutral[150],
  },

  sectionCard: {
    backgroundColor: Colors.neutral[0],
    borderRadius: Radius['2xl'],
    overflow: 'hidden',
    ...Shadow.sm,
  },
  menuRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[100],
  },
  menuRowInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[4],
    gap: Spacing[3],
  },
  menuIconCircle: {
    width: 34,
    height: 34,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: {
    flex: 1,
    color: Colors.neutral[800],
    fontSize: FontSize.base,
    fontWeight: FontWeight.medium,
  },

  logoutWrap: {
    marginTop: Spacing[6],
  },
});