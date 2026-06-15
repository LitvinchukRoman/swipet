import { Image } from 'expo-image';
import { Camera } from 'lucide-react-native';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
 
import { Colors, Shadow } from '@/lib/theme';
 
interface AvatarProps {
  uri?: string;
  name?: string;
  size?: number;
  emoji?: string;
  /** When provided, shows a camera badge and makes the avatar tappable */
  onEditPress?: () => void;
  /** Shows a spinner on the badge while an upload is in progress */
  uploading?: boolean;
}
 
const BADGE_SIZE = 30;
 
export function Avatar({
  uri,
  name,
  size = 48,
  emoji,
  onEditPress,
  uploading,
}: AvatarProps) {
  const radius = size / 2;
 
  const imageEl = uri ? (
    <Image
      source={{ uri }}
      style={{ width: size, height: size, borderRadius: radius }}
      contentFit="cover"
      transition={200}
    />
  ) : (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        backgroundColor: Colors.primary[100],
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ fontSize: size * 0.4, lineHeight: size * 0.48 }}>
        {emoji ?? name?.charAt(0)?.toUpperCase() ?? '🐾'}
      </Text>
    </View>
  );
 
  // ── Without edit badge ────────────────────
  if (!onEditPress) return imageEl;
 
  // ── With edit badge ───────────────────────
  return (
    <TouchableOpacity
      onPress={onEditPress}
      activeOpacity={0.82}
      disabled={uploading}
    >
      <View>
        {/* Orange ring around avatar when edit is available */}
        <View
          style={[
            styles.ring,
            {
              width: size + 6,
              height: size + 6,
              borderRadius: (size + 6) / 2,
            },
          ]}
        >
          {imageEl}
        </View>
 
        {/* Camera badge */}
        <View style={styles.badge}>
          {uploading ? (
            <ActivityIndicator size="small" color={Colors.neutral[0]} />
          ) : (
            <Camera size={14} color={Colors.neutral[0]} strokeWidth={2} />
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}
 
const styles = StyleSheet.create({
  ring: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: Colors.primary[300],
  },
  badge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: BADGE_SIZE,
    height: BADGE_SIZE,
    borderRadius: BADGE_SIZE / 2,
    backgroundColor: Colors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: Colors.neutral[0],
    ...Shadow.sm,
  },
});