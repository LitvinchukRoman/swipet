import * as Location from 'expo-location';
import { router } from 'expo-router';
import { PawPrint, SlidersHorizontal } from 'lucide-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/ui/EmptyState';
import { SwipeDeck } from '@/components/SwipeDeck';
import { Toast, type ToastType } from '@/components/common/Toast';
import { FilterBottomSheet } from '@/components/common/FilterBottomSheet';
import { Colors, FontSize, FontWeight, Radius, Spacing } from '@/lib/theme';
import { useFeedStore } from '@/store/feed';
import type { Animal, FeedFilters, SwipeDirection } from '@/types/models';

// ─── Types ────────────────────────────────────
interface ToastState {
  visible: boolean;
  message: string;
  type: ToastType;
}

// ─── Component ───────────────────────────────
export default function FeedScreen() {
  const { cards, currentIndex, isLoading, filters, loadFeed, swipe, setCoords, setFilters } =
    useFeedStore();

  const [toast, setToast] = useState<ToastState>({ visible: false, message: '', type: 'info' });
  const [filterOpen, setFilterOpen] = useState(false);
  const [locationError, setLocationError] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── SC-FEED-001: геолокація при монтуванні ──────────────────────────────
  // Фолбек якщо локацію отримати не вдалось
const FALLBACK_COORDS = { lat: 50.4501, lng: 30.5234 }; // Київ

const initLocation = useCallback(async () => {
  setLocationError(false);
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      // Лише відмова в дозволі → показуємо помилку
      setLocationError(true);
      return;
    }

    let feedCoords = FALLBACK_COORDS;

    try {
      // 1. Спочатку пробуємо закешовану позицію — повертається миттєво
      const last = await Location.getLastKnownPositionAsync({ maxAge: 300_000 });
      if (last) {
        feedCoords = { lat: last.coords.latitude, lng: last.coords.longitude };
      } else {
        // 2. Запитуємо свіжу позицію з таймаутом
        const pos = (await Promise.race([
          Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('timeout')), 8000),
          ),
        ])) as Location.LocationObject;

        feedCoords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      }
    } catch {
      // kCLErrorLocationUnknown / timeout → не блокуємо юзера,
      // завантажуємо стрічку з фолбек координатами
    }

    setCoords(feedCoords);
    loadFeed(feedCoords);
  } catch {
    setLocationError(true);
  }
}, [setCoords, loadFeed]);

  useEffect(() => {
    initLocation();
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, [initLocation]);

  // ── Toast helper ─────────────────────────────────────────────────────────
  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    setToast({ visible: true, message, type });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(
      () => setToast((t) => ({ ...t, visible: false })),
      1800,
    );
  }, []);

  // ── Swipe handler ─────────────────────────────────────────────────────────
  const handleSwipe = useCallback(
    (animal: Animal, direction: SwipeDirection) => {
      swipe(animal, direction);
      if (direction === 'RIGHT') {
        showToast(`${animal.name} added to favorites`, 'like');
      }
    },
    [swipe, showToast],
  );

  // ── SC-FEED-011: застосування фільтрів ───────────────────────────────────
  const handleApplyFilters = useCallback(
    (newFilters: FeedFilters) => {
      setFilters(newFilters);
      loadFeed(undefined, newFilters);
    },
    [setFilters, loadFeed],
  );

  const isDone    = !isLoading && currentIndex >= cards.length;
  const remaining = Math.max(cards.length - currentIndex, 0);
  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      {/* ── Header ──────────────────────────── */}
      <View style={styles.header}>
        {/* Logo */}
        <View style={styles.logoRow}>
          <View style={styles.logoIconWrap}>
            <PawPrint size={20} color={Colors.neutral[0]} strokeWidth={2} />
          </View>
          <Text style={styles.logoText}>swipet</Text>
        </View>

        {/* Card count + filter */}
        <View style={styles.headerRight}>
          {remaining > 0 && !isLoading && (
            <Animated.View entering={FadeIn.duration(300)} style={styles.countPill}>
              <Text style={styles.countText}>{remaining}</Text>
            </Animated.View>
          )}
          <TouchableOpacity
            onPress={() => setFilterOpen(true)}
            activeOpacity={0.75}
            style={styles.filterBtn}
          >
            <SlidersHorizontal size={20} color={Colors.neutral[600]} strokeWidth={2} />
            {/* active filter badge */}
            {activeFilterCount > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Content ─────────────────────────── */}
      {locationError ? (
        <LocationError onRetry={initLocation} />
      ) : isLoading ? (
        <LoadingState />
      ) : isDone ? (
        <EmptyState
          onCta={() => setFilterOpen(true)}
          ctaLabel="Update Filters"
        />
      ) : (
        <SwipeDeck
          cards={cards}
          currentIndex={currentIndex}
          onSwipe={handleSwipe}
          onOpenDetail={(animal) => router.push(`/(app)/animal/${animal.id}`)}
        />
      )}

      {/* ── Toast overlay ───────────────────── */}
      <Toast visible={toast.visible} message={toast.message} type={toast.type} />

      {/* ── Filter sheet ────────────────────── */}
      <FilterBottomSheet
        visible={filterOpen}
        onClose={() => setFilterOpen(false)}
        initialFilters={filters}
        onApply={handleApplyFilters}
      />
    </SafeAreaView>
  );
}

// ─── Loading state ────────────────────────────
function LoadingState() {
  return (
    <View style={styles.loading}>
      <View style={styles.loadingIconWrap}>
        <PawPrint size={36} color={Colors.primary[300]} strokeWidth={1.5} />
      </View>
      <ActivityIndicator size="large" color={Colors.primary[500]} style={{ marginTop: Spacing[4] }} />
      <Text style={styles.loadingText}>Finding animals nearby…</Text>
    </View>
  );
}

// ─── Location error state ─────────────────────
function LocationError({ onRetry }: { onRetry: () => void }) {
  return (
    <View style={styles.loading}>
      <Text style={{ fontSize: 40, marginBottom: Spacing[4] }}>📍</Text>
      <Text style={{ fontSize: 17, fontWeight: '700', color: Colors.neutral[800], textAlign: 'center' }}>
        Location access needed
      </Text>
      <Text style={{ fontSize: 14, color: Colors.neutral[400], textAlign: 'center', marginTop: Spacing[2], lineHeight: 21, paddingHorizontal: Spacing[8] }}>
        Swipet uses your location to show animals nearby. Please allow access in Settings.
      </Text>
      <TouchableOpacity
        onPress={onRetry}
        activeOpacity={0.8}
        style={{
          marginTop: Spacing[6],
          backgroundColor: Colors.primary[500],
          borderRadius: Radius.lg,
          paddingHorizontal: Spacing[8],
          paddingVertical: Spacing[3],
        }}
      >
        <Text style={{ color: Colors.neutral[0], fontWeight: '700', fontSize: 15 }}>Try again</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Styles ──────────────────────────────────
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.neutral[50],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing[5],
    paddingVertical: Spacing[3],
    paddingBottom: Spacing[4],
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
  },
  logoIconWrap: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    backgroundColor: Colors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    color: Colors.neutral[900],
    fontSize: FontSize['2xl'],
    fontWeight: FontWeight.extrabold,
    letterSpacing: -0.6,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
  },
  countPill: {
    backgroundColor: Colors.primary[100],
    borderRadius: Radius.full,
    paddingHorizontal: Spacing[3],
    paddingVertical: 4,
    minWidth: 32,
    alignItems: 'center',
  },
  countText: {
    color: Colors.primary[700],
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  filterBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: Colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadgeText: {
    color: Colors.neutral[0],
    fontSize: 10,
    fontWeight: FontWeight.bold,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[2],
  },
  loadingIconWrap: {
    width: 80,
    height: 80,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: Spacing[3],
    color: Colors.neutral[400],
    fontSize: FontSize.base,
    fontWeight: FontWeight.medium,
  },
});