import {
  Cat,
  Dog,
  PawPrint,
  Rabbit,
  RotateCcw,
  SlidersHorizontal,
} from 'lucide-react-native';
import type { ComponentType } from 'react';
import { useEffect, useState } from 'react';
import {
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  interpolateColor,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { countActiveFilters } from '@/lib/filters';
import { Colors, Radius, Shadow, Spacing } from '@/lib/theme';
import type { AnimalSize, FeedFilters, Species } from '@/types/models';

/**
 * Bottom sheet component providing filter options (species, age, size) for the animal feed.
 */
const SCREEN_H   = Dimensions.get('window').height;
const THUMB_SIZE = 28;
const MIN_KM     = 5;
const MAX_KM     = 500;

export const SPECIES_ICON: Record<
  Species,
  ComponentType<{ size: number; color: string; strokeWidth?: number }>
> = {
  DOG:    Dog,
  CAT:    Cat,
  RABBIT: Rabbit,
  OTHER:  PawPrint,
};

const SPECIES_OPTIONS: { value: Species; label: string }[] = [
  { value: 'DOG',    label: 'Dogs'    },
  { value: 'CAT',    label: 'Cats'    },
  { value: 'RABBIT', label: 'Rabbits' },
  { value: 'OTHER',  label: 'Other'   },
];

const SIZE_OPTIONS: { value: AnimalSize; label: string; sub: string }[] = [
  { value: 'SMALL',  label: 'Small',  sub: 'Under 10 kg' },
  { value: 'MEDIUM', label: 'Medium', sub: '10–25 kg'    },
  { value: 'LARGE',  label: 'Large',  sub: 'Over 25 kg'  },
];

const AGE_OPTIONS: { value: number; label: string }[] = [
  { value: 1,  label: 'Under 1 year'  },
  { value: 3,  label: 'Under 3 years' },
  { value: 7,  label: 'Under 7 years' },
];

export interface FilterBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  initialFilters: FeedFilters;
  onApply: (filters: FeedFilters) => void;
}

function ChipRow<T extends string | number>({
  options,
  selected,
  onSelect,
  renderLabel,
}: {
  options: T[];
  selected: T | undefined;
  onSelect: (val: T | undefined) => void;
  renderLabel: (val: T) => React.ReactNode;
}) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[2] }}>
      {options.map((opt) => {
        const active = selected === opt;
        return (
          <Chip key={String(opt)} active={active} onPress={() => onSelect(active ? undefined : opt)}>
            {renderLabel(opt)}
          </Chip>
        );
      })}
    </View>
  );
}

function Chip({ active, onPress, children }: { active: boolean; onPress: () => void; children: React.ReactNode }) {
  const progress = useSharedValue(active ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(active ? 1 : 0, { duration: 200 });
  }, [active, progress]);

  const animStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(progress.value, [0, 1], [Colors.neutral[100], Colors.primary[500]]),
  }));

  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}>
      <Animated.View style={[{ borderRadius: Radius.full, paddingHorizontal: Spacing[4], paddingVertical: Spacing[2], ...(active ? Shadow.orange : {}) }, animStyle]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}

function SectionLabel({ label }: { label: string }) {
  return (
    <Text style={{ fontSize: 13, fontWeight: '700', color: Colors.neutral[500], letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: Spacing[3] }}>
      {label}
    </Text>
  );
}

function RadiusSlider({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const trackWidthSV = useSharedValue(0);
  const thumbX       = useSharedValue(0);
  const thumbScale   = useSharedValue(1);
  const startX       = useSharedValue(0);
  const isDraggingSV = useSharedValue(false);

  // Sync thumb when value changes from outside (e.g. reset)
  useEffect(() => {
    if (!isDraggingSV.value && trackWidthSV.value > 0) {
      thumbX.value = withSpring(
        ((value - MIN_KM) / (MAX_KM - MIN_KM)) * trackWidthSV.value,
        { damping: 20, stiffness: 200 },
      );
    }
  }, [value]);

  const pan = Gesture.Pan()
    .hitSlop({ top: 14, bottom: 14, left: 14, right: 14 })
    .onBegin(() => {
      startX.value      = thumbX.value;
      isDraggingSV.value = true;
      thumbScale.value  = withSpring(1.22, { damping: 10, stiffness: 300 });
    })
    .onUpdate((e) => {
      const tw   = trackWidthSV.value;
      if (tw <= 0) return;
      const newX = Math.max(0, Math.min(startX.value + e.translationX, tw));
      thumbX.value = newX;
      const ratio = newX / tw;
      const v     = Math.round(MIN_KM + ratio * (MAX_KM - MIN_KM));
      runOnJS(onChange)(v);
    })
    .onEnd(() => {
      isDraggingSV.value = false;
      thumbScale.value   = withSpring(1.0, { damping: 12, stiffness: 300 });
    })
    .onFinalize(() => {
      isDraggingSV.value = false;
      thumbScale.value   = withSpring(1.0, { damping: 12, stiffness: 300 });
    });

  const fillStyle = useAnimatedStyle(() => ({
    width: Math.max(0, thumbX.value),
  }));

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: thumbX.value - THUMB_SIZE / 2 },
      { scale: thumbScale.value },
    ],
  }));

  // Badge floats above the thumb, clamped inside track bounds
  const badgeStyle = useAnimatedStyle(() => {
    const badgeW = 64;
    const half   = badgeW / 2;
    const tw     = trackWidthSV.value;
    const x      = tw > 0
      ? Math.max(half, Math.min(thumbX.value, tw - half)) - half
      : 0;
    return { transform: [{ translateX: x }] };
  });

  return (
    <View style={sliderStyles.wrapper}>
      {/* Floating value badge */}
      <Animated.View style={[sliderStyles.badgeWrap, badgeStyle]}>
        <View style={sliderStyles.badge}>
          <Text style={sliderStyles.badgeText}>{value} km</Text>
        </View>
        {/* Triangle pointer */}
        <View style={sliderStyles.badgeTip} />
      </Animated.View>

      {/* Track + Thumb */}
      <View
        style={sliderStyles.trackArea}
        onLayout={(e) => {
          const w = e.nativeEvent.layout.width;
          if (w > 0) {
            trackWidthSV.value = w;
            thumbX.value = ((value - MIN_KM) / (MAX_KM - MIN_KM)) * w;
          }
        }}
      >
        {/* Track background */}
        <View style={sliderStyles.track}>
          {/* Filled portion */}
          <Animated.View style={[sliderStyles.fill, fillStyle]} />
        </View>

        {/* Draggable thumb */}
        <GestureDetector gesture={pan}>
          <Animated.View style={[sliderStyles.thumb, thumbStyle]} />
        </GestureDetector>
      </View>

      {/* Min / Max labels */}
      <View style={sliderStyles.rangeRow}>
        <Text style={sliderStyles.rangeLabel}>{MIN_KM} km</Text>
        <Text style={sliderStyles.rangeLabel}>{MAX_KM} km</Text>
      </View>
    </View>
  );
}

export function FilterBottomSheet({
  visible,
  onClose,
  initialFilters,
  onApply,
}: FilterBottomSheetProps) {
  const insets = useSafeAreaInsets();

  const [species,  setSpecies]  = useState<Species | undefined>(initialFilters.species);
  const [size,     setSize]     = useState<AnimalSize | undefined>(initialFilters.size);
  const [ageMax,   setAgeMax]   = useState<number | undefined>(initialFilters.ageMax);
  const [radiusKm, setRadiusKm] = useState<number>(initialFilters.radiusKm ?? 50);

  // resetKey forces slider remount so thumb snaps back cleanly
  const [resetKey, setResetKey] = useState(0);

  const [isMounted, setIsMounted] = useState(visible);
  const translateY = useSharedValue(SCREEN_H);
  const backdropOp = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      setIsMounted(true);
      setSpecies(initialFilters.species);
      setSize(initialFilters.size);
      setAgeMax(initialFilters.ageMax);
      setRadiusKm(initialFilters.radiusKm ?? 50);
      translateY.value = withSpring(0, { damping: 22, stiffness: 200 });
      backdropOp.value = withTiming(1, { duration: 250 });
    } else if (isMounted) {
      translateY.value = withTiming(SCREEN_H, { duration: 250 });
      backdropOp.value = withTiming(0, { duration: 250 }, (finished) => {
        if (finished) runOnJS(setIsMounted)(false);
      });
    }
  }, [visible]);

  const pan = Gesture.Pan()
    .onChange((e) => {
      if (e.translationY > 0) translateY.value = e.translationY;
    })
    .onEnd((e) => {
      if (e.translationY > 150 || e.velocityY > 500) {
        runOnJS(onClose)();
      } else {
        translateY.value = withSpring(0, { damping: 22, stiffness: 200 });
      }
    });

  const animSheetStyle   = useAnimatedStyle(() => ({ transform: [{ translateY: translateY.value }] }));
  const animBackdropStyle = useAnimatedStyle(() => ({ opacity: backdropOp.value }));

  const activeCount = countActiveFilters({ species, size, ageMax, radiusKm });

  const handleReset = () => {
    setSpecies(undefined);
    setSize(undefined);
    setAgeMax(undefined);
    setRadiusKm(50);
    setResetKey((k) => k + 1); // remount slider → thumb snaps to 50
  };

  const handleApply = () => {
    onApply({ species, size, ageMax, radiusKm });
    onClose();
  };

  if (!isMounted) return null;

  return (
    <Modal transparent animationType="none" visible={isMounted} onRequestClose={onClose} statusBarTranslucent>
      <GestureHandlerRootView style={{ flex: 1 }}>
        {/* Backdrop */}
        <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: Colors.overlay.dark }, animBackdropStyle]}>
          <Pressable style={{ flex: 1 }} onPress={onClose} />
        </Animated.View>

        {/* Sheet */}
        <Animated.View
          style={[
            {
              position: 'absolute', bottom: 0, left: 0, right: 0,
              backgroundColor: Colors.neutral[0],
              borderTopLeftRadius: Radius['2xl'],
              borderTopRightRadius: Radius['2xl'],
              paddingBottom: insets.bottom + Spacing[4],
              maxHeight: SCREEN_H * 0.9,
              ...Shadow.md,
            },
            animSheetStyle,
          ]}
        >
          {/* Header — draggable area */}
          <GestureDetector gesture={pan}>
            <View>
              <View style={{ alignItems: 'center', paddingTop: Spacing[3] }}>
                <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: Colors.neutral[200] }} />
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing[6], paddingTop: Spacing[4], paddingBottom: Spacing[5] }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing[2] }}>
                  <SlidersHorizontal size={18} color={Colors.neutral[900]} strokeWidth={2} />
                  <Text style={{ fontSize: 20, fontWeight: '800', color: Colors.neutral[900], letterSpacing: -0.3 }}>Filters</Text>
                  {activeCount > 0 && (
                    <View style={{ backgroundColor: Colors.primary[500], borderRadius: Radius.full, width: 20, height: 20, alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ color: Colors.neutral[0], fontSize: 11, fontWeight: '700' }}>{activeCount}</Text>
                    </View>
                  )}
                </View>
                <Pressable
                  onPress={handleReset}
                  style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: Spacing[3], paddingVertical: Spacing[1], borderRadius: Radius.md, backgroundColor: pressed ? Colors.neutral[100] : 'transparent' })}
                >
                  <RotateCcw size={14} color={Colors.neutral[400]} strokeWidth={2} />
                  <Text style={{ fontSize: 13, fontWeight: '600', color: Colors.neutral[400] }}>Reset</Text>
                </Pressable>
              </View>
            </View>
          </GestureDetector>

          <ScrollView style={{ flexShrink: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: Spacing[6], gap: Spacing[6] }}>
            {/* ── Species ── */}
            <View>
              <SectionLabel label="Animal type" />
              <ChipRow
                options={SPECIES_OPTIONS.map((o) => o.value)}
                selected={species}
                onSelect={setSpecies}
                renderLabel={(val) => {
                  const opt = SPECIES_OPTIONS.find((o) => o.value === val)!;
                  const Icon = SPECIES_ICON[val as Species];
                  const active = species === val;
                  const color = active ? Colors.neutral[0] : Colors.neutral[700];
                  return (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Icon size={16} color={color} strokeWidth={2.5} />
                      <Text style={{ fontSize: 13, fontWeight: '600', color }}>{opt.label}</Text>
                    </View>
                  );
                }}
              />
            </View>

            {/* ── Size ── */}
            <View>
              <SectionLabel label="Size" />
              <View style={{ gap: Spacing[2] }}>
                {SIZE_OPTIONS.map((opt) => {
                  const active = size === opt.value;
                  return (
                    <Pressable
                      key={opt.value}
                      onPress={() => setSize(active ? undefined : opt.value)}
                      style={({ pressed }) => ({
                        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                        padding: Spacing[4], borderRadius: Radius.lg,
                        borderWidth: 1.5,
                        borderColor: active ? Colors.primary[500] : Colors.neutral[150],
                        backgroundColor: active ? Colors.primary[50] : Colors.neutral[0],
                        opacity: pressed ? 0.8 : 1,
                        ...(active ? Shadow.sm : {}),
                      })}
                    >
                      <View>
                        <Text style={{ fontSize: 14, fontWeight: '700', color: active ? Colors.primary[600] : Colors.neutral[800] }}>{opt.label}</Text>
                        <Text style={{ fontSize: 12, color: active ? Colors.primary[400] : Colors.neutral[400], marginTop: 1 }}>{opt.sub}</Text>
                      </View>
                      {active && (
                        <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: Colors.primary[500], alignItems: 'center', justifyContent: 'center' }}>
                          <Text style={{ color: Colors.neutral[0], fontSize: 11, fontWeight: '700' }}>✓</Text>
                        </View>
                      )}
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* ── Age ── */}
            <View>
              <SectionLabel label="Max age" />
              <ChipRow
                options={AGE_OPTIONS.map((o) => o.value)}
                selected={ageMax}
                onSelect={setAgeMax}
                renderLabel={(val) => {
                  const opt = AGE_OPTIONS.find((o) => o.value === val)!;
                  return (
                    <Text style={{ fontSize: 13, fontWeight: '600', color: ageMax === val ? Colors.neutral[0] : Colors.neutral[700] }}>{opt.label}</Text>
                  );
                }}
              />
            </View>

            {/* ── Radius slider ── */}
            <View style={{ marginBottom: Spacing[3] }}>
              <SectionLabel label="Search radius" />
              <RadiusSlider key={resetKey} value={radiusKm} onChange={setRadiusKm} />
            </View>
          </ScrollView>

          {/* Apply CTA */}
          <View style={{ paddingHorizontal: Spacing[6], paddingTop: Spacing[4], width: '100%' }}>
            <View style={{ width: '100%', borderRadius: Radius.lg, ...Shadow.orange }}>
              <Pressable
                onPress={handleApply}
                style={({ pressed }) => [
                  {
                    backgroundColor: Colors.primary[500],
                    borderRadius: Radius.lg,
                    height: 56,
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '100%',
                  },
                  { opacity: pressed ? 0.8 : 1 }
                ]}
              >
                <Text style={{ color: Colors.neutral[0], fontSize: 16, fontWeight: '700' }}>
                  Show results{activeCount > 0 ? ` · ${activeCount} active` : ''}
                </Text>
              </Pressable>
            </View>
          </View>
        </Animated.View>
      </GestureHandlerRootView>
    </Modal>
  );
}

const sliderStyles = StyleSheet.create({
  wrapper: {
    paddingTop: 44, // room for the floating badge
  },

  // Badge that follows the thumb
  badgeWrap: {
    position: 'absolute',
    top: 0,
    width: 64,
    alignItems: 'center',
  },
  badge: {
    backgroundColor: Colors.neutral[900],
    borderRadius: Radius.md,
    paddingHorizontal: Spacing[2],
    paddingVertical: 5,
    minWidth: 64,
    alignItems: 'center',
  },
  badgeText: {
    color: Colors.neutral[0],
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  // Downward-pointing triangle
  badgeTip: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: Colors.neutral[900],
    marginTop: -1,
  },

  // Track
  trackArea: {
    height: THUMB_SIZE,
    justifyContent: 'center',
  },
  track: {
    height: 6,
    backgroundColor: Colors.neutral[150],
    borderRadius: 3,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: Colors.primary[500],
    borderRadius: 3,
  },

  // Thumb
  thumb: {
    position: 'absolute',
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: Colors.neutral[0],
    borderWidth: 2.5,
    borderColor: Colors.primary[500],
    shadowColor: Colors.neutral[900],
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 5,
  },

  // Labels
  rangeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing[3],
  },
  rangeLabel: {
    color: Colors.neutral[400],
    fontSize: 12,
    fontWeight: '500',
  },
});