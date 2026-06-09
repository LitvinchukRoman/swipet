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

import { Colors, Radius, Shadow, Spacing } from '@/lib/theme';
import type { AnimalSize, FeedFilters, Species } from '@/types/models';

// ─── Constants ────────────────────────────────────────────────────────────────
const SCREEN_H = Dimensions.get('window').height;

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
  { value: 99, label: 'Any age'       },
];

const RADIUS_OPTIONS: { value: number; label: string }[] = [
  { value: 10,  label: '10 km'  },
  { value: 25,  label: '25 km'  },
  { value: 50,  label: '50 km'  },
  { value: 100, label: '100 km' },
];

export interface FilterBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  initialFilters: FeedFilters;
  onApply: (filters: FeedFilters) => void;
}

// ─── Reanimated Chip ──────────────────────────────────────────────────────────
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
          <Chip
            key={String(opt)}
            active={active}
            onPress={() => onSelect(active ? undefined : opt)}
          >
            {renderLabel(opt)}
          </Chip>
        );
      })}
    </View>
  );
}

// Окремий компонент для кнопки, щоб анімувати колір через Reanimated
function Chip({ active, onPress, children }: { active: boolean; onPress: () => void; children: React.ReactNode }) {
  const progress = useSharedValue(active ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(active ? 1 : 0, { duration: 200 });
  }, [active, progress]);

  const animStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      [Colors.neutral[100], Colors.primary[500]]
    ),
  }));

  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}>
      <Animated.View
        style={[
          {
            borderRadius: Radius.full,
            paddingHorizontal: Spacing[4],
            paddingVertical: Spacing[2],
            ...(active ? Shadow.orange : {}),
          },
          animStyle,
        ]}
      >
        {children}
      </Animated.View>
    </Pressable>
  );
}

// ─── Section heading ──────────────────────────────────────────────────────────
function SectionLabel({ label }: { label: string }) {
  return (
    <Text
      style={{
        fontSize: 13,
        fontWeight: '700',
        color: Colors.neutral[500],
        letterSpacing: 0.4,
        textTransform: 'uppercase',
        marginBottom: Spacing[3],
      }}
    >
      {label}
    </Text>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
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

  // ── Анімація та стан відображення ──
  // Ми зберігаємо власний стан isMounted, щоб Modal не зник до завершення анімації виходу
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

      // Плавно виїжджає
      translateY.value = withSpring(0, { damping: 22, stiffness: 200 });
      backdropOp.value = withTiming(1, { duration: 250 });
    } else if (isMounted) {
      // Плавно ховається перед тим як закрити Modal
      translateY.value = withTiming(SCREEN_H, { duration: 250 });
      backdropOp.value = withTiming(0, { duration: 250 }, (finished) => {
        if (finished) {
          runOnJS(setIsMounted)(false);
        }
      });
    }
  }, [visible]);

  // ── Жест свайпу вниз ──
  const pan = Gesture.Pan()
    .onChange((e) => {
      // Дозволяємо тягнути тільки вниз (позитивні значення)
      if (e.translationY > 0) {
        translateY.value = e.translationY;
      }
    })
    .onEnd((e) => {
      // Якщо свайпнули достатньо сильно або далеко — закриваємо
      if (e.translationY > 150 || e.velocityY > 500) {
        runOnJS(onClose)();
      } else {
        // Інакше повертаємо на місце з ефектом пружини
        translateY.value = withSpring(0, { damping: 22, stiffness: 200 });
      }
    });

  const animSheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const animBackdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOp.value,
  }));

  const activeCount = [species, size, ageMax].filter(Boolean).length + (radiusKm !== 50 ? 1 : 0);

  const handleReset = () => {
    setSpecies(undefined);
    setSize(undefined);
    setAgeMax(undefined);
    setRadiusKm(50);
  };

  const handleApply = () => {
    onApply({ species, size, ageMax, radiusKm });
    onClose();
  };

  if (!isMounted) return null;

  return (
    <Modal transparent animationType="none" visible={isMounted} onRequestClose={onClose} statusBarTranslucent>
      <GestureHandlerRootView style={{ flex: 1 }}>
        {/* ── ФОН (Backdrop) ───────────────────────── */}
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: Colors.overlay.dark },
            animBackdropStyle,
          ]}
        >
          <Pressable style={{ flex: 1 }} onPress={onClose} />
        </Animated.View>

        {/* ── САМА ПАНЕЛЬ (Bottom Sheet) ───────────── */}
        <Animated.View
          style={[
            {
              position: 'absolute',
              bottom: 0, left: 0, right: 0,
              backgroundColor: Colors.neutral[0],
              borderTopLeftRadius: Radius['2xl'],
              borderTopRightRadius: Radius['2xl'],
              paddingBottom: insets.bottom + Spacing[4],
              maxHeight: SCREEN_H * 0.9, // Щоб не вилазило за екран
              ...Shadow.md,
            },
            animSheetStyle,
          ]}
        >
          {/* Обгортаємо ТІЛЬКИ шапку у жест. Це дозволить скролити список нижче без конфліктів */}
          <GestureDetector gesture={pan}>
            <View style={{ backgroundColor: 'transparent' }}>
              {/* drag handle */}
              <View style={{ alignItems: 'center', paddingTop: Spacing[3] }}>
                <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: Colors.neutral[200] }} />
              </View>

              {/* header */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingHorizontal: Spacing[6],
                  paddingTop: Spacing[4],
                  paddingBottom: Spacing[5],
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing[2] }}>
                  <SlidersHorizontal size={18} color={Colors.neutral[900]} strokeWidth={2} />
                  <Text style={{ fontSize: 20, fontWeight: '800', color: Colors.neutral[900], letterSpacing: -0.3 }}>
                    Filters
                  </Text>
                  {activeCount > 0 && (
                    <View
                      style={{
                        backgroundColor: Colors.primary[500],
                        borderRadius: Radius.full,
                        width: 20, height: 20,
                        alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      <Text style={{ color: Colors.neutral[0], fontSize: 11, fontWeight: '700' }}>
                        {activeCount}
                      </Text>
                    </View>
                  )}
                </View>

                {/* reset */}
                <Pressable
                  onPress={handleReset}
                  style={({ pressed }) => ({
                    flexDirection: 'row', alignItems: 'center', gap: 4,
                    paddingHorizontal: Spacing[3], paddingVertical: Spacing[1],
                    borderRadius: Radius.md,
                    backgroundColor: pressed ? Colors.neutral[100] : 'transparent',
                  })}
                >
                  <RotateCcw size={14} color={Colors.neutral[400]} strokeWidth={2} />
                  <Text style={{ fontSize: 13, fontWeight: '600', color: Colors.neutral[400] }}>Reset</Text>
                </Pressable>
              </View>
            </View>
          </GestureDetector>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: Spacing[6], gap: Spacing[6] }}
          >
            {/* ── Species ────────────────────────── */}
            <View>
              <SectionLabel label="Animal type" />
              <ChipRow
                options={SPECIES_OPTIONS.map((o) => o.value)}
                selected={species}
                onSelect={setSpecies}
                renderLabel={(val) => {
                  const opt = SPECIES_OPTIONS.find((o) => o.value === val)!;
                  const IconComponent = SPECIES_ICON[val as Species];
                  const isActive = species === val;
                  const contentColor = isActive ? Colors.neutral[0] : Colors.neutral[700];

                  return (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <IconComponent size={16} color={contentColor} strokeWidth={2.5} />
                      <Text style={{ fontSize: 13, fontWeight: '600', color: contentColor }}>
                        {opt.label}
                      </Text>
                    </View>
                  );
                }}
              />
            </View>

            {/* ── Size ───────────────────────────── */}
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
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: Spacing[4],
                        borderRadius: Radius.lg,
                        borderWidth: 1.5,
                        borderColor: active ? Colors.primary[500] : Colors.neutral[150],
                        backgroundColor: active ? Colors.primary[50] : Colors.neutral[0],
                        opacity: pressed ? 0.8 : 1,
                        ...(active ? Shadow.sm : {}),
                      })}
                    >
                      <View>
                        <Text style={{ fontSize: 14, fontWeight: '700', color: active ? Colors.primary[600] : Colors.neutral[800] }}>
                          {opt.label}
                        </Text>
                        <Text style={{ fontSize: 12, color: active ? Colors.primary[400] : Colors.neutral[400], marginTop: 1 }}>
                          {opt.sub}
                        </Text>
                      </View>
                      {active && (
                        <View
                          style={{
                            width: 20, height: 20, borderRadius: 10,
                            backgroundColor: Colors.primary[500],
                            alignItems: 'center', justifyContent: 'center',
                          }}
                        >
                          <Text style={{ color: Colors.neutral[0], fontSize: 11, fontWeight: '700' }}>✓</Text>
                        </View>
                      )}
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* ── Age ────────────────────────────── */}
            <View>
              <SectionLabel label="Max age" />
              <ChipRow
                options={AGE_OPTIONS.map((o) => o.value)}
                selected={ageMax}
                onSelect={setAgeMax}
                renderLabel={(val) => {
                  const opt = AGE_OPTIONS.find((o) => o.value === val)!;
                  return (
                    <Text style={{ fontSize: 13, fontWeight: '600', color: ageMax === val ? Colors.neutral[0] : Colors.neutral[700] }}>
                      {opt.label}
                    </Text>
                  );
                }}
              />
            </View>

            {/* ── Radius ─────────────────────────── */}
            <View style={{ marginBottom: Spacing[3] }}>
              <SectionLabel label="Search radius" />
              <ChipRow
                options={RADIUS_OPTIONS.map((o) => o.value)}
                selected={radiusKm}
                onSelect={(v) => setRadiusKm(v ?? 50)}
                renderLabel={(val) => {
                  const opt = RADIUS_OPTIONS.find((o) => o.value === val)!;
                  return (
                    <Text style={{ fontSize: 13, fontWeight: '600', color: radiusKm === val ? Colors.neutral[0] : Colors.neutral[700] }}>
                      {opt.label}
                    </Text>
                  );
                }}
              />
            </View>
          </ScrollView>

          {/* ── Apply CTA ──────────────────────────── */}
          <View style={{ paddingHorizontal: Spacing[6], paddingTop: Spacing[4] }}>
            <Pressable
              onPress={handleApply}
              style={({ pressed }) => ({
                backgroundColor: pressed ? Colors.primary[600] : Colors.primary[500],
                borderRadius: Radius.lg,
                height: 56,
                alignItems: 'center',
                justifyContent: 'center',
                ...Shadow.orange,
                transform: [{ scale: pressed ? 0.98 : 1 }],
              })}
            >
              <Text style={{ color: Colors.neutral[0], fontSize: 16, fontWeight: '700' }}>
                Show results{activeCount > 0 ? ` · ${activeCount} active` : ''}
              </Text>
            </Pressable>
          </View>
        </Animated.View>
      </GestureHandlerRootView>
    </Modal>
  );
}