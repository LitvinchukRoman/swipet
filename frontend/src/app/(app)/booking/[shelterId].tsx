import { router, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  CalendarX2,
  CheckCircle2,
  Clock3,
  MapPin,
  Sparkles,
  StickyNote,
  Users,
  X,
} from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
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
  useSharedValue,
  withSpring,
  withTiming,
  ZoomIn,
} from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { useBookingStore } from '@/store/booking';
import { spotsLeft, type Slot } from '@/services/booking';
import { Colors, FontSize, FontWeight, Radius, Shadow, Spacing } from '@/lib/theme';
import { notify } from '@/lib/notify';

// ─── Helpers ──────────────────────────────────
/** Ключ дати без зсуву таймзони — беремо префікс ISO LocalDateTime. */
const dateKey = (iso: string) => iso.slice(0, 10);

const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

const formatDuration = (start: string, end: string) => {
  const mins = Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60_000);
  if (mins < 60) return `${mins}min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
};

const formatDateLabel = (key: string) =>
  new Date(key + 'T12:00:00').toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

const isPast = (iso: string) => new Date(iso).getTime() < Date.now();

// ─────────────────────────────────────────────
//  Screen
// ─────────────────────────────────────────────
export default function BookingScreen() {
  const params = useLocalSearchParams<{
    shelterId: string;
    shelterName?: string;
    animalName?: string;
  }>();
  const shelterId = parseInt(params.shelterId, 10);
  const shelterName = params.shelterName ?? 'Shelter';
  const animalName = params.animalName;

  const { slots, isLoading, error, fetchSlots, bookSlot } = useBookingStore();

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [confirmSlot, setConfirmSlot] = useState<Slot | null>(null);

  useEffect(() => {
    fetchSlots(shelterId);
  }, [shelterId]);

  // Дати, у яких є слоти (унікальні, відсортовані)
  const dates = useMemo(() => {
    const set = new Set(slots.map((s) => dateKey(s.startTime)));
    return [...set].sort();
  }, [slots]);

  // Автовибір першої доступної дати
  useEffect(() => {
    if (dates.length > 0 && (!selectedDate || !dates.includes(selectedDate))) {
      setSelectedDate(dates[0]);
    }
  }, [dates]);

  const visibleSlots = useMemo(
    () =>
      slots
        .filter((s) => dateKey(s.startTime) === selectedDate)
        .sort((a, b) => a.startTime.localeCompare(b.startTime)),
    [slots, selectedDate],
  );

  const availableCount = visibleSlots.filter((s) => spotsLeft(s) > 0 && !isPast(s.startTime)).length;

  return (
    <>
      <SafeAreaView style={styles.screen} edges={['top']}>
        {/* ── Header ── */}
        <Animated.View entering={FadeInDown.duration(300)} style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7} style={styles.backBtn}>
            <ArrowLeft size={22} color={Colors.neutral[700]} strokeWidth={2.2} />
          </TouchableOpacity>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Book a Visit</Text>
            <Text style={styles.headerSub} numberOfLines={1}>
              {shelterName}
              {animalName ? ` · ${animalName}` : ''}
            </Text>
          </View>
        </Animated.View>

        {/* ── Date strip ── */}
        {dates.length > 0 && (
          <Animated.View entering={FadeInDown.delay(60).duration(300)}>
            <FlatList
              data={dates}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(d) => d}
              contentContainerStyle={styles.dateList}
              renderItem={({ item }) => (
                <DateCell
                  dateKeyStr={item}
                  selected={item === selectedDate}
                  onPress={() => setSelectedDate(item)}
                />
              )}
            />
          </Animated.View>
        )}

        {/* ── Content ── */}
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {isLoading ? (
            <LoadingSlots />
          ) : error ? (
            <ErrorState message={error} onRetry={() => fetchSlots(shelterId)} />
          ) : visibleSlots.length === 0 ? (
            <EmptySlots />
          ) : (
            <>
              <Animated.View entering={FadeIn.delay(80)} style={styles.countRow}>
                <Text style={styles.dateLabel}>{selectedDate ? formatDateLabel(selectedDate) : ''}</Text>
                {availableCount > 0 && (
                  <View style={styles.countBadge}>
                    <Text style={styles.countText}>{availableCount} available</Text>
                  </View>
                )}
              </Animated.View>

              {visibleSlots.map((slot, index) => (
                <SlotCard key={slot.id} slot={slot} index={index} onBook={() => setConfirmSlot(slot)} />
              ))}
            </>
          )}
        </ScrollView>
      </SafeAreaView>

      <BookingSheet
        slot={confirmSlot}
        shelterName={shelterName}
        onClose={() => setConfirmSlot(null)}
        onConfirm={async (notes) => {
          if (!confirmSlot) return;
          await bookSlot(confirmSlot.id, notes);
        }}
      />
    </>
  );
}

// ─── DateCell ──────────────────────────────────
function DateCell({ dateKeyStr, selected, onPress }: { dateKeyStr: string; selected: boolean; onPress: () => void }) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const d = new Date(dateKeyStr + 'T12:00:00');
  const isToday = dateKeyStr === new Date().toISOString().slice(0, 10);

  return (
    <Pressable
      onPressIn={() => { scale.value = withSpring(0.88, { damping: 14, stiffness: 340 }); }}
      onPressOut={() => { scale.value = withSpring(1, { damping: 14, stiffness: 340 }); }}
      onPress={onPress}
    >
      <Animated.View style={[styles.dateCell, selected && styles.dateCellSelected, animStyle]}>
        <Text style={[styles.dateCellDay, selected && styles.dateCellTextSelected]}>
          {d.toLocaleDateString('en-GB', { weekday: 'short' })}
        </Text>
        <Text style={[styles.dateCellNum, selected && styles.dateCellTextSelected]}>{d.getDate()}</Text>
        {isToday && <View style={[styles.todayDot, selected && styles.todayDotSelected]} />}
      </Animated.View>
    </Pressable>
  );
}

// ─── SlotCard ──────────────────────────────────
function SlotCard({ slot, index, onBook }: { slot: Slot; index: number; onBook: () => void }) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const left = spotsLeft(slot);
  const past = isPast(slot.startTime);
  const full = left === 0;
  const stripColor = past || full ? Colors.neutral[300] : Colors.success;

  return (
    <Animated.View entering={FadeInRight.delay(index * 55).springify().damping(18)} style={[styles.slotCard, animStyle]}>
      <View style={[styles.slotStrip, { backgroundColor: stripColor }]} />
      <View style={styles.slotBody}>
        <View style={styles.slotTimeRow}>
          <Text style={styles.slotTime}>
            {formatTime(slot.startTime)}
            <Text style={styles.slotTimeSep}> – </Text>
            {formatTime(slot.endTime)}
          </Text>
          <View style={[styles.spotsBadge, full && styles.spotsBadgeFull]}>
            <Users size={12} color={full ? Colors.neutral[400] : Colors.success} strokeWidth={2} />
            <Text style={[styles.spotsText, { color: full ? Colors.neutral[400] : Colors.success }]}>
              {full ? 'Full' : `${left} left`}
            </Text>
          </View>
        </View>

        <View style={styles.slotMetaRow}>
          <Clock3 size={13} color={Colors.neutral[400]} strokeWidth={2} />
          <Text style={styles.slotMeta}>{formatDuration(slot.startTime, slot.endTime)}</Text>
          <Text style={styles.slotMetaDot}>·</Text>
          <Text style={styles.slotMeta}>{slot.bookedCount}/{slot.maxGuests} booked</Text>
        </View>

        <View style={styles.slotAction}>
          {past ? (
            <Text style={styles.pastLabel}>Past</Text>
          ) : full ? (
            <View style={styles.fullChip}>
              <Text style={styles.fullChipText}>No spots</Text>
            </View>
          ) : (
            <Pressable
              onPressIn={() => { scale.value = withSpring(0.95, { damping: 14, stiffness: 340 }); }}
              onPressOut={() => { scale.value = withSpring(1, { damping: 14, stiffness: 340 }); }}
              onPress={onBook}
              style={styles.bookBtn}
            >
              <Text style={styles.bookBtnText}>Book →</Text>
            </Pressable>
          )}
        </View>
      </View>
    </Animated.View>
  );
}

// ─── BookingSheet (confirm + notes + success) ──
function BookingSheet({
  slot,
  shelterName,
  onClose,
  onConfirm,
}: {
  slot: Slot | null;
  shelterName: string;
  onClose: () => void;
  onConfirm: (notes?: string) => Promise<void>;
}) {
  const insets = useSafeAreaInsets();
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [confirmedSlot, setConfirmedSlot] = useState<Slot | null>(null);

  const sheetY = useSharedValue(700);
  const bgOpacity = useSharedValue(0);
  const sheetStyle = useAnimatedStyle(() => ({ transform: [{ translateY: sheetY.value }] }));
  const backdropStyle = useAnimatedStyle(() => ({ opacity: bgOpacity.value }));
  const isVisible = slot !== null;

  useEffect(() => {
    if (isVisible) {
      setNotes('');
      setSuccess(false);
      setLoading(false);
      setConfirmedSlot(null);
      sheetY.value = withSpring(0, { damping: 22, stiffness: 200 });
      bgOpacity.value = withTiming(1, { duration: 220 });
    } else {
      sheetY.value = withTiming(700, { duration: 320 });
      bgOpacity.value = withTiming(0, { duration: 200 });
    }
  }, [isVisible]);

  const handleConfirm = async () => {
    if (!slot) return;
    setLoading(true);
    try {
      await onConfirm(notes.trim() || undefined);
      setConfirmedSlot(slot);
      setSuccess(true);
      setTimeout(onClose, 1800);
    } catch (e: any) {
      notify('Booking failed', e?.message ?? 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isVisible && sheetY.value === 700) return null;

  return (
    <>
      <Animated.View pointerEvents={isVisible ? 'auto' : 'none'} style={[styles.backdrop, backdropStyle]}>
        <Pressable style={{ flex: 1 }} onPress={onClose} />
      </Animated.View>

      <Animated.View style={[styles.sheet, sheetStyle, { paddingBottom: insets.bottom + Spacing[4] }]}>
        <View style={styles.handle} />
        {success ? (
          <SuccessView slot={confirmedSlot!} shelterName={shelterName} onDone={onClose} />
        ) : (
          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={styles.sheetContent}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Confirm Booking</Text>
              <Pressable onPress={onClose} style={styles.sheetCloseBtn}>
                <X size={17} color={Colors.neutral[500]} strokeWidth={2} />
              </Pressable>
            </View>

            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <Clock3 size={16} color={Colors.primary[500]} strokeWidth={2} />
                <View style={styles.summaryText}>
                  <Text style={styles.summaryLabel}>Time</Text>
                  <Text style={styles.summaryValue}>
                    {slot ? `${formatTime(slot.startTime)} – ${formatTime(slot.endTime)}` : ''}
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

            <TouchableOpacity onPress={handleConfirm} disabled={loading} activeOpacity={0.8} style={[styles.confirmBtn, loading && { opacity: 0.7 }]}>
              {loading ? <ActivityIndicator color={Colors.neutral[0]} /> : <Text style={styles.confirmBtnText}>✓  Confirm Booking</Text>}
            </TouchableOpacity>
          </ScrollView>
        )}
      </Animated.View>
    </>
  );
}

function SuccessView({ slot, shelterName, onDone }: { slot: Slot; shelterName: string; onDone: () => void }) {
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
        {formatDateLabel(dateKey(slot.startTime))}{'\n'}
        {formatTime(slot.startTime)} – {formatTime(slot.endTime)}{'\n'}
        {shelterName}
      </Text>
      <Pressable onPress={onDone} style={[styles.confirmBtn, styles.successDoneBtn]}>
        <Text style={styles.confirmBtnText}>Done</Text>
      </Pressable>
    </Animated.View>
  );
}

// ─── States ────────────────────────────────────
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
      <Text style={styles.emptySub}>Check back later for new visit times</Text>
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

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.neutral[50] },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing[4], paddingVertical: Spacing[3], gap: Spacing[3] },
  backBtn: { width: 40, height: 40, borderRadius: Radius.md, backgroundColor: Colors.neutral[100], alignItems: 'center', justifyContent: 'center' },
  headerText: { flex: 1 },
  headerTitle: { color: Colors.neutral[900], fontSize: FontSize['2xl'], fontWeight: FontWeight.extrabold, letterSpacing: -0.4 },
  headerSub: { color: Colors.neutral[400], fontSize: FontSize.sm, marginTop: 1 },

  dateList: { paddingHorizontal: Spacing[4], paddingBottom: Spacing[4], gap: Spacing[2] },
  dateCell: { width: 52, paddingVertical: Spacing[3], borderRadius: Radius.lg, alignItems: 'center', gap: Spacing[1], backgroundColor: Colors.neutral[0], borderWidth: 1.5, borderColor: Colors.neutral[150] },
  dateCellSelected: { backgroundColor: Colors.primary[500], borderColor: Colors.primary[500], ...Shadow.orange },
  dateCellDay: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold, color: Colors.neutral[400] },
  dateCellNum: { fontSize: FontSize.lg, fontWeight: FontWeight.extrabold, color: Colors.neutral[800] },
  dateCellTextSelected: { color: Colors.neutral[0] },
  todayDot: { width: 5, height: 5, borderRadius: Radius.full, backgroundColor: Colors.primary[400], marginTop: 1 },
  todayDotSelected: { backgroundColor: 'rgba(255,255,255,0.6)' },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: Spacing[4], paddingBottom: Spacing[10], gap: Spacing[3] },
  countRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dateLabel: { color: Colors.neutral[700], fontSize: FontSize.base, fontWeight: FontWeight.semibold },
  countBadge: { backgroundColor: Colors.primary[50], borderRadius: Radius.full, paddingHorizontal: Spacing[3], paddingVertical: 4 },
  countText: { color: Colors.primary[600], fontSize: FontSize.xs, fontWeight: FontWeight.bold },

  slotCard: { flexDirection: 'row', backgroundColor: Colors.neutral[0], borderRadius: Radius.xl, overflow: 'hidden', ...Shadow.sm },
  slotStrip: { width: 5 },
  slotBody: { flex: 1, padding: Spacing[4], gap: Spacing[2] },
  slotTimeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  slotTime: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.neutral[900], letterSpacing: -0.3 },
  slotTimeSep: { color: Colors.neutral[400], fontWeight: FontWeight.regular },
  spotsBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(34,197,94,0.12)', borderRadius: Radius.full, paddingHorizontal: Spacing[3], paddingVertical: 3 },
  spotsBadgeFull: { backgroundColor: Colors.neutral[100] },
  spotsText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold },
  slotMetaRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing[1] },
  slotMeta: { fontSize: FontSize.sm, color: Colors.neutral[400], fontWeight: FontWeight.medium },
  slotMetaDot: { color: Colors.neutral[300], marginHorizontal: 2 },
  slotAction: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: Spacing[1] },
  bookBtn: { backgroundColor: Colors.primary[500], borderRadius: Radius.md, paddingHorizontal: Spacing[4], paddingVertical: Spacing[2], ...Shadow.orange },
  bookBtnText: { color: Colors.neutral[0], fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  fullChip: { backgroundColor: Colors.neutral[100], borderRadius: Radius.md, paddingHorizontal: Spacing[3], paddingVertical: Spacing[2] },
  fullChipText: { color: Colors.neutral[400], fontSize: FontSize.sm, fontWeight: FontWeight.medium },
  pastLabel: { color: Colors.neutral[300], fontSize: FontSize.sm, fontWeight: FontWeight.medium },

  loadingWrap: { alignItems: 'center', marginTop: Spacing[16], gap: Spacing[4] },
  loadingText: { color: Colors.neutral[400], fontSize: FontSize.base },
  emptyWrap: { alignItems: 'center', marginTop: Spacing[12], gap: Spacing[3] },
  emptyIcon: { width: 88, height: 88, borderRadius: Radius.full, backgroundColor: Colors.primary[50], alignItems: 'center', justifyContent: 'center', marginBottom: Spacing[2] },
  emptyTitle: { color: Colors.neutral[800], fontSize: FontSize.xl, fontWeight: FontWeight.bold },
  emptySub: { color: Colors.neutral[400], fontSize: FontSize.base, textAlign: 'center' },
  retryBtn: { marginTop: Spacing[3], backgroundColor: Colors.primary[50], borderRadius: Radius.lg, paddingHorizontal: Spacing[6], paddingVertical: Spacing[3] },
  retryText: { color: Colors.primary[600], fontWeight: FontWeight.semibold, fontSize: FontSize.base },

  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: Colors.overlay.dark },
  sheet: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: Colors.neutral[0], borderTopLeftRadius: Radius['2xl'], borderTopRightRadius: Radius['2xl'], maxHeight: '90%', ...Shadow.lg },
  handle: { alignSelf: 'center', width: 36, height: 4, borderRadius: 2, backgroundColor: Colors.neutral[200], marginTop: Spacing[3], marginBottom: Spacing[1] },
  sheetContent: { paddingHorizontal: Spacing[6], paddingTop: Spacing[2], paddingBottom: Spacing[2], gap: Spacing[5] },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sheetTitle: { color: Colors.neutral[900], fontSize: FontSize.xl, fontWeight: FontWeight.extrabold },
  sheetCloseBtn: { width: 34, height: 34, borderRadius: Radius.full, backgroundColor: Colors.neutral[50], alignItems: 'center', justifyContent: 'center' },
  summaryCard: { backgroundColor: Colors.neutral[50], borderRadius: Radius.xl, borderWidth: 1, borderColor: Colors.neutral[150], overflow: 'hidden' },
  summaryRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing[3], padding: Spacing[4] },
  summaryText: { flex: 1 },
  summaryLabel: { color: Colors.neutral[400], fontSize: FontSize.xs, fontWeight: FontWeight.semibold, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  summaryValue: { color: Colors.neutral[800], fontSize: FontSize.md, fontWeight: FontWeight.semibold },
  summaryDivider: { height: 1, backgroundColor: Colors.neutral[150] },
  notesWrap: { gap: Spacing[2] },
  notesHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing[2] },
  notesLabel: { color: Colors.neutral[500], fontSize: FontSize.sm, fontWeight: FontWeight.medium },
  notesInput: { backgroundColor: Colors.neutral[50], borderWidth: 1.5, borderColor: Colors.neutral[200], borderRadius: Radius.lg, paddingHorizontal: Spacing[4], paddingVertical: Spacing[3], color: Colors.neutral[900], fontSize: FontSize.base, minHeight: 90 },
  confirmBtn: { backgroundColor: Colors.primary[500], borderRadius: Radius.xl, height: 56, alignItems: 'center', justifyContent: 'center' },
  confirmBtnText: { color: Colors.neutral[0], fontSize: FontSize.md, fontWeight: FontWeight.bold },
  successWrap: { alignItems: 'center', paddingHorizontal: Spacing[6], paddingTop: Spacing[5], paddingBottom: Spacing[3], gap: Spacing[4] },
  successIcon: { width: 96, height: 96, borderRadius: Radius.full, backgroundColor: Colors.primary[50], alignItems: 'center', justifyContent: 'center' },
  successTitleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing[2] },
  successTitle: { color: Colors.neutral[900], fontSize: FontSize['2xl'], fontWeight: FontWeight.extrabold, letterSpacing: -0.3 },
  successDoneBtn: { alignSelf: 'stretch', marginTop: Spacing[2] },
  successSub: { color: Colors.neutral[500], fontSize: FontSize.base, textAlign: 'center', lineHeight: FontSize.base * 1.6 },
});
