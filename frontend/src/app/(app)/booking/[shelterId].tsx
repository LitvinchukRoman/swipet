import { router, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  CalendarX2,
  CheckCircle2,
  Clock3,
  MapPin,
  Sparkles,
  StickyNote,
  X,
} from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Keyboard,
  type KeyboardEvent,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInRight,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withSpring,
  withTiming,
  ZoomIn,
} from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuthStore } from '@/store/auth';
import { useBookingStore } from '@/store/booking';
import { Colors, FontSize, FontWeight, Radius, Shadow, Spacing } from '@/lib/theme';
import type { BookingSlot } from '@/types/models';

// ─── Helpers ──────────────────────────────────
const toDateString = (d: Date) => d.toISOString().split('T')[0];

const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

const formatDuration = (startsAt: string, endsAt: string) => {
  const mins = Math.round((new Date(endsAt).getTime() - new Date(startsAt).getTime()) / 60_000);
  if (mins < 60) return `${mins}min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
};

const formatDateLabel = (d: Date) =>
  d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });

const generateDates = (): Date[] =>
  Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d;
  });

// ─── Status helpers ───────────────────────────
const STRIP_COLOR = {
  AVAILABLE:  Colors.success,
  MY_BOOKING: Colors.primary[500],
  OTHERS:     Colors.neutral[300],
  CANCELLED:  Colors.neutral[200],
} as const;

type SlotVariant = 'AVAILABLE' | 'MY_BOOKING' | 'OTHERS' | 'CANCELLED';

const getVariant = (slot: BookingSlot, userId?: number): SlotVariant => {
  if (slot.status === 'CANCELLED') return 'CANCELLED';
  if (slot.status === 'AVAILABLE') return 'AVAILABLE';
  if (slot.user_id === userId)     return 'MY_BOOKING';
  return 'OTHERS';
};

// ─────────────────────────────────────────────
//  Screen
// ─────────────────────────────────────────────
export default function BookingScreen() {
  const params = useLocalSearchParams<{
    shelterId: string;
    shelterName?: string;
    animalName?: string;
  }>();
  const shelterId   = parseInt(params.shelterId, 10);
  const shelterName = params.shelterName ?? 'Shelter';
  const animalName  = params.animalName;

  const { user }                                                          = useAuthStore();
  const { slots, isLoading, error, fetchSlots, bookSlot, cancelBooking } = useBookingStore();

  const dates                           = useMemo(generateDates, []);
  const [selectedDate, setSelectedDate] = useState(() => toDateString(dates[0]));
  const [confirmSlot, setConfirmSlot]   = useState<BookingSlot | null>(null);
  const dateListRef                     = useRef<FlatList>(null);

  useEffect(() => {
    fetchSlots(shelterId, selectedDate);
  }, [shelterId, selectedDate]);

  const handleDateSelect = (date: Date, index: number) => {
    setSelectedDate(toDateString(date));
    dateListRef.current?.scrollToIndex({ index, animated: true, viewPosition: 0.5 });
  };

  const handleCancelPress = (slot: BookingSlot) => {
    const message = `Cancel your visit at ${formatTime(slot.starts_at)}?`;

    if (Platform.OS === 'web') {
      const confirmed = window.confirm(message);
      if (confirmed) {
        cancelBooking(slot.id).catch((e: any) => window.alert(`Error: ${e.message}`));
      }
    } else {
      Alert.alert(
        'Cancel Booking',
        message,
        [
          { text: 'Keep it', style: 'cancel' },
          {
            text: 'Cancel Booking',
            style: 'destructive',
            onPress: async () => {
              try {
                await cancelBooking(slot.id);
              } catch (e: any) {
                Alert.alert('Error', e.message);
              }
            },
          },
        ],
      );
    }
  };

  const availableCount = slots.filter((s) => s.status === 'AVAILABLE').length;

  return (
    <>
    <SafeAreaView style={styles.screen} edges={['top']}>
      {/* ── Header ─────────────────────────── */}
      <Animated.View entering={FadeInDown.duration(300)} style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7} style={styles.backBtn}>
          <ArrowLeft size={22} color={Colors.neutral[700]} strokeWidth={2.2} />
        </TouchableOpacity>

        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>Book a Visit</Text>
          <Text style={styles.headerSub} numberOfLines={1}>
            {shelterName}{animalName ? ` · ${animalName}` : ''}
          </Text>
        </View>
      </Animated.View>

      {/* ── Date strip ─────────────────────── */}
      <Animated.View entering={FadeInDown.delay(60).duration(300)}>
        <FlatList
          ref={dateListRef}
          data={dates}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(d) => toDateString(d)}
          contentContainerStyle={styles.dateList}
          onScrollToIndexFailed={() => {}}
          renderItem={({ item, index }) => (
            <DateCell
              date={item}
              selected={toDateString(item) === selectedDate}
              onPress={() => handleDateSelect(item, index)}
            />
          )}
        />
      </Animated.View>

      {/* ── Main content ───────────────────── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <LoadingSlots />
        ) : error ? (
          <ErrorState message={error} onRetry={() => fetchSlots(shelterId, selectedDate)} />
        ) : slots.length === 0 ? (
          <EmptySlots />
        ) : (
          <>
            <Animated.View entering={FadeIn.delay(80)} style={styles.countRow}>
              <Text style={styles.dateLabel}>
                {formatDateLabel(new Date(selectedDate + 'T12:00:00'))}
              </Text>
              {availableCount > 0 && (
                <View style={styles.countBadge}>
                  <Text style={styles.countText}>{availableCount} available</Text>
                </View>
              )}
            </Animated.View>

            {slots
              .filter((s) => s.status !== 'CANCELLED')
              .map((slot, index) => (
                <SlotCard
                  key={slot.id}
                  slot={slot}
                  index={index}
                  currentUserId={user?.id}
                  onBook={() => setConfirmSlot(slot)}
                  onCancel={() => handleCancelPress(slot)}
                />
              ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>

      {/* ── Booking confirmation sheet — поза SafeAreaView щоб не обрізалось ── */}
      <BookingSheet
        slot={confirmSlot}
        shelterName={shelterName}
        onClose={() => setConfirmSlot(null)}
        onConfirm={async (notes) => {
          if (!confirmSlot || !user?.id) return;
          await bookSlot(confirmSlot.id, user.id, notes);
        }}
      />
    </>
  );
}

// ─────────────────────────────────────────────
//  DateCell
// ─────────────────────────────────────────────
function DateCell({
  date,
  selected,
  onPress,
}: {
  date: Date;
  selected: boolean;
  onPress: () => void;
}) {
  const scale     = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const isToday   = toDateString(date) === toDateString(new Date());

  return (
    <Pressable
      onPressIn={() => { scale.value = withSpring(0.88, { damping: 14, stiffness: 340 }); }}
      onPressOut={() => { scale.value = withSpring(1,    { damping: 14, stiffness: 340 }); }}
      onPress={onPress}
    >
      <Animated.View style={[styles.dateCell, selected && styles.dateCellSelected, animStyle]}>
        <Text style={[styles.dateCellDay, selected && styles.dateCellTextSelected]}>
          {date.toLocaleDateString('en-GB', { weekday: 'short' })}
        </Text>
        <Text style={[styles.dateCellNum, selected && styles.dateCellTextSelected]}>
          {date.getDate()}
        </Text>
        {isToday && (
          <View style={[styles.todayDot, selected && styles.todayDotSelected]} />
        )}
      </Animated.View>
    </Pressable>
  );
}

// ─────────────────────────────────────────────
//  SlotCard
// ─────────────────────────────────────────────
function SlotCard({
  slot,
  index,
  currentUserId,
  onBook,
  onCancel,
}: {
  slot: BookingSlot;
  index: number;
  currentUserId?: number;
  onBook: () => void;
  onCancel: () => void;
}) {
  const variant    = getVariant(slot, currentUserId);
  const stripColor = STRIP_COLOR[variant];
  const scale      = useSharedValue(1);
  const animStyle  = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const isPast     = new Date(slot.starts_at) < new Date();

  return (
    <Animated.View
      entering={FadeInRight.delay(index * 55).springify().damping(18)}
      style={[styles.slotCard, animStyle]}
    >
      <View style={[styles.slotStrip, { backgroundColor: stripColor }]} />

      <View style={styles.slotBody}>
        <View style={styles.slotTimeRow}>
          <Text style={styles.slotTime}>
            {formatTime(slot.starts_at)}
            <Text style={styles.slotTimeSep}> – </Text>
            {formatTime(slot.ends_at)}
          </Text>
          <StatusBadge variant={variant} />
        </View>

        <View style={styles.slotMetaRow}>
          <Clock3 size={13} color={Colors.neutral[400]} strokeWidth={2} />
          <Text style={styles.slotMeta}>{formatDuration(slot.starts_at, slot.ends_at)}</Text>
        </View>

        <View style={styles.slotAction}>
          {variant === 'AVAILABLE' && !isPast && (
            <Pressable
              onPressIn={() => { scale.value = withSpring(0.95, { damping: 14, stiffness: 340 }); }}
              onPressOut={() => { scale.value = withSpring(1,    { damping: 14, stiffness: 340 }); }}
              onPress={onBook}
              style={styles.bookBtn}
            >
              <Text style={styles.bookBtnText}>Book →</Text>
            </Pressable>
          )}
          {variant === 'AVAILABLE' && isPast && (
            <Text style={styles.pastLabel}>Past</Text>
          )}
          {variant === 'MY_BOOKING' && (
            <Pressable
              onPressIn={() => { scale.value = withSpring(0.95, { damping: 14, stiffness: 340 }); }}
              onPressOut={() => { scale.value = withSpring(1,    { damping: 14, stiffness: 340 }); }}
              onPress={onCancel}
              style={styles.cancelBtn}
            >
              <X size={13} color={Colors.error} strokeWidth={2.5} />
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </Pressable>
          )}
          {variant === 'OTHERS' && (
            <View style={styles.fullChip}>
              <Text style={styles.fullChipText}>Full</Text>
            </View>
          )}
        </View>
      </View>
    </Animated.View>
  );
}

// ─────────────────────────────────────────────
//  StatusBadge
// ─────────────────────────────────────────────
function StatusBadge({ variant }: { variant: SlotVariant }) {
  const MAP = {
    AVAILABLE:  { label: 'Available',  bg: 'rgba(34,197,94,0.12)', color: Colors.success          },
    MY_BOOKING: { label: 'My Booking', bg: Colors.primary[50],      color: Colors.primary[600]     },
    OTHERS:     { label: 'Booked',     bg: Colors.neutral[100],     color: Colors.neutral[500]     },
    CANCELLED:  { label: 'Cancelled',  bg: Colors.neutral[100],     color: Colors.neutral[400]     },
  } as const;
  const { label, bg, color } = MAP[variant];
  return (
    <View style={[styles.statusBadge, { backgroundColor: bg }]}>
      <Text style={[styles.statusBadgeText, { color }]}>{label}</Text>
    </View>
  );
}

// ─────────────────────────────────────────────
//  BookingSheet
// ─────────────────────────────────────────────
function BookingSheet({
  slot,
  shelterName,
  onClose,
  onConfirm,
}: {
  slot: BookingSlot | null;
  shelterName: string;
  onClose: () => void;
  onConfirm: (notes?: string) => Promise<void>;
}) {
  const insets = useSafeAreaInsets();
  const [notes,          setNotes]          = useState('');
  const [loading,        setLoading]        = useState(false);
  const [success,        setSuccess]        = useState(false);
  // ✅ Local snapshot — survives after slot prop becomes null
  const [confirmedSlot,  setConfirmedSlot]  = useState<BookingSlot | null>(null);

  const sheetY      = useSharedValue(700);
  const kbOffset    = useSharedValue(0);
  const bgOpacity   = useSharedValue(0);
  const combinedY   = useDerivedValue(() => sheetY.value + kbOffset.value);

  const sheetStyle    = useAnimatedStyle(() => ({ transform: [{ translateY: combinedY.value }] }));
  const backdropStyle = useAnimatedStyle(() => ({ opacity: bgOpacity.value }));

  const isVisible = slot !== null;

  // Open / close
  useEffect(() => {
    if (isVisible) {
      // Reset all state on open
      setNotes('');
      setSuccess(false);
      setLoading(false);
      setConfirmedSlot(null);
      sheetY.value    = withSpring(0,   { damping: 22, stiffness: 200 });
      bgOpacity.value = withTiming(1,   { duration: 220 });
    } else {
      Keyboard.dismiss();
      kbOffset.value  = 0;
      sheetY.value    = withTiming(700, { duration: 320 });
      bgOpacity.value = withTiming(0,   { duration: 200 });
    }
  }, [isVisible]);

  // Keyboard listeners
  useEffect(() => {
    const showEvt = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvt = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const onShow  = (e: KeyboardEvent) => {
      kbOffset.value = withTiming(-e.endCoordinates.height, {
        duration: Platform.OS === 'ios' ? e.duration : 200,
      });
    };
    const onHide  = (e: KeyboardEvent) => {
      kbOffset.value = withTiming(0, {
        duration: Platform.OS === 'ios' ? e.duration : 200,
      });
    };
    const s1 = Keyboard.addListener(showEvt, onShow);
    const s2 = Keyboard.addListener(hideEvt, onHide);
    return () => { s1.remove(); s2.remove(); };
  }, []);

  const handleConfirm = async () => {
    if (!slot) return;
    setLoading(true);
    try {
      await onConfirm(notes);
      // ✅ Save snapshot BEFORE onClose can set slot → null
      setConfirmedSlot(slot);
      setSuccess(true);
      setTimeout(() => { onClose(); }, 1800);
    } catch (e: any) {
      Alert.alert('Booking failed', e.message ?? 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isVisible && sheetY.value === 700) return null;

  return (
    <>
      {/* Backdrop */}
      <Animated.View
        pointerEvents={isVisible ? 'auto' : 'none'}
        style={[styles.backdrop, backdropStyle]}
      >
        <Pressable style={{ flex: 1 }} onPress={onClose} />
      </Animated.View>

      {/* Sheet */}
      <Animated.View style={[styles.sheet, sheetStyle, { paddingBottom: insets.bottom + Spacing[4] }]}>
        <View style={styles.handle} />

        {success ? (
          // ✅ Use confirmedSlot (local snapshot), never slot! (prop)
          <SuccessView
            slot={confirmedSlot!}
            shelterName={shelterName}
            onDone={onClose}
          />
        ) : (
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.sheetContent}
          >
            {/* Header */}
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Confirm Booking</Text>
              <Pressable
                onPress={onClose}
                style={({ pressed }) => [
                  styles.sheetCloseBtn,
                  pressed && { backgroundColor: Colors.neutral[100] },
                ]}
              >
                <X size={17} color={Colors.neutral[500]} strokeWidth={2} />
              </Pressable>
            </View>

            {/* Summary card */}
            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <Clock3 size={16} color={Colors.primary[500]} strokeWidth={2} />
                <View style={styles.summaryText}>
                  <Text style={styles.summaryLabel}>Time</Text>
                  <Text style={styles.summaryValue}>
                    {slot ? `${formatTime(slot.starts_at)} – ${formatTime(slot.ends_at)}` : ''}
                    {'  '}
                    <Text style={styles.summaryDuration}>
                      {slot ? formatDuration(slot.starts_at, slot.ends_at) : ''}
                    </Text>
                  </Text>
                </View>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryRow}>
                <MapPin size={16} color={Colors.primary[500]} strokeWidth={2} />
                <View style={styles.summaryText}>
                  <Text style={styles.summaryLabel}>Shelter</Text>
                  <Text style={styles.summaryValue}>{shelterName}</Text>
                </View>
              </View>
            </View>

            {/* Notes input */}
            <View style={styles.notesWrap}>
              <View style={styles.notesHeader}>
                <StickyNote size={14} color={Colors.neutral[400]} strokeWidth={2} />
                <Text style={styles.notesLabel}>Notes for the shelter (optional)</Text>
              </View>
              <TextInput
                value={notes}
                onChangeText={setNotes}
                placeholder="e.g. I'm interested in a specific animal..."
                placeholderTextColor={Colors.neutral[300]}
                multiline
                numberOfLines={3}
                style={styles.notesInput}
                textAlignVertical="top"
              />
            </View>

            {/* CTA */}
            <TouchableOpacity
              onPress={handleConfirm}
              disabled={loading}
              activeOpacity={0.8}
              style={[
                styles.confirmBtn,
                loading && { opacity: 0.7 },
              ]}
            >
              {loading
                ? <ActivityIndicator color={Colors.neutral[0]} />
                : <Text style={styles.confirmBtnText}>✓  Confirm Booking</Text>
              }
            </TouchableOpacity>

            <Text style={styles.disclaimer}>
              You can cancel your booking at any time from this screen.
            </Text>
          </ScrollView>
        )}
      </Animated.View>
    </>
  );
}

// ─────────────────────────────────────────────
//  SuccessView
// ─────────────────────────────────────────────
function SuccessView({
  slot,
  shelterName,
  onDone,
}: {
  slot: BookingSlot;
  shelterName: string;
  onDone: () => void;
}) {
  return (
    <Animated.View entering={ZoomIn.springify().damping(14)} style={styles.successWrap}>
      <View style={styles.successIcon}>
        <CheckCircle2 size={52} color={Colors.primary[500]} strokeWidth={1.6} />
      </View>

      <View style={styles.successTitleRow}>
        <Text style={styles.successTitle}>All Set!</Text>
        <Sparkles size={22} color={Colors.primary[400]} strokeWidth={1.8} />
      </View>

      <Text style={styles.successSub}>
        {formatDateLabel(new Date(slot.starts_at + 'Z'))}{'\n'}
        {formatTime(slot.starts_at)} – {formatTime(slot.ends_at)}{'\n'}
        {shelterName}
      </Text>

      <Pressable
        onPress={onDone}
        style={({ pressed }) => [
          styles.confirmBtn,
          styles.successDoneBtn,
          pressed && { backgroundColor: Colors.primary[600] },
        ]}
      >
        <Text style={styles.confirmBtnText}>Done</Text>
      </Pressable>
    </Animated.View>
  );
}

// ─────────────────────────────────────────────
//  Loading / Empty / Error states
// ─────────────────────────────────────────────
function LoadingSlots() {
  return (
    <View style={styles.loadingWrap}>
      <ActivityIndicator size="large" color={Colors.primary[500]} />
      <Text style={styles.loadingText}>Loading available slots…</Text>
    </View>
  );
}

function EmptySlots() {
  return (
    <Animated.View entering={FadeInDown.springify().damping(18)} style={styles.emptyWrap}>
      <View style={styles.emptyIcon}>
        <CalendarX2 size={40} color={Colors.primary[300]} strokeWidth={1.5} />
      </View>
      <Text style={styles.emptyTitle}>No slots available</Text>
      <Text style={styles.emptySub}>Try selecting a different date</Text>
    </Animated.View>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <Animated.View entering={FadeInDown.springify().damping(18)} style={styles.emptyWrap}>
      <Text style={styles.emptyTitle}>Something went wrong</Text>
      <Text style={styles.emptySub}>{message}</Text>
      <Pressable onPress={onRetry} style={styles.retryBtn}>
        <Text style={styles.retryText}>Try again</Text>
      </Pressable>
    </Animated.View>
  );
}

// ─────────────────────────────────────────────
//  Styles
// ─────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.neutral[50],
  },

  // ── Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    gap: Spacing[3],
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: Colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: { flex: 1 },
  headerTitle: {
    color: Colors.neutral[900],
    fontSize: FontSize['2xl'],
    fontWeight: FontWeight.extrabold,
    letterSpacing: -0.4,
  },
  headerSub: {
    color: Colors.neutral[400],
    fontSize: FontSize.sm,
    marginTop: 1,
  },

  // ── Date strip
  dateList: {
    paddingHorizontal: Spacing[4],
    paddingBottom: Spacing[4],
    gap: Spacing[2],
  },
  dateCell: {
    width: 52,
    paddingVertical: Spacing[3],
    borderRadius: Radius.lg,
    alignItems: 'center',
    gap: Spacing[1],
    backgroundColor: Colors.neutral[0],
    borderWidth: 1.5,
    borderColor: Colors.neutral[150],
  },
  dateCellSelected: {
    backgroundColor: Colors.primary[500],
    borderColor: Colors.primary[500],
    ...Shadow.orange,
  },
  dateCellDay: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: Colors.neutral[400],
  },
  dateCellNum: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.extrabold,
    color: Colors.neutral[800],
  },
  dateCellTextSelected: {
    color: Colors.neutral[0],
  },
  todayDot: {
    width: 5,
    height: 5,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary[400],
    marginTop: 1,
  },
  todayDotSelected: {
    backgroundColor: 'rgba(255,255,255,0.6)',
  },

  // ── Scroll
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: Spacing[4],
    paddingBottom: Spacing[10],
    gap: Spacing[3],
  },

  // ── Count row
  countRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateLabel: {
    color: Colors.neutral[700],
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
  },
  countBadge: {
    backgroundColor: Colors.primary[50],
    borderRadius: Radius.full,
    paddingHorizontal: Spacing[3],
    paddingVertical: 4,
  },
  countText: {
    color: Colors.primary[600],
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },

  // ── Slot card
  slotCard: {
    flexDirection: 'row',
    backgroundColor: Colors.neutral[0],
    borderRadius: Radius.xl,
    overflow: 'hidden',
    ...Shadow.sm,
  },
  slotStrip: { width: 5 },
  slotBody: {
    flex: 1,
    padding: Spacing[4],
    gap: Spacing[2],
  },
  slotTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  slotTime: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.neutral[900],
    letterSpacing: -0.3,
  },
  slotTimeSep: {
    color: Colors.neutral[400],
    fontWeight: FontWeight.regular,
  },
  slotMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[1],
  },
  slotMeta: {
    fontSize: FontSize.sm,
    color: Colors.neutral[400],
    fontWeight: FontWeight.medium,
  },
  slotAction: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: Spacing[1],
  },
  bookBtn: {
    backgroundColor: Colors.primary[500],
    borderRadius: Radius.md,
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[2],
    ...Shadow.orange,
  },
  bookBtnText: {
    color: Colors.neutral[0],
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  cancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1.5,
    borderColor: Colors.error,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[2],
  },
  cancelBtnText: {
    color: Colors.error,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
  fullChip: {
    backgroundColor: Colors.neutral[100],
    borderRadius: Radius.md,
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[2],
  },
  fullChipText: {
    color: Colors.neutral[400],
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
  pastLabel: {
    color: Colors.neutral[300],
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },

  // ── Status badge
  statusBadge: {
    borderRadius: Radius.full,
    paddingHorizontal: Spacing[3],
    paddingVertical: 3,
  },
  statusBadgeText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
  },

  // ── Loading / Empty
  loadingWrap: {
    alignItems: 'center',
    marginTop: Spacing[16],
    gap: Spacing[4],
  },
  loadingText: {
    color: Colors.neutral[400],
    fontSize: FontSize.base,
  },
  emptyWrap: {
    alignItems: 'center',
    marginTop: Spacing[12],
    gap: Spacing[3],
  },
  emptyIcon: {
    width: 88,
    height: 88,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing[2],
  },
  emptyTitle: {
    color: Colors.neutral[800],
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
  },
  emptySub: {
    color: Colors.neutral[400],
    fontSize: FontSize.base,
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: Spacing[3],
    backgroundColor: Colors.primary[50],
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing[6],
    paddingVertical: Spacing[3],
  },
  retryText: {
    color: Colors.primary[600],
    fontWeight: FontWeight.semibold,
    fontSize: FontSize.base,
  },

  // ── Backdrop
  backdrop: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: Colors.overlay.dark,
  },

  // ── Sheet
  sheet: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    backgroundColor: Colors.neutral[0],
    borderTopLeftRadius: Radius['2xl'],
    borderTopRightRadius: Radius['2xl'],
    maxHeight: '90%',
    ...Shadow.lg,
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.neutral[200],
    marginTop: Spacing[3],
    marginBottom: Spacing[1],
  },
  sheetContent: {
    paddingHorizontal: Spacing[6],
    paddingTop: Spacing[2],
    paddingBottom: Spacing[2],
    gap: Spacing[5],
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sheetTitle: {
    color: Colors.neutral[900],
    fontSize: FontSize.xl,
    fontWeight: FontWeight.extrabold,
  },
  sheetCloseBtn: {
    width: 34,
    height: 34,
    borderRadius: Radius.full,
    backgroundColor: Colors.neutral[50],
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Summary card
  summaryCard: {
    backgroundColor: Colors.neutral[50],
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.neutral[150],
    overflow: 'hidden',
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    padding: Spacing[4],
  },
  summaryText: { flex: 1 },
  summaryLabel: {
    color: Colors.neutral[400],
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  summaryValue: {
    color: Colors.neutral[800],
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
  },
  summaryDuration: {
    color: Colors.neutral[400],
    fontWeight: FontWeight.regular,
    fontSize: FontSize.sm,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: Colors.neutral[150],
  },

  // ── Notes
  notesWrap: { gap: Spacing[2] },
  notesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
  },
  notesLabel: {
    color: Colors.neutral[500],
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
  notesInput: {
    backgroundColor: Colors.neutral[50],
    borderWidth: 1.5,
    borderColor: Colors.neutral[200],
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    color: Colors.neutral[900],
    fontSize: FontSize.base,
    minHeight: 90,
    fontWeight: FontWeight.regular,
  },

  // ── Confirm button
  confirmBtn: {
    backgroundColor: Colors.primary[500],
    borderRadius: Radius.xl,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnText: {
    color: Colors.neutral[0],
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
  disclaimer: {
    color: Colors.neutral[400],
    fontSize: FontSize.xs,
    textAlign: 'center',
  },

  // ── Success
  successWrap: {
    alignItems: 'center',
    paddingHorizontal: Spacing[6],
    paddingTop: Spacing[5],
    paddingBottom: Spacing[3],
    gap: Spacing[4],
  },
  successIcon: {
    width: 96,
    height: 96,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  successTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
  },
  successTitle: {
    color: Colors.neutral[900],
    fontSize: FontSize['2xl'],
    fontWeight: FontWeight.extrabold,
    letterSpacing: -0.3,
  },
  successDoneBtn: {
    alignSelf: 'stretch',
    marginTop: Spacing[2],
  },
  successSub: {
    color: Colors.neutral[500],
    fontSize: FontSize.base,
    textAlign: 'center',
    lineHeight: FontSize.base * 1.6,
  },
});