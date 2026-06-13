import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router, useFocusEffect } from 'expo-router';
import {
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock,
  LogOut,
  Pencil,
  Store,
} from 'lucide-react-native';
import type { ComponentType } from 'react';
import { useCallback, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { confirm, notify } from '@/lib/notify';
import { Colors, FontSize, FontWeight, Layout, Radius, Shadow, Spacing } from '@/lib/theme';
import { authService } from '@/services/auth';
import { userService } from '@/services/user';
import { useAuthStore } from '@/store/auth';
import { useShelterStore } from '@/store/shelter';

export default function ShelterProfileScreen() {
  const { user, refreshToken, clearAuth, updateUser } = useAuthStore();
  const { shelter, load, reset } = useShelterStore();
  const [uploading, setUploading] = useState(false);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const handleAvatarPress = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      notify('Permission needed', 'Please allow photo access in settings.');
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
        const blob = await (await fetch(asset.uri)).blob();
        formData.append('file', blob, 'avatar.jpg');
      } else {
        formData.append('file', { uri: asset.uri, type: asset.mimeType ?? 'image/jpeg', name: 'avatar.jpg' } as any);
      }
      const avatarUrl = await userService.uploadAvatar(formData);
      const updated = await userService.updateMe({ avatarUrl });
      await updateUser(updated);
    } catch {
      notify('Error', "Couldn't update your photo. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleLogout = async () => {
    const ok = await confirm('Log out?', 'Are you sure you want to log out?');
    if (!ok) return;
    try {
      if (refreshToken) await authService.logout(refreshToken);
    } finally {
      reset();
      await clearAuth();
      router.replace('/(auth)/login');
    }
  };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.content}>
        {/* ── Account ── */}
        <View style={s.headerCard}>
          <Avatar
            uri={user?.avatarUrl}
            name={user?.fullName}
            size={88}
            onEditPress={handleAvatarPress}
            uploading={uploading}
          />
          <Text style={s.userName}>{user?.fullName ?? 'Admin'}</Text>
          <Text style={s.userEmail}>{user?.email}</Text>
          <View style={s.roleBadge}>
            <Text style={s.roleText}>Shelter Admin</Text>
          </View>
        </View>

        {/* ── Shelter ── */}
        <Text style={s.sectionLabel}>Shelter</Text>
        {shelter ? (
          <View style={s.shelterCard}>
            <View style={s.shelterIcon}>
              {shelter.logoUrl ? (
                <Image source={{ uri: shelter.logoUrl }} style={s.shelterLogo} contentFit="cover" />
              ) : (
                <Store size={24} color={Colors.primary[600]} strokeWidth={2} />
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.shelterName} numberOfLines={1}>
                {shelter.name}
              </Text>
              <Text style={s.shelterMeta} numberOfLines={1}>
                📍 {shelter.city}
              </Text>
            </View>
            <View style={[s.verifyPill, shelter.isVerified ? s.verifyOk : s.verifyPending]}>
              {shelter.isVerified ? (
                <CheckCircle2 size={12} color="#15803D" strokeWidth={2.2} />
              ) : (
                <Clock size={12} color="#A16207" strokeWidth={2.2} />
              )}
              <Text style={[s.verifyText, { color: shelter.isVerified ? '#15803D' : '#A16207' }]}>
                {shelter.isVerified ? 'Verified' : 'Pending review'}
              </Text>
            </View>
          </View>
        ) : null}

        <View style={s.menuCard}>
          <MenuRow icon={Pencil} label="Edit shelter" onPress={() => router.push('/(shelter)/shelter-edit')} />
          <MenuRow icon={BarChart3} label="Analytics" onPress={() => router.push('/(shelter)/analytics')} />
          <MenuRow
            icon={CalendarDays}
            label="Visit slots"
            onPress={() => router.push('/(shelter)/slots')}
            isLast
          />
        </View>

        {/* ── Logout ── */}
        <View style={{ marginTop: Spacing[6] }}>
          <Button label="Log Out" variant="destructive" icon={LogOut} onPress={handleLogout} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function MenuRow({
  icon: Icon,
  label,
  onPress,
  isLast,
}: {
  icon: ComponentType<{ size: number; color: string; strokeWidth?: number }>;
  label: string;
  onPress: () => void;
  isLast?: boolean;
}) {
  return (
    <Pressable onPress={onPress} style={!isLast && s.menuRowBorder}>
      <View style={s.menuRowInner}>
        <View style={s.menuIconCircle}>
          <Icon size={16} color={Colors.primary[500]} strokeWidth={2} />
        </View>
        <Text style={s.menuLabel}>{label}</Text>
        <ChevronRight size={16} color={Colors.neutral[300]} strokeWidth={2} />
      </View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.neutral[50] },
  content: { paddingHorizontal: Spacing[4], paddingTop: Spacing[3], paddingBottom: Layout.tabBarHeight + Spacing[8] },

  headerCard: {
    backgroundColor: Colors.neutral[0],
    borderRadius: Radius['2xl'],
    alignItems: 'center',
    paddingTop: Spacing[8],
    paddingBottom: Spacing[6],
    paddingHorizontal: Spacing[6],
    ...Shadow.md,
  },
  userName: {
    marginTop: Spacing[4],
    color: Colors.neutral[900],
    fontSize: FontSize['2xl'],
    fontWeight: FontWeight.extrabold,
    letterSpacing: -0.4,
    textAlign: 'center',
  },
  userEmail: { marginTop: Spacing[1], color: Colors.neutral[400], fontSize: FontSize.sm },
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

  sectionLabel: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: Colors.neutral[400],
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: Spacing[6],
    marginBottom: Spacing[2],
    marginLeft: Spacing[1],
  },
  shelterCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    backgroundColor: Colors.neutral[0],
    borderRadius: Radius['2xl'],
    padding: Spacing[4],
    marginBottom: Spacing[3],
    ...Shadow.sm,
  },
  shelterIcon: {
    width: 48,
    height: 48,
    borderRadius: Radius.lg,
    backgroundColor: Colors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  shelterLogo: { width: 48, height: 48 },
  shelterName: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.neutral[900] },
  shelterMeta: { fontSize: FontSize.xs, color: Colors.neutral[500], marginTop: 2 },
  verifyPill: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: Spacing[2], paddingVertical: 4, borderRadius: Radius.full },
  verifyOk: { backgroundColor: '#DCFCE7' },
  verifyPending: { backgroundColor: '#FEF9C3' },
  verifyText: { fontSize: 10, fontWeight: FontWeight.bold },

  menuCard: { backgroundColor: Colors.neutral[0], borderRadius: Radius['2xl'], overflow: 'hidden', ...Shadow.sm },
  menuRowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.neutral[100] },
  menuRowInner: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing[4], paddingVertical: Spacing[4], gap: Spacing[3] },
  menuIconCircle: {
    width: 34,
    height: 34,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: { flex: 1, color: Colors.neutral[800], fontSize: FontSize.base, fontWeight: FontWeight.medium },
});
