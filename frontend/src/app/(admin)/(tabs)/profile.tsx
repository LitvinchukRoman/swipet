import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { LogOut } from 'lucide-react-native';
import { useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { confirm, notify } from '@/lib/notify';
import { Colors, FontSize, FontWeight, Layout, Radius, Shadow, Spacing } from '@/lib/theme';
import { authService } from '@/services/auth';
import { userService } from '@/services/user';
import { useAuthStore } from '@/store/auth';

export default function AdminProfileScreen() {
  const { user, refreshToken, clearAuth, updateUser } = useAuthStore();
  const [uploading, setUploading] = useState(false);

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
      await clearAuth();
      router.replace('/(auth)/login');
    }
  };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.content}>
        <View style={s.headerCard}>
          <Avatar uri={user?.avatarUrl} name={user?.fullName} size={88} onEditPress={handleAvatarPress} uploading={uploading} />
          <Text style={s.userName}>{user?.fullName ?? 'Administrator'}</Text>
          <Text style={s.userEmail}>{user?.email}</Text>
          <View style={s.roleBadge}>
            <Text style={s.roleText}>Administrator</Text>
          </View>
        </View>

        <View style={{ marginTop: Spacing[6] }}>
          <Button label="Log Out" variant="destructive" icon={LogOut} onPress={handleLogout} />
        </View>
      </ScrollView>
    </SafeAreaView>
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
    backgroundColor: Colors.neutral[900],
    borderRadius: Radius.full,
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[1],
  },
  roleText: {
    color: Colors.neutral[0],
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
});
