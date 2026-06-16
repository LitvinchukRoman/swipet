import type { ComponentType } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { Colors, FontSize, FontWeight, Radius, Shadow, Spacing } from '@/lib/theme';

/**
 * Reusable, themeable Button component supporting various sizes, variants, and loading states.
 */
type Variant = 'primary' | 'outline' | 'ghost' | 'destructive';
type Size    = 'md' | 'lg';

interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  disabled?: boolean;
  loading?: boolean;
  /** Optional Lucide (or any) icon component */
  icon?: ComponentType<{ size: number; color: string; strokeWidth?: number }>;
  iconPosition?: 'left' | 'right';
}

const CONTAINER: Record<Variant, object> = {
  primary:     { backgroundColor: Colors.primary[500] },
  outline:     { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: Colors.primary[500] },
  ghost:       { backgroundColor: 'transparent' },
  destructive: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: Colors.error },
};

const LABEL_COLOR: Record<Variant, string> = {
  primary:     Colors.neutral[0],
  outline:     Colors.primary[500],
  ghost:       Colors.neutral[600],
  destructive: Colors.error,
};

const INDICATOR_COLOR: Record<Variant, string> = {
  primary:     Colors.neutral[0],
  outline:     Colors.primary[500],
  ghost:       Colors.neutral[500],
  destructive: Colors.error,
};

const HEIGHT: Record<Size, number> = {
  md: 48,
  lg: 56,
};

const FONT_SIZE: Record<Size, number> = {
  md: FontSize.base,
  lg: FontSize.md,
};

export function Button({
  label,
  onPress,
  variant      = 'primary',
  size         = 'lg',
  disabled     = false,
  loading      = false,
  icon: Icon,
  iconPosition = 'left',
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const labelColor = LABEL_COLOR[variant];
  const iconSize   = size === 'lg' ? 20 : 18;

  return (
    <Pressable
      onPressIn={() => {
        if (!isDisabled)
          scale.value = withSpring(0.97, { damping: 14, stiffness: 300 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 14, stiffness: 300 });
      }}
      onPress={onPress}
      disabled={isDisabled}
    >
      <Animated.View
        style={[
          styles.base,
          CONTAINER[variant],
          { height: HEIGHT[size] },
          variant === 'primary' && Shadow.orange,
          isDisabled && styles.disabled,
          animStyle,
        ]}
      >
        {loading ? (
          <ActivityIndicator color={INDICATOR_COLOR[variant]} />
        ) : (
          <View style={styles.row}>
            {Icon && iconPosition === 'left' && (
              <Icon size={iconSize} color={labelColor} strokeWidth={2} />
            )}
            <Text style={[styles.label, { color: labelColor, fontSize: FONT_SIZE[size] }]}>
              {label}
            </Text>
            {Icon && iconPosition === 'right' && (
              <Icon size={iconSize} color={labelColor} strokeWidth={2} />
            )}
          </View>
        )}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.xl,
    paddingHorizontal: Spacing[6],
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
  },
  label: {
    fontWeight: FontWeight.semibold,
  },
  disabled: {
    opacity: 0.45,
  },
});