import { useEffect } from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideOutUp,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { Colors, FontSize, FontWeight, Radius, Shadow, Spacing, ZIndex } from '@/lib/theme';

export type ToastType = 'like' | 'skip' | 'info';

interface ToastProps {
  visible: boolean;
  message: string;
  type?: ToastType;
}

const TYPE_COLORS: Record<ToastType, { bg: string; text: string }> = {
  like: { bg: Colors.success,        text: Colors.neutral[0] },
  skip: { bg: Colors.neutral[800],   text: Colors.neutral[0] },
  info: { bg: Colors.neutral[800],   text: Colors.neutral[0] },
};

const TYPE_ICON: Record<ToastType, string> = {
  like: '💚',
  skip: '👋',
  info: 'ℹ️',
};

export function Toast({ visible, message, type = 'info' }: ToastProps) {
  const scale = useSharedValue(0.9);

  useEffect(() => {
    if (visible) {
      scale.value = withSequence(
        withSpring(1.04, { damping: 12, stiffness: 280 }),
        withSpring(1.0,  { damping: 14, stiffness: 200 }),
      );
    }
  }, [visible, scale]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  if (!visible) return null;

  const { bg, text } = TYPE_COLORS[type];

  return (
    <Animated.View
      entering={SlideInDown.springify().damping(16).stiffness(200)}
      exiting={SlideOutUp.duration(200)}
      pointerEvents="none"
      style={[styles.wrapper, animStyle]}
    >
      <Animated.View style={[styles.pill, { backgroundColor: bg }]}>
        <Text style={styles.icon}>{TYPE_ICON[type]}</Text>
        <Text style={[styles.message, { color: text }]} numberOfLines={1}>
          {message}
        </Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    top: Spacing[5],
    left: Spacing[6],
    right: Spacing[6],
    alignItems: 'center',
    zIndex: ZIndex.toast,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    paddingHorizontal: Spacing[5],
    paddingVertical: Spacing[3],
    borderRadius: Radius.full,
    ...Shadow.md,
  },
  icon: {
    fontSize: 16,
  },
  message: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
  },
});