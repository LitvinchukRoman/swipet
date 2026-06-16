import { Colors } from '@/lib/theme';
import { PawPrint } from 'lucide-react-native';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

/**
 * UI Component displaying a placeholder graphic when an animal or user has no photo.
 */
interface Props {
  style?: StyleProp<ViewStyle>;
  iconSize?: number;
}

export function NoPhotoPlaceholder({ style, iconSize = 48 }: Props) {
  return (
    <View style={[styles.container, style]}>
      <PawPrint size={iconSize} color={Colors.neutral[300]} strokeWidth={1.5} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});
