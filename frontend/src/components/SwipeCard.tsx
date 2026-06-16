import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Scissors, Shield } from 'lucide-react-native';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { NoPhotoPlaceholder } from '@/components/ui/NoPhotoPlaceholder';

import { formatAge, formatDistance } from '@/lib/format';
import { Colors, FontSize, FontWeight, Radius, Shadow, Spacing } from '@/lib/theme';
import type { Animal } from '@/types/models';

/**
 * Individual card component representing an animal in the SwipeDeck.
 * Animates out of the screen based on user swipe direction.
 */
interface SwipeCardProps {
  animal: Animal;
  /** Animated opacity for the LIKE badge — provided by SwipeDeck */
  likeStyle?: object;
  /** Animated opacity for the NOPE badge — provided by SwipeDeck */
  nopeStyle?: object;
  onPress?: (animal: Animal) => void;
}

const GENDER_LABEL: Record<string, string> = {
  MALE:   '♂ Male',
  FEMALE: '♀ Female',
};

export function SwipeCard({ animal, likeStyle, nopeStyle, onPress }: SwipeCardProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.97}
      onPress={() => onPress?.(animal)}
      style={styles.card}
    >
      {/* ── Photo ──────────────────────────── */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {animal.primaryPhotoUrl ? (
          <Image
            source={{ uri: animal.primaryPhotoUrl }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            transition={300}
          />
        ) : (
          <NoPhotoPlaceholder style={StyleSheet.absoluteFill} iconSize={64} />
        )}
      </View>

      {/* ── Top vignette (subtle, for overlay badge readability) */}
      <LinearGradient
        colors={['rgba(28,25,23,0.28)', 'transparent']}
        style={styles.topGradient}
      />

      {/* ── Bottom gradient ────────────────── */}
      <LinearGradient
        colors={[
          'transparent',
          'rgba(28,25,23,0.18)',
          'rgba(28,25,23,0.70)',
          'rgba(28,25,23,0.93)',
        ]}
        locations={[0.3, 0.52, 0.76, 1.0]}
        style={styles.bottomGradient}
      />

      {/* ── Info block ─────────────────────── */}
      <View style={styles.info}>
        {/* — Badges row — */}
        <View style={styles.badgeRow}>
          {animal.isVaccinated && (
            <View style={styles.badge}>
              <Shield size={11} color={Colors.neutral[0]} strokeWidth={2.5} />
              <Text style={styles.badgeText}>Vaccinated</Text>
            </View>
          )}
          {animal.isSterilized && (
            <View style={styles.badge}>
              <Scissors size={11} color={Colors.neutral[0]} strokeWidth={2.5} />
              <Text style={styles.badgeText}>Neutered</Text>
            </View>
          )}
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{GENDER_LABEL[animal.gender] ?? animal.gender}</Text>
          </View>
        </View>

        {/* — Name + age — */}
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1}>
            {animal.name}
          </Text>
          <View style={styles.agePill}>
            <Text style={styles.ageText}>{formatAge(animal.ageMonths)}</Text>
          </View>
        </View>

        {/* — Breed — */}
        {animal.breed ? (
          <Text style={styles.breed} numberOfLines={1}>
            {animal.breed}
          </Text>
        ) : null}

        {/* — Shelter + distance — */}
        <View style={styles.locationRow}>
          <Text style={styles.locationText} numberOfLines={1}>
            {animal.shelterName}
          </Text>
          <Text style={styles.dot}>·</Text>
          <Text style={styles.distanceText}>{formatDistance(animal.distanceKm)}</Text>
        </View>
      </View>

      {/* ── LIKE badge ─────────────────────── */}
      <Animated.View pointerEvents="none" style={[styles.overlayBadge, styles.likeBadge, likeStyle]}>
        <Text style={styles.likeText}>LIKE</Text>
      </Animated.View>

      {/* ── NOPE badge ─────────────────────── */}
      <Animated.View pointerEvents="none" style={[styles.overlayBadge, styles.nopeBadge, nopeStyle]}>
        <Text style={styles.nopeText}>NOPE</Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: Radius['2xl'],
    overflow: 'hidden',
    backgroundColor: Colors.neutral[200],
    ...Shadow.card,
  },
  topGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  bottomGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60%',
  },

  info: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing[6],
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: Spacing[3],
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.26)',
  },
  badgeText: {
    color: Colors.neutral[0],
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing[2],
    marginBottom: Spacing[1],
  },
  name: {
    flex: 1,
    color: Colors.neutral[0],
    fontSize: FontSize['3xl'],
    fontWeight: FontWeight.extrabold,
    letterSpacing: -0.8,
    lineHeight: 38,
  },
  agePill: {
    backgroundColor: Colors.primary[500],
    borderRadius: Radius.md,
    paddingHorizontal: Spacing[3],
    paddingVertical: 5,
    marginBottom: 3,
  },
  ageText: {
    color: Colors.neutral[0],
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  breed: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: FontSize.base,
    fontWeight: FontWeight.medium,
    marginBottom: Spacing[2],
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[1],
  },
  locationText: {
    flex: 1,
    color: 'rgba(255,255,255,0.55)',
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
  dot: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: FontSize.sm,
  },
  distanceText: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },

  overlayBadge: {
    position: 'absolute',
    top: Spacing[7],
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[2],
    borderRadius: Radius.md,
    borderWidth: 3,
  },
  likeBadge: {
    right: Spacing[5],
    transform: [{ rotate: '-14deg' }],
    borderColor: Colors.success,
    backgroundColor: 'rgba(34,197,94,0.14)',
  },
  nopeBadge: {
    left: Spacing[5],
    transform: [{ rotate: '14deg' }],
    borderColor: Colors.error,
    backgroundColor: 'rgba(239,68,68,0.14)',
  },
  likeText: {
    color: Colors.success,
    fontSize: FontSize.xl,
    fontWeight: FontWeight.extrabold,
    letterSpacing: 2,
  },
  nopeText: {
    color: Colors.error,
    fontSize: FontSize.xl,
    fontWeight: FontWeight.extrabold,
    letterSpacing: 2,
  },
});