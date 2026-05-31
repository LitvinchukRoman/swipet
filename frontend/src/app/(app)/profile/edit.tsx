import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Colors, FontSize, FontWeight, Radius, Spacing } from '@/lib/theme';
import { useAuthStore } from '@/store/auth';

// ─────────────────────────────────────────────
//  Screen
// ─────────────────────────────────────────────
export default function EditProfileScreen() {
  const { user, updateUser } = useAuthStore();
  const [fullName, setFullName]   = useState(user?.fullName ?? '');
  const [phone,    setPhone]      = useState(user?.phone    ?? '');
  const [saving,   setSaving]     = useState(false);
  const [uploading, setUploading] = useState(false);

  // ── Avatar upload ─────────────────────────
  const handleAvatarPress = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow photo library access in Settings.');
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
        const res  = await fetch(asset.uri);
        const blob = await res.blob();
        formData.append('file', blob, 'avatar.jpg');
      } else {
        formData.append('file', {
          uri:  asset.uri,
          type: asset.mimeType ?? 'image/jpeg',
          name: 'avatar.jpg',
        } as any);
      }
      // TODO: POST /me/avatar  multipart/form-data → { avatarUrl }
      // const { data } = await api.post('/me/avatar', formData, {
      //   headers: { 'Content-Type': 'multipart/form-data' },
      // });
      // await updateUser({ avatarUrl: data.avatarUrl });

      await updateUser({ avatarUrl: asset.uri }); // mock until backend ready
    } catch {
      Alert.alert('Upload failed', 'Could not update your photo. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  // ── Save profile ──────────────────────────
  const handleSave = async () => {
    if (!fullName.trim()) {
      Alert.alert('Name required', 'Full name cannot be empty.');
      return;
    }
    setSaving(true);
    try {
      // TODO: PATCH /me  { fullName, phone } → updated user
      // await userService.updateMe({ fullName: fullName.trim(), phone: phone.trim() || undefined });
      await updateUser({ fullName: fullName.trim(), phone: phone.trim() || undefined });
      router.back();
    } catch {
      Alert.alert('Save failed', 'Could not save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-stone-50" edges={['bottom']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContent}
      >
        {/* ── Avatar ──────────────────────── */}
        <Animated.View
          entering={FadeInDown.delay(0).springify().damping(18)}
          style={styles.avatarSection}
        >
          <Avatar
            uri={user?.avatarUrl}
            name={fullName}
            size={100}
            onEditPress={handleAvatarPress}
            uploading={uploading}
          />
          <Text style={styles.changePhotoLabel}>
            {uploading ? 'Uploading…' : 'Tap to change photo'}
          </Text>
        </Animated.View>

        {/* ── Form ────────────────────────── */}
        <Animated.View
          entering={FadeInDown.delay(80).springify().damping(18)}
          style={styles.formCard}
        >
          <Field
            label="Full Name"
            value={fullName}
            onChangeText={setFullName}
            placeholder="Your name"
            autoCapitalize="words"
          />

          <View style={styles.fieldDivider} />

          <Field
            label="Phone"
            value={phone}
            onChangeText={setPhone}
            placeholder="+380…"
            keyboardType="phone-pad"
          />
        </Animated.View>

        {/* ── Save button ─────────────────── */}
        <Animated.View
          entering={FadeInDown.delay(140).springify().damping(18)}
          style={styles.saveWrap}
        >
          <Button label="Save Changes" loading={saving} onPress={handleSave} />
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────
//  Field — form input with label
// ─────────────────────────────────────────────
interface FieldProps {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'phone-pad' | 'email-address';
  autoCapitalize?: 'none' | 'words' | 'sentences';
}

function Field({ label, value, onChangeText, placeholder, keyboardType = 'default', autoCapitalize = 'sentences' }: FieldProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.neutral[300]}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        style={styles.fieldInput}
      />
    </View>
  );
}

// ─────────────────────────────────────────────
//  Styles
// ─────────────────────────────────────────────
const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: Spacing[4],
    paddingTop: Spacing[6],
    paddingBottom: Spacing[10],
  },

  // ── Avatar
  avatarSection: {
    alignItems: 'center',
    marginBottom: Spacing[6],
    gap: Spacing[3],
  },
  changePhotoLabel: {
    color: Colors.primary[500],
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },

  // ── Form card
  formCard: {
    backgroundColor: Colors.neutral[0],
    borderRadius: Radius['2xl'],
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[2],
    shadowColor: Colors.neutral[900],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 4,
  },
  field: {
    paddingVertical: Spacing[3],
  },
  fieldLabel: {
    color: Colors.neutral[400],
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: Spacing[1],
  },
  fieldInput: {
    color: Colors.neutral[900],
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
    paddingVertical: Spacing[1],
  },
  fieldDivider: {
    height: 1,
    backgroundColor: Colors.neutral[100],
  },

  // ── Save
  saveWrap: {
    marginTop: Spacing[5],
  },
});