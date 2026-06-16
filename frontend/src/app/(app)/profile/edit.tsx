import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useState } from 'react';
import {
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
import { notify } from '@/lib/notify';
import { Colors, FontSize, FontWeight, Radius, Spacing } from '@/lib/theme';
import { userService } from '@/services/user';
import { useAuthStore } from '@/store/auth';

//  Screen
/**
 * Screen for editing the user's profile details (name, phone, avatar).
 */
export default function EditProfileScreen() {
  const { user, updateUser } = useAuthStore();
  const [fullName,  setFullName]  = useState(user?.fullName ?? '');
  const [phone,     setPhone]     = useState(user?.phone    ?? '');
  const [phoneError, setPhoneError] = useState('');
  const [saving,    setSaving]    = useState(false);
  const [uploading, setUploading] = useState(false);

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
      const avatarUrl = await userService.uploadAvatar(formData);

      const updated = await userService.updateMe({ avatarUrl });

      await updateUser(updated);
    } catch {
      notify('Upload failed', 'Could not update your photo. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!fullName.trim()) {
      notify('Name required', 'Full name cannot be empty.');
      return;
    }

    const trimmedPhone = phone.trim();
    if (trimmedPhone) {
      const cleanedPhone = trimmedPhone.replace(/[\s\-()]/g, '');
      const uaPhoneRegex = /^(?:\+380|380|0)\d{9}$/;
      
      if (!uaPhoneRegex.test(cleanedPhone)) {
        setPhoneError('Please enter a valid phone number');
        return;
      }
    }

    setSaving(true);
    try {
      const updated = await userService.updateMe({
        fullName: fullName.trim(),
        phone: trimmedPhone || undefined,
      });
      await updateUser(updated);
      router.back();
    } catch {
      notify('Save failed', 'Could not save changes. Please try again.');
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
            onChangeText={(text) => {
              setPhone(text);
              if (phoneError) setPhoneError('');
            }}
            placeholder="+380…"
            keyboardType="phone-pad"
            error={phoneError}
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

//  Field — form input with label
interface FieldProps {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'phone-pad' | 'email-address';
  autoCapitalize?: 'none' | 'words' | 'sentences';
  error?: string;
}

function Field({ label, value, onChangeText, placeholder, keyboardType = 'default', autoCapitalize = 'sentences', error }: FieldProps) {
  return (
    <View style={styles.field}>
      <Text style={[styles.fieldLabel, error ? styles.fieldLabelError : null]}>
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.neutral[300]}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        style={styles.fieldInput}
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

//  Styles
const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: Spacing[4],
    paddingTop: Spacing[6],
    paddingBottom: Spacing[10],
  },

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
  fieldLabelError: {
    color: '#ef4444'
  },
  fieldInput: {
    color: Colors.neutral[900],
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
    paddingVertical: Spacing[1],
  },
  errorText: {
    color: '#ef4444',
    fontSize: FontSize.xs,
    marginTop: Spacing[1],
  },
  fieldDivider: {
    height: 1,
    backgroundColor: Colors.neutral[100],
  },

  saveWrap: {
    marginTop: Spacing[5],
  },
});