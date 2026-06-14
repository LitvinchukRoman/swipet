import { PawPrint } from 'lucide-react-native';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { Colors } from '@/lib/theme';

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
