import { PawPrint } from 'lucide-react-native';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInUp, ZoomIn } from 'react-native-reanimated';

import { Colors, FontSize, FontWeight, Radius, Shadow, Spacing } from '@/lib/theme';

/**
 * UI Component displayed when a list is empty or a resource is not found.
 */
interface EmptyStateProps {
  title?: string;
  subtitle?: string;
  ctaLabel?: string;
  onCta?: () => void;
}

export function EmptyState({
  title   = "You're all caught up!",
  subtitle = 'No more animals nearby.\nCome back later or adjust your filters.',
  ctaLabel = 'Update Filters',
  onCta,
}: EmptyStateProps) {
  return (
    <View style={styles.container}>
      {/* ── Icon ─────────────────────────────── */}
      <Animated.View entering={ZoomIn.delay(80).springify().damping(14)} style={styles.iconWrap}>
        <View style={styles.iconOuter}>
          <View style={styles.iconInner}>
            <PawPrint size={52} color={Colors.primary[500]} strokeWidth={1.6} />
          </View>
        </View>
      </Animated.View>

      {/* ── Text ─────────────────────────────── */}
      <Animated.View entering={FadeInUp.delay(160).duration(420)} style={styles.textBlock}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </Animated.View>

      {/* ── CTA ──────────────────────────────── */}
      {onCta && (
        <Animated.View entering={FadeInUp.delay(260).duration(420)} style={styles.ctaWrap}>
          <TouchableOpacity
            onPress={onCta}
            activeOpacity={0.82}
            style={styles.cta}
          >
            <Text style={styles.ctaText}>{ctaLabel}</Text>
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing[10],
    gap: Spacing[6],
  },
  iconWrap: {
    marginBottom: Spacing[2],
  },
  iconOuter: {
    width: 140,
    height: 140,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconInner: {
    width: 100,
    height: 100,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  textBlock: {
    alignItems: 'center',
    gap: Spacing[2],
  },
  title: {
    color: Colors.neutral[900],
    fontSize: FontSize['2xl'],
    fontWeight: FontWeight.extrabold,
    textAlign: 'center',
    letterSpacing: -0.4,
  },
  subtitle: {
    color: Colors.neutral[400],
    fontSize: FontSize.base,
    fontWeight: FontWeight.regular,
    textAlign: 'center',
    lineHeight: FontSize.base * 1.55,
  },
  ctaWrap: {
    width: '100%',
  },
  cta: {
    backgroundColor: Colors.primary[500],
    borderRadius: Radius.xl,
    paddingVertical: Spacing[4],
    alignItems: 'center',
    ...Shadow.orange,
  },
  ctaText: {
    color: Colors.neutral[0],
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
});